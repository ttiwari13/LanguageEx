const videoCall = {
  async initTable() {
    try {
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
        CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
        CREATE INDEX IF NOT EXISTS idx_video_calls_created ON video_calls(created_at DESC);
      `);

      console.log("video_calls table initialized");
    } catch (error) {
      console.error("video_calls table initialization error:", error);
    }
  },

  async createVideoCall(chatRoomId, callerId, receiverId) {
    try {
      const result = await pool.query(
        `INSERT INTO video_calls 
         (chat_room_id, caller_id, receiver_id, status, created_at)
         VALUES ($1, $2, $3, 'initiated', NOW())
         RETURNING *`,
        [chatRoomId, callerId, receiverId]
      );

      return result.rows[0];
    } catch (error) {
      console.error("CREATE VIDEO CALL ERROR:", error);
      throw error;
    }
  },

  async updateCallStatus(callId, status, endedAt = null) {
    try {
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
      return result.rows[0];
    } catch (error) {
      console.error("UPDATE CALL STATUS ERROR:", error);
      throw error;
    }
  },

  async getCallHistory(chatRoomId) {
    try {
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

      return result.rows;
    } catch (error) {
      console.error("GET CALL HISTORY ERROR:", error);
      throw error;
    }
  }
};

videoCall.initTable();

module.exports = videoCall;