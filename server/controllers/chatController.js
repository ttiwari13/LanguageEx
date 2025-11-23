const ChatRoom = require("../models/chatRoom");
const VideoCall = require("../models/videoCall");
const Message = require("../models/Message"); 
const { generateCloudinaryUrl } = require("../utils/cloudinaryUrl");

const chatController = {
  async getChatRooms(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userId = req.user.id;
      const chatRooms = await ChatRoom.getChatRoomsByUserId(userId);

      const formattedChatRooms = chatRooms.map((room) => ({
        ...room,
        friend_profile_image: generateCloudinaryUrl(room.profile_image_public_id),
      }));

      res.json({
        success: true,
        chatRooms: formattedChatRooms,
      });
    } catch (error) {
      console.error("GET CHAT ROOMS ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getChatRoom(req, res) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied to this chat room" });
      }

      const chatRoom = await ChatRoom.getChatRoomById(chatRoomId);

      if (!chatRoom) {
        return res.status(404).json({ error: "Chat room not found" });
      }

      res.json({
        success: true,
        chatRoom,
      });
    } catch (error) {
      console.error("GET CHAT ROOM ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async sendMessage(req, res) {
    try {
      const { chatRoomId } = req.params;
      const { message_type, content, audio_url } = req.body;
      const senderId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, senderId);
      
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied to this chat room" });
      }

      if (!content && !audio_url) {
        return res.status(400).json({ error: "Message content or audio_url is required" });
      }

      const message = await Message.createMessage(
        chatRoomId,
        senderId,
        message_type || 'text',
        content || '',
        audio_url
      );

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getMessages(req, res) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied to this chat room" });
      }

      const messages = await Message.getMessagesByChatRoom(chatRoomId, limit, offset);

      const formattedMessages = messages.map((msg) => ({
        ...msg,
        sender_profile_image: generateCloudinaryUrl(msg.profile_image_public_id),
      }));

      await Message.markAsRead(chatRoomId, userId);

      res.json({
        success: true,
        messages: formattedMessages,
      });
    } catch (error) {
      console.error("GET MESSAGES ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getUnreadCount(req, res) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied to this chat room" });
      }

      const count = await Message.getUnreadCount(chatRoomId, userId);

      res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error) {
      console.error("GET UNREAD COUNT ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async initiateVideoCall(req, res) {
    try {
      const { chatRoomId } = req.params;
      const callerId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, callerId);
      
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied to this chat room" });
      }

      const chatRoom = await ChatRoom.getChatRoomById(chatRoomId);
      const receiverId = chatRoom.user1_id === callerId 
        ? chatRoom.user2_id 
        : chatRoom.user1_id;

      const videoCall = await VideoCall.createVideoCall(
        chatRoomId,
        callerId,
        receiverId
      );

      res.json({
        success: true,
        message: "Video call initiated",
        videoCall,
      });
    } catch (error) {
      console.error("INITIATE VIDEO CALL ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async endVideoCall(req, res) {
    try {
      const { callId } = req.params;

      const updatedCall = await VideoCall.updateCallStatus(
        callId,
        "completed",
        new Date()
      );

      res.json({
        success: true,
        message: "Video call ended",
        videoCall: updatedCall,
      });
    } catch (error) {
      console.error("END VIDEO CALL ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getCallHistory(req, res) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied to this chat room" });
      }

      const callHistory = await VideoCall.getCallHistory(chatRoomId);

      res.json({
        success: true,
        callHistory,
      });
    } catch (error) {
      console.error("GET CALL HISTORY ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = chatController;