const pool = require("../configs/db");
const isDevelopment = process.env.NODE_ENV === 'development';

const Discover = {
  async getDiscoverFeedWithCount(currentUserId, filters = {}) {
    const {
      seeking_language,
      offering_language,
      interests = [],
      limit = 12,
      offset = 0,
    } = filters;
    let query = `
      SELECT 
        id, 
        name, 
        username, 
        offering_language, 
        seeking_language,
        profile_image_public_id,
        location, 
        interests, 
        is_online, 
        last_seen
      FROM users
      WHERE id != $1
        AND id NOT IN (
          SELECT receiver_id FROM friend_requests 
          WHERE sender_id = $1 AND status = 'accepted'
          UNION
          SELECT sender_id FROM friend_requests 
          WHERE receiver_id = $1 AND status = 'accepted'
        )
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE id != $1
        AND id NOT IN (
          SELECT receiver_id FROM friend_requests 
          WHERE sender_id = $1 AND status = 'accepted'
          UNION
          SELECT sender_id FROM friend_requests 
          WHERE receiver_id = $1 AND status = 'accepted'
        )
    `;

    let values = [currentUserId];
    let countValues = [currentUserId];
    let param = 2;
    let whereClause = '';

    if (seeking_language) {
      whereClause += ` AND LOWER(seeking_language) LIKE LOWER($${param})`;
      const seekingValue = `%${seeking_language}%`;
      values.push(seekingValue);
      countValues.push(seekingValue);
      param++;
    }

    if (offering_language) {
      whereClause += ` AND LOWER(offering_language) LIKE LOWER($${param})`;
      const offeringValue = `%${offering_language}%`;
      values.push(offeringValue);
      countValues.push(offeringValue);
      param++;
    }

    if (interests.length > 0) {
      whereClause += ` AND interests && $${param}`;
      values.push(interests);
      countValues.push(interests);
      param++;
    }

    query += whereClause;
    countQuery += whereClause;

    query += `
      ORDER BY is_online DESC, last_seen DESC NULLS LAST
      LIMIT $${param} OFFSET $${param + 1}
    `;

    values.push(limit, offset);

    if (isDevelopment) {
      console.log('Executing query with filters:', { seeking_language, offering_language, interests });
    }

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    const users = dataResult.rows;
    const total = parseInt(countResult.rows[0].total);

    if (isDevelopment) {
      console.log(`Query returned ${users.length} users, total: ${total}`);
    }

    return { users, total };
  },

  async getDiscoverFeed(currentUserId, filters = {}) {
    const { users } = await this.getDiscoverFeedWithCount(currentUserId, filters);
    return users;
  },

  async countFiltered(currentUserId, filters = {}) {
    const { total } = await this.getDiscoverFeedWithCount(currentUserId, { 
      ...filters, 
      limit: 0, 
      offset: 0 
    });
    return { total };
  },
};

module.exports = Discover;