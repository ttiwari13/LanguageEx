const Discover = require("../models/discoverModel");
const { generateCloudinaryUrl } = require("../utils/cloudinaryUrl");

const DiscoverController = {
  async getDiscoverPaginated(req, res) {
    try {
      const userId = req.user?.id || 1; 

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
      const users = await Discover.getDiscoverFeed(userId, filters);
      const countRow = await Discover.countFiltered(userId, filters);

      const totalUsers = parseInt(countRow.total);
      const totalPages = Math.ceil(totalUsers / limit);
      const formattedUsers = users.map((u) => {
      const url = generateCloudinaryUrl(u.profile_image_public_id);
 
  return {
    ...u,
    profile_image_url: url,
  };
});

      return res.json({
        success: true,
        pagination: {
          currentPage: page,
          totalPages,
          limit,
          totalUsers,
        },
        users: formattedUsers,
      });
    } catch (error) {
      console.error("DISCOVER ERROR:", error);
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = DiscoverController;
