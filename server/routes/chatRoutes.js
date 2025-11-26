const express = require("express");
const router = express.Router();
const multer = require("multer");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware"); 
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"), false);
    }
  },
});

router.get("/", authMiddleware, chatController.getChatRooms);
router.get("/:chatRoomId", authMiddleware, chatController.getChatRoom);
router.delete("/:chatRoomId", authMiddleware, chatController.deleteChatRoom);
router.post("/:chatRoomId/messages", authMiddleware, chatController.sendMessage);
router.get("/:chatRoomId/messages", authMiddleware, chatController.getMessages);
router.delete("/:chatRoomId/messages/all", authMiddleware, chatController.clearAllMessages);
router.delete("/:chatRoomId/messages/:messageId", authMiddleware, chatController.deleteMessage);
router.post("/:chatRoomId/audio", authMiddleware, upload.single("audio"), chatController.sendAudioMessage);
router.delete("/:chatRoomId/messages/:messageId/audio", authMiddleware, chatController.deleteAudioMessage);
router.get("/:chatRoomId/unread", authMiddleware, chatController.getUnreadCount);
router.post("/:chatRoomId/call", authMiddleware, chatController.initiateVideoCall);
router.put("/call/:callId/end", authMiddleware, chatController.endVideoCall);
router.get("/:chatRoomId/history", authMiddleware, chatController.getCallHistory);

module.exports = router;