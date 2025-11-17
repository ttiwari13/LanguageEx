const express = require("express");
const userController = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/me", protect, userController.getProfile);
router.put("/update", protect, userController.updateProfile);
module.exports = router;
