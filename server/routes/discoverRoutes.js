const express = require("express");
const router = express.Router();
const DiscoverController = require("../controllers/discoverController");
const protect = require("../middlewares/authMiddleware");
router.get("/", protect, DiscoverController.getDiscoverPaginated);
module.exports = router;
