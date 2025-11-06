const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});
(async () => {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully!");
    client.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

module.exports = pool;
