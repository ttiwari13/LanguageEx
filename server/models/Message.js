const pool = require("../configs/db");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const Message = {
  async initTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          chat_room_id INT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
          sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

          -- Message Types
          message_type VARCHAR(20) DEFAULT 'text',  -- text, audio, image, etc.

          -- Text Content
          content TEXT,

          -- Audio Fields
          audio_url TEXT,
          cloudinary_audio_id TEXT,
          audio_duration INT,

          -- General Fields
          created_at TIMESTAMP DEFAULT NOW(),
          is_read BOOLEAN DEFAULT FALSE,
          is_deleted_for_everyone BOOLEAN DEFAULT FALSE
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_chat_room ON messages(chat_room_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      `);

      console.log("messages table initialized");
    } catch (error) {
      console.error("messages table initialization error:", error.message);
    }
  },
  async createMessage(chatRoomId, senderId, messageType, content) {
    try {
      const result = await pool.query(
        `INSERT INTO messages 
        (chat_room_id, sender_id, message_type, content, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *`,
        [chatRoomId, senderId, messageType, content]
      );

      return result.rows[0];
    } catch (error) {
      console.error("CREATE MESSAGE ERROR:", error);
      throw error;
    }
  },
  uploadAudioToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'langex/audio_messages',
          format: 'mp3'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });
  },

  async createAudioMessage(chatRoomId, senderId, audioBuffer, duration = null) {
    try {
      const upload = await this.uploadAudioToCloudinary(audioBuffer);

      const result = await pool.query(
        `INSERT INTO messages 
        (chat_room_id, sender_id, message_type, audio_url, cloudinary_audio_id, audio_duration)
        VALUES ($1, $2, 'audio', $3, $4, $5)
        RETURNING *`,
        [chatRoomId, senderId, upload.secure_url, upload.public_id, duration]
      );

      return result.rows[0];
    } catch (error) {
      console.error("CREATE AUDIO MESSAGE ERROR:", error);
      throw error;
    }
  },
  async getMessagesByChatRoom(chatRoomId, userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          m.*,
          u.name AS sender_name,
          u.profile_image_public_id,
          dm.id AS deleted_for_me
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN deleted_messages dm 
          ON dm.message_id = m.id AND dm.user_id = $2
        WHERE m.chat_room_id = $1
          AND m.is_deleted_for_everyone = FALSE
          AND dm.id IS NULL
        ORDER BY m.created_at DESC
        LIMIT $3 OFFSET $4`,
        [chatRoomId, userId, limit, offset]
      );

      return result.rows.reverse(); 
    } catch (error) {
      console.error("GET MESSAGES ERROR:", error);
      throw error;
    }
  },
  async markAsRead(chatRoomId, userId) {
    try {
      const result = await pool.query(
        `UPDATE messages
         SET is_read = TRUE
         WHERE chat_room_id = $1
         AND sender_id != $2
         AND is_read = FALSE
         RETURNING *`,
        [chatRoomId, userId]
      );

      return result.rows;
    } catch (error) {
      console.error("MARK AS READ ERROR:", error);
      throw error;
    }
  },
  async getUnreadCount(chatRoomId, userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) AS count
         FROM messages
         WHERE chat_room_id = $1
         AND sender_id != $2
         AND is_read = FALSE`,
        [chatRoomId, userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error("GET UNREAD COUNT ERROR:", error);
      throw error;
    }
  },
  async deleteAudioMessage(messageId) {
    try {
      const msg = await pool.query(
        `SELECT cloudinary_audio_id FROM messages WHERE id = $1`,
        [messageId]
      );

      if (msg.rows[0]?.cloudinary_audio_id) {
        await cloudinary.uploader.destroy(msg.rows[0].cloudinary_audio_id, {
          resource_type: "video"
        });
      }

      await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);

      return { success: true };
    } catch (error) {
      console.error("DELETE AUDIO MESSAGE ERROR:", error);
      throw error;
    }
  },

  async deleteForMe(messageId, userId) {
    try {
      await pool.query(
        `INSERT INTO deleted_messages (message_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [messageId, userId]
      );

      return { success: true };
    } catch (error) {
      console.error("DELETE FOR ME ERROR:", error);
      throw error;
    }
  },

  async deleteForEveryone(messageId) {
    try {
      await pool.query(
        `UPDATE messages
         SET is_deleted_for_everyone = TRUE
         WHERE id = $1`,
        [messageId]
      );

      return { success: true };
    } catch (error) {
      console.error("DELETE FOR EVERYONE ERROR:", error);
      throw error;
    }
  }
};

Message.initTable();

module.exports = Message;
