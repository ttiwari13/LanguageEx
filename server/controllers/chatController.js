const ChatRoom = require("../models/chatRoom");
const VideoCall = require("../models/videoCall");
const Message = require("../models/Message"); 
const { generateCloudinaryUrl } = require("../utils/cloudinaryUrl");
const pool = require("../configs/db");

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
        return res.status(403).json({ error: "Access denied" });
      }

      if (!content && !audio_url) {
        return res.status(400).json({ error: "Content or audio_url is required" });
      }

      const message = await Message.createMessage(
        chatRoomId,
        senderId,
        message_type || "text",
        content || "",
        audio_url
      );

      res.json({
        success: true,
        message,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteChatRoom(req, res) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied" });
      }

      await pool.query(
        `INSERT INTO deleted_messages (message_id, user_id, deleted_at)
         SELECT id, $1, NOW()
         FROM messages
         WHERE chat_room_id = $2
         ON CONFLICT (message_id, user_id) DO NOTHING`,
        [userId, chatRoomId]
      );

      return res.json({
        success: true,
        message: "Chat deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async sendAudioMessage(req, res) {
    try {
      const { chatRoomId } = req.params;
      const senderId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, senderId);
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Audio file missing" });
      }

      const message = await Message.createAudioMessage(
        chatRoomId,
        senderId,
        req.file.buffer
      );

      res.json({
        success: true,
        message: {
          ...message,
          sender_profile_image: generateCloudinaryUrl(req.user.profile_image_public_id),
        },
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteMessage(req, res) {
    try {
      const { chatRoomId, messageId } = req.params;
      const userId = req.user.id;
      const { deleteType } = req.query;

      const messageCheck = await pool.query(
        "SELECT sender_id FROM messages WHERE id = $1 AND chat_room_id = $2",
        [messageId, chatRoomId]
      );

      if (messageCheck.rows.length === 0) {
        return res.status(404).json({ error: "Message not found" });
      }

      const message = messageCheck.rows[0];

      if (deleteType === "everyone") {
        if (message.sender_id !== userId) {
          return res.status(403).json({ error: "Only sender can delete for everyone" });
        }

        await pool.query("DELETE FROM messages WHERE id = $1", [messageId]);

        return res.json({
          success: true,
          message: "Message deleted for everyone",
          deleteType: "everyone",
        });
      }

      if (deleteType === "me") {
        await pool.query(
          `INSERT INTO deleted_messages (message_id, user_id, deleted_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [messageId, userId]
        );

        return res.json({
          success: true,
          message: "Message deleted for you",
          deleteType: "me",
        });
      }

      if (message.sender_id !== userId) {
        return res.status(403).json({ error: "Not allowed" });
      }

      await pool.query("DELETE FROM messages WHERE id = $1", [messageId]);

      res.json({
        success: true,
        message: "Message deleted",
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteAudioMessage(req, res) {
    try {
      const { chatRoomId, messageId } = req.params;
      const userId = req.user.id;
      const { deleteType } = req.query;

      const messageCheck = await pool.query(
        "SELECT sender_id FROM messages WHERE id = $1 AND chat_room_id = $2 AND message_type = 'audio'",
        [messageId, chatRoomId]
      );

      if (messageCheck.rows.length === 0) {
        return res.status(404).json({ error: "Audio message not found" });
      }

      const message = messageCheck.rows[0];

      if (deleteType === "everyone") {
        if (message.sender_id !== userId) {
          return res.status(403).json({ error: "Only sender can delete for everyone" });
        }

        await Message.deleteAudioMessage(messageId);

        return res.json({
          success: true,
          message: "Audio deleted for everyone",
          deleteType: "everyone",
        });
      }

      if (deleteType === "me") {
        await pool.query(
          `INSERT INTO deleted_messages (message_id, user_id, deleted_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [messageId, userId]
        );

        return res.json({
          success: true,
          message: "Audio deleted for you",
          deleteType: "me",
        });
      }

      if (message.sender_id !== userId) {
        return res.status(403).json({ error: "Not allowed" });
      }

      await Message.deleteAudioMessage(messageId);

      res.json({ success: true, message: "Audio deleted" });

    } catch (error) {
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
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await pool.query(
        `SELECT m.*, u.name AS sender_name, u.profile_image_public_id
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.chat_room_id = $1
         AND m.id NOT IN (
           SELECT message_id FROM deleted_messages WHERE user_id = $2
         )
         ORDER BY m.created_at DESC
         LIMIT $3 OFFSET $4`,
        [chatRoomId, userId, limit, offset]
      );

      const formatted = messages.rows.map((msg) => ({
        ...msg,
        sender_profile_image: generateCloudinaryUrl(msg.profile_image_public_id),
      }));

      await Message.markAsRead(chatRoomId, userId);

      res.json({
        success: true,
        messages: formatted.reverse(),
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getUnreadCount(req, res) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied" });
      }

      const count = await Message.getUnreadCount(chatRoomId, userId);

      res.json({
        success: true,
        unreadCount: count,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async initiateVideoCall(req, res) {
    try {
      const { chatRoomId } = req.params;
      const callerId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, callerId);
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied" });
      }

      const chatRoom = await ChatRoom.getChatRoomById(chatRoomId);
      const receiverId =
        chatRoom.user1_id === callerId
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
        videoCall: updatedCall,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getCallHistory(req, res) {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied" });
      }

      const history = await VideoCall.getCallHistory(chatRoomId);

      res.json({
        success: true,
        callHistory: history,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async clearAllMessages(req, res) {
    let client;
    try {
      const { chatRoomId } = req.params;
      const userId = req.user.id;

      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied" });
      }

      client = await pool.connect();
      await client.query("BEGIN");

      const messagesToClear = await client.query(
        `SELECT id FROM messages 
         WHERE chat_room_id = $1
         AND id NOT IN (
           SELECT message_id FROM deleted_messages WHERE user_id = $2
         )`,
        [chatRoomId, userId]
      );

      if (messagesToClear.rows.length === 0) {
        await client.query("COMMIT");
        return res.json({
          success: true,
          message: "Already cleared or no messages.",
        });
      }

      const values = messagesToClear.rows
        .map((row) => `(${row.id}, ${userId}, NOW())`)
        .join(",");

      await client.query(
        `INSERT INTO deleted_messages (message_id, user_id, deleted_at)
         VALUES ${values}
         ON CONFLICT (message_id, user_id) DO NOTHING`
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: `Cleared ${messagesToClear.rows.length} messages`,
      });

    } catch (error) {
      if (client) await client.query("ROLLBACK");
      res.status(500).json({ error: error.message });
    } finally {
      if (client) client.release();
    }
  },
};

module.exports = chatController;