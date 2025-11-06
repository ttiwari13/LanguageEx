const pool = require("../configs/db");

(async () => {
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
})();

const User = {
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
  async getUserByEmail(email) {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    return result.rows[0];
  },

  async getUserByUsername(username) {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0];
  },

  async getAllUsers() {
    const result = await pool.query(`
      SELECT id, name, username, email, offering_language, seeking_language FROM users
    `);
    return result.rows;
  },
};

module.exports = User;
