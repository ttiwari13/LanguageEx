const express = require("express");
const router = express.Router();
const multer = require("multer");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware"); 


const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});
router.use(authMiddleware);
router.delete('/:chatRoomId/messages/all', chatController.clearAllMessages); // Removed redundant 'protect'
router.post("/:chatRoomId/audio", upload.single('audio'), chatController.sendAudioMessage);
router.post("/:chatRoomId/messages", chatController.sendMessage);
router.get("/:chatRoomId/messages", chatController.getMessages);
router.delete(
  "/:chatRoomId/messages/:messageId",
  chatController.deleteMessage 
);
router.delete(
  "/:chatRoomId/messages/:messageId/audio",
  chatController.deleteAudioMessage
);

router.get("/", chatController.getChatRooms);
router.get("/:chatRoomId/unread", chatController.getUnreadCount);
router.post("/:chatRoomId/call", chatController.initiateVideoCall);
router.put("/call/:callId/end", chatController.endVideoCall);
router.get("/:chatRoomId/history", chatController.getCallHistory);
router.get("/:chatRoomId", chatController.getChatRoom);


module.exports = router;