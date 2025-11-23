const pool = require("../configs/db");
(async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS friend_requests (
        id SERIAL PRIMARY KEY,
        sender_id INT REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sender_id, receiver_id)
      );
    `;
    await pool.query(query);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_friend_sender ON friend_requests(sender_id);
      CREATE INDEX IF NOT EXISTS idx_friend_receiver ON friend_requests(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_friend_status ON friend_requests(status);
    `);

    console.log("Friend Request table ready");
  } catch (error) {
    console.error("Friend Request table setup error:", error.message);
  }
})();

const FriendRequest = {
async sendRequest(senderId, receiverId) {
  const existingRequest = await pool.query(`
    SELECT * FROM friend_requests 
    WHERE ((sender_id = $1 AND receiver_id = $2)
       OR (sender_id = $2 AND receiver_id = $1))
    ORDER BY id ASC
    LIMIT 1
  `, [senderId, receiverId]);

  if (existingRequest.rows.length > 0) {
    const existing = existingRequest.rows[0];
    if (existing.status === 'accepted') {
      return existing;
    }
    if (existing.sender_id === receiverId && existing.status === 'pending') {
      const result = await pool.query(`
        UPDATE friend_requests SET status = 'accepted' WHERE id = $1 RETURNING *;
      `, [existing.id]);
      return result.rows[0];
    }
    return existing;
  }
  const query = `
    INSERT INTO friend_requests (sender_id, receiver_id, status)
    VALUES ($1, $2, 'pending')
    RETURNING *;
  `;
  const result = await pool.query(query, [senderId, receiverId]);
  return result.rows[0];
},
  async acceptRequest(requestId) {
    const result = await pool.query(`
      UPDATE friend_requests
      SET status = 'accepted'
      WHERE id = $1
      RETURNING *;
    `, [requestId]);
    return result.rows[0];
  },
  async rejectRequest(requestId) {
    const result = await pool.query(`
      UPDATE friend_requests
      SET status = 'rejected'
      WHERE id = $1
      RETURNING *;
    `, [requestId]);
    return result.rows[0];
  },
  async cancelRequest(senderId, receiverId) {
    const result = await pool.query(
      `DELETE FROM friend_requests 
       WHERE sender_id = $1 AND receiver_id = $2 
       RETURNING *`,
      [senderId, receiverId]
    );
    return result.rows[0];
  },
  async unfriend(userId, friendId) {
    const result = await pool.query(
      `DELETE FROM friend_requests
       WHERE status = 'accepted'
         AND ((sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1))
       RETURNING *`,
      [userId, friendId]
    );
    return result.rows[0];
  },
async getFriends(userId) {
  const result = await pool.query(`
    WITH unique_friends AS (
      SELECT DISTINCT
        CASE 
          WHEN fr.sender_id = $1 THEN fr.receiver_id
          ELSE fr.sender_id
        END as friend_id
      FROM friend_requests fr
      WHERE fr.status = 'accepted'
        AND (fr.sender_id = $1 OR fr.receiver_id = $1)
    )
    SELECT DISTINCT u.id, u.name, u.username, u.profile_image_public_id
    FROM unique_friends uf
    JOIN users u ON u.id = uf.friend_id
    ORDER BY u.id;
  `, [userId]);

  return result.rows;
},

  async getIncomingRequests(userId) {
    const result = await pool.query(`
      SELECT fr.id, u.id AS sender_id, u.name, u.username
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.id
      WHERE fr.receiver_id = $1 AND fr.status = 'pending';
    `, [userId]);

    return result.rows;
  },

  async getPendingRequests(userId) {
    const result = await pool.query(`
      SELECT fr.id, u.id AS receiver_id, u.name, u.username
      FROM friend_requests fr
      JOIN users u ON fr.receiver_id = u.id
      WHERE fr.sender_id = $1 AND fr.status = 'pending';
    `, [userId]);

    return result.rows;
  },
  async getSuggestions(userId) {
    const result = await pool.query(`
      SELECT id, name, username, profile_image_public_id
      FROM users
      WHERE id != $1
        AND id NOT IN (
          SELECT receiver_id FROM friend_requests WHERE sender_id = $1
          UNION
          SELECT sender_id FROM friend_requests WHERE receiver_id = $1
        )
      ORDER BY RANDOM()
      LIMIT 15;
    `, [userId]);

    return result.rows;
  },

async cleanupDuplicates(userId1, userId2) {
  await pool.query(`
    DELETE FROM friend_requests
    WHERE id IN (
      SELECT id FROM friend_requests
      WHERE status = 'accepted'
        AND ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
      ORDER BY id DESC
      OFFSET 1
    )
  `, [userId1, userId2]);
},
  
};

module.exports = FriendRequest;
