const pool = require("../configs/db");

(async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        offering_language VARCHAR(50),
        seeking_language VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log("Users table ready");
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_image_public_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS profile_image_uploaded_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS location VARCHAR(100),
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP,
      ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log("New columns added");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_seeking_language ON users(seeking_language);
      CREATE INDEX IF NOT EXISTS idx_users_offering_language ON users(offering_language);
      CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
      CREATE INDEX IF NOT EXISTS idx_users_has_image ON users(id) WHERE profile_image_public_id IS NOT NULL;
    `);
    console.log("Indexes created");

  } catch (error) {
    console.error("Database setup error:", error.message);
  }
})();

const User = {
  // Create new user
  async createUser(name, username, email, password, offering_language, seeking_language) {
    const query = `
      INSERT INTO users (name, username, email, password, offering_language, seeking_language)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, username, email, offering_language, seeking_language, created_at;
    `;
    const values = [name, username, email, password, offering_language, seeking_language];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get user by email
  async getUserByEmail(email) {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rows[0];
  },

  // Get user by username
  async getUserByUsername(username) {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0];
  },

  async getUserById(id) {
    const result = await pool.query(
      `SELECT id, name, username, email, offering_language, seeking_language, 
              profile_image_public_id, profile_image_uploaded_at, location, 
              interests, is_online, last_seen, created_at 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Get user by ID WITH password (for password verification)
  async getUserByIdWithPassword(id) {
    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Get all users
  async getAllUsers() {
    const result = await pool.query(`
      SELECT id, name, username, email, offering_language, seeking_language,
             profile_image_public_id, location, interests, is_online, last_seen
      FROM users
      ORDER BY is_online DESC, last_seen DESC
    `);
    return result.rows;
  },

  // Update password
  async updatePassword(userId, hashedPassword) {
    try {
      const query = `
        UPDATE users 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, username;
      `;
      
      const result = await pool.query(query, [hashedPassword, userId]);
      console.log('Password updated in DB for user:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in updatePassword:', error);
      throw error;
    }
  },

  // Update profile (without password)
  async updateProfile(userId, updates) {
    const { name, username, location, offering_language, seeking_language, interests } = updates;
    
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name),
          username = COALESCE($2, username),
          location = COALESCE($3, location),
          offering_language = COALESCE($4, offering_language),
          seeking_language = COALESCE($5, seeking_language),
          interests = COALESCE($6, interests),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, username, email, offering_language, seeking_language, 
                location, interests, profile_image_public_id;
    `;
    
    const values = [
      name, 
      username, 
      location, 
      offering_language, 
      seeking_language, 
      interests ? JSON.stringify(interests) : null, 
      userId
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Update profile image
  async updateProfileImage(userId, publicId) {
    const query = `
      UPDATE users 
      SET profile_image_public_id = $1,
          profile_image_uploaded_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, profile_image_public_id, profile_image_uploaded_at;
    `;
    const result = await pool.query(query, [publicId, userId]);
    return result.rows[0];
  },

  // Get profile image public ID
  async getProfileImagePublicId(userId) {
    const result = await pool.query(
      `SELECT profile_image_public_id FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0]?.profile_image_public_id;
  },

  // Update online status
  async updateOnlineStatus(userId, isOnline) {
    const query = `
      UPDATE users 
      SET is_online = $1,
          last_seen = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, is_online, last_seen;
    `;
    const result = await pool.query(query, [isOnline, userId]);
    return result.rows[0];
  },

  // Remove profile image
  async removeProfileImage(userId) {
    const query = `
      UPDATE users 
      SET profile_image_public_id = NULL,
          profile_image_uploaded_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  },

  // Get filtered users
  async getFilteredUsers(filters = {}) {
    const { seeking_language, offering_language, is_online, limit = 20, offset = 0 } = filters;
    
    let query = `
      SELECT id, name, username, offering_language, seeking_language,
             profile_image_public_id, location, interests, is_online, last_seen
      FROM users
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (seeking_language) {
      query += ` AND seeking_language = $${paramCount}`;
      values.push(seeking_language);
      paramCount++;
    }

    if (offering_language) {
      query += ` AND offering_language = $${paramCount}`;
      values.push(offering_language);
      paramCount++;
    }

    if (is_online !== undefined) {
      query += ` AND is_online = $${paramCount}`;
      values.push(is_online);
      paramCount++;
    }

    query += ` ORDER BY is_online DESC, last_seen DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },
};

module.exports = User;