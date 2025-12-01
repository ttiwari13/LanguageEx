const Discover = require("../models/discoverModel");
const { generateProfileUrl } = require("../utils/cloudinaryUrl");
const isDevelopment = process.env.NODE_ENV === 'development';

const DiscoverController = {
  async getDiscoverPaginated(req, res) {
    try {
      const startTime = isDevelopment ? Date.now() : null;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized" 
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 12;
      const offset = (page - 1) * limit;

      const filters = {
        seeking_language: req.query.seeking_language || null,
        offering_language: req.query.offering_language || null,
        interests: req.query.interests ? req.query.interests.split(",") : [],
        limit,
        offset,
      };

      if (isDevelopment) {
        console.log("Controller - Filters applied:", JSON.stringify(filters, null, 2));
      }
      const { users, total } = await Discover.getDiscoverFeedWithCount(userId, filters);
      
      if (isDevelopment) {
        const queryTime = Date.now() - startTime;
        console.log(`Database query completed in ${queryTime}ms`);
      }
      const formattedUsers = users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        offering_language: u.offering_language,
        seeking_language: u.seeking_language,
        profile_image_url: generateProfileUrl(u.profile_image_public_id),
        location: u.location,
        interests: u.interests,
        is_online: u.is_online,
        last_seen: u.last_seen
      }));

      const totalPages = Math.ceil(total / limit);

      if (isDevelopment) {
        const totalTime = Date.now() - startTime;
        console.log(`Total request time: ${totalTime}ms | Users: ${users.length} | Total: ${total}`);
      }

      return res.json({
        success: true,
        pagination: {
          currentPage: page,
          totalPages,
          limit,
          totalUsers: total,
        },
        users: formattedUsers,
      });
    } catch (error) {
      console.error("DISCOVER ERROR:", error.message);
      if (isDevelopment) {
        console.error("Stack:", error.stack);
      }
      
      return res.status(500).json({ 
        success: false,
        message: "Failed to fetch users. Please try again."
      });
    }
  },
};

module.exports = DiscoverController;