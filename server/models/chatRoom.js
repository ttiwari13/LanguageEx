// ============================================
const pool = require("../configs/db");

const ChatRoom = {
  async initTable() {
    try {
      // Create chat_rooms table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id SERIAL PRIMARY KEY,
          user1_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user2_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          CHECK (user1_id != user2_id)
        );
      `);

      // Unique pair index to avoid duplicate chat rooms
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_chat_room
        ON chat_rooms (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_user1 ON chat_rooms(user1_id);
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_user2 ON chat_rooms(user2_id);
      `);

      // deleted_messages table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS deleted_messages (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          deleted_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(message_id, user_id)
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_deleted_messages_user ON deleted_messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_deleted_messages_message ON deleted_messages(message_id);
      `);

      console.log("chat_rooms and deleted_messages tables initialized");
    } catch (error) {
      console.error("chat_rooms table initialization error:", error);
    }
  },

  async createChatRoom(user1_id, user2_id) {
    try {
      const existingRoom = await pool.query(
        `SELECT id FROM chat_rooms 
         WHERE (user1_id = $1 AND user2_id = $2)
            OR (user1_id = $2 AND user2_id = $1)`,
        [user1_id, user2_id]
      );

      if (existingRoom.rows.length > 0) {
        return existingRoom.rows[0];
      }

      const result = await pool.query(
        `INSERT INTO chat_rooms (user1_id, user2_id, created_at)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [user1_id, user2_id]
      );

      return result.rows[0];
    } catch (error) {
      console.error("CREATE CHAT ROOM ERROR:", error);
      throw error;
    }
  },

  async getChatRoomsByUserId(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          cr.id as chat_room_id,
          cr.created_at,
          CASE 
            WHEN cr.user1_id = $1 THEN cr.user2_id
            ELSE cr.user1_id
          END as friend_id,
          u.name as friend_name,
          u.username as friend_username,
          u.profile_image_public_id,
          vc.last_call_time
        FROM chat_rooms cr
        JOIN users u ON (
          CASE 
            WHEN cr.user1_id = $1 THEN cr.user2_id
            ELSE cr.user1_id
          END = u.id
        )
        LEFT JOIN (
          SELECT 
            chat_room_id,
            MAX(created_at) as last_call_time
          FROM video_calls
          GROUP BY chat_room_id
        ) vc ON vc.chat_room_id = cr.id
        WHERE cr.user1_id = $1 OR cr.user2_id = $1
        ORDER BY vc.last_call_time DESC NULLS LAST, cr.created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      console.error("GET CHAT ROOMS ERROR:", error);
      throw error;
    }
  },

  async getChatRoomById(chatRoomId) {
    try {
      const result = await pool.query(
        `SELECT * FROM chat_rooms WHERE id = $1`,
        [chatRoomId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("GET CHAT ROOM BY ID ERROR:", error);
      throw error;
    }
  },

  async isUserInChatRoom(chatRoomId, userId) {
    try {
      const result = await pool.query(
        `SELECT id FROM chat_rooms 
         WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
        [chatRoomId, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error("CHECK USER IN CHAT ROOM ERROR:", error);
      throw error;
    }
  },

  async deleteChatRoom(chatRoomId) {
    try {
      const result = await pool.query(
        `DELETE FROM chat_rooms WHERE id = $1 RETURNING *`,
        [chatRoomId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("DELETE CHAT ROOM ERROR:", error);
      throw error;
    }
  },

  async getChatRoomByUsers(user1Id, user2Id) {
    const result = await pool.query(
      `SELECT * FROM chat_rooms 
       WHERE (user1_id = $1 AND user2_id = $2)
          OR (user1_id = $2 AND user2_id = $1)`,
      [user1Id, user2Id]
    );
    return result.rows[0] || null;
  }
};

ChatRoom.initTable();

module.exports = ChatRoom;