const pool = require("../configs/db");

const Message = {
  async initTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          chat_room_id INT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
          sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'audio', 'image'
          content TEXT,
          audio_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          is_read BOOLEAN DEFAULT FALSE
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_chat_room ON messages(chat_room_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      `);
    } catch (error) {
      console.error("messages table initialization error:", error.message);
    }
  },

  // Create a new message
  async createMessage(chatRoomId, senderId, messageType, content, audioUrl = null) {
    try {
      const result = await pool.query(
        `INSERT INTO messages 
         (chat_room_id, sender_id, message_type, content, audio_url, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [chatRoomId, senderId, messageType, content, audioUrl]
      );

      return result.rows[0];
    } catch (error) {
      console.error("CREATE MESSAGE ERROR:", error);
      throw error;
    }
  },
  async getMessagesByChatRoom(chatRoomId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT 
          m.*,
          u.name as sender_name,
          u.profile_image_public_id
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.chat_room_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3`,
        [chatRoomId, limit, offset]
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
        `SELECT COUNT(*) as count
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
  }
};

Message.initTable();

module.exports = Message;