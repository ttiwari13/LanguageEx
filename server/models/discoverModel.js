const pool = require("../configs/db");

const Discover = {
  async getDiscoverFeed(currentUserId, filters = {}) {
    const {
      seeking_language,
      offering_language,
      interests = [],
      limit = 12,
      offset = 0,
    } = filters;

    let query = `
      SELECT id, name, username, offering_language, seeking_language,
             profile_image_public_id, location, interests, is_online, last_seen
      FROM users
      WHERE id != $1
    `;
    let values = [currentUserId];
    let param = 2;

    if (seeking_language) {
      query += ` AND seeking_language = $${param}`;
      values.push(seeking_language);
      param++;
    }

    if (offering_language) {
      query += ` AND offering_language = $${param}`;
      values.push(offering_language);
      param++;
    }

    if (interests.length > 0) {
      query += ` AND interests ?| $${param}`;
      values.push(interests);
      param++;
    }

    query += `
      ORDER BY is_online DESC, last_seen DESC
      LIMIT $${param} OFFSET $${param + 1}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  async countFiltered(currentUserId, filters = {}) {
    const { seeking_language, offering_language, interests = [] } = filters;

    let query = `
      SELECT COUNT(*) AS total
      FROM users
      WHERE id != $1
    `;
    let values = [currentUserId];
    let param = 2;

    if (seeking_language) {
      query += ` AND seeking_language = $${param}`;
      values.push(seeking_language);
      param++;
    }

    if (offering_language) {
      query += ` AND offering_language = $${param}`;
      values.push(offering_language);
      param++;
    }

    if (interests.length > 0) {
      query += ` AND interests ?| $${param}`;
      values.push(interests);
      param++;
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  },
};

module.exports = Discover;
