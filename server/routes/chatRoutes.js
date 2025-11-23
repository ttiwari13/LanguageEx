const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/", chatController.getChatRooms);
router.get("/:chatRoomId", chatController.getChatRoom);

router.post("/:chatRoomId/messages", chatController.sendMessage);
router.get("/:chatRoomId/messages", chatController.getMessages);
router.get("/:chatRoomId/unread", chatController.getUnreadCount);

router.post("/:chatRoomId/call", chatController.initiateVideoCall);
router.put("/call/:callId/end", chatController.endVideoCall);
router.get("/:chatRoomId/history", chatController.getCallHistory);

module.exports = router;