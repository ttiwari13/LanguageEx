const pool = require("../configs/db");

const VideoCall = {
  async initTable() {
    try {
      console.log("Initializing video_calls table...");
      
      // First check if chat_rooms table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'chat_rooms'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.warn("WARNING: chat_rooms table does not exist yet. VideoCall table creation may fail.");
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS video_calls (
          id SERIAL PRIMARY KEY,
          chat_room_id INT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
          caller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) DEFAULT 'initiated',
          created_at TIMESTAMP DEFAULT NOW(),
          started_at TIMESTAMP,
          ended_at TIMESTAMP,
          duration INT
        );
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_video_calls_chat_room ON video_calls(chat_room_id);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_video_calls_created ON video_calls(created_at DESC);
      `);

      console.log("✅ video_calls table initialized successfully");
    } catch (error) {
      console.error("❌ video_calls table initialization error:", error.message);
      console.error("Full error:", error);
    }
  },

  async createVideoCall(chatRoomId, callerId, receiverId) {
    try {
      console.log("Creating video call with params:", { chatRoomId, callerId, receiverId });
      
      // Validate inputs
      if (!chatRoomId || !callerId || !receiverId) {
        throw new Error("Missing required parameters: chatRoomId, callerId, or receiverId");
      }

      // Convert to integers to avoid type issues
      const roomId = parseInt(chatRoomId);
      const caller = parseInt(callerId);
      const receiver = parseInt(receiverId);

      console.log("Parsed values:", { roomId, caller, receiver });

      // Check if chat room exists
      const roomCheck = await pool.query(
        `SELECT id FROM chat_rooms WHERE id = $1`,
        [roomId]
      );

      if (roomCheck.rows.length === 0) {
        throw new Error(`Chat room with ID ${roomId} does not exist`);
      }

      // Check if users exist
      const userCheck = await pool.query(
        `SELECT id FROM users WHERE id = $1 OR id = $2`,
        [caller, receiver]
      );

      if (userCheck.rows.length !== 2) {
        throw new Error(`One or both users (${caller}, ${receiver}) do not exist`);
      }

      // Create the video call
      const result = await pool.query(
        `INSERT INTO video_calls 
         (chat_room_id, caller_id, receiver_id, status, created_at)
         VALUES ($1, $2, $3, 'initiated', NOW())
         RETURNING *`,
        [roomId, caller, receiver]
      );

      console.log("✅ Video call created successfully:", result.rows[0]);
      return result.rows[0];
      
    } catch (error) {
      console.error("❌ CREATE VIDEO CALL ERROR:", error.message);
      console.error("Error code:", error.code);
      console.error("Error detail:", error.detail);
      console.error("Full error:", error);
      throw error;
    }
  },

  async updateCallStatus(callId, status, endedAt = null) {
    try {
      console.log("Updating call status:", { callId, status, endedAt });
      
      let query = `UPDATE video_calls SET status = $1`;
      let params = [status];

      if (endedAt) {
        query += `, ended_at = $2 WHERE id = $3 RETURNING *`;
        params.push(endedAt, callId);
      } else {
        query += ` WHERE id = $2 RETURNING *`;
        params.push(callId);
      }

      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`Video call with ID ${callId} not found`);
      }
      
      console.log("✅ Call status updated:", result.rows[0]);
      return result.rows[0];
      
    } catch (error) {
      console.error("❌ UPDATE CALL STATUS ERROR:", error.message);
      console.error("Full error:", error);
      throw error;
    }
  },

  async getCallHistory(chatRoomId) {
    try {
      console.log("Fetching call history for room:", chatRoomId);
      
      const result = await pool.query(
        `SELECT 
          vc.*,
          u1.name as caller_name,
          u2.name as receiver_name
         FROM video_calls vc
         JOIN users u1 ON vc.caller_id = u1.id
         JOIN users u2 ON vc.receiver_id = u2.id
         WHERE vc.chat_room_id = $1
         ORDER BY vc.created_at DESC`,
        [chatRoomId]
      );

      console.log(`✅ Found ${result.rows.length} call history records`);
      return result.rows;
      
    } catch (error) {
      console.error("❌ GET CALL HISTORY ERROR:", error.message);
      console.error("Full error:", error);
      throw error;
    }
  }
};

// Initialize table when module is loaded
VideoCall.initTable();

module.exports = VideoCall;