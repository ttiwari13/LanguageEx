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

  // Send audio message
  async sendAudioMessage(req, res) {
    try {
      const { chatRoomId } = req.params;
      const senderId = req.user.id;

      // Check if user has access to chat room
      const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, senderId);
      
      if (!isAllowed) {
        return res.status(403).json({ error: "Access denied to this chat room" });
      }

      // Check if audio file is present
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Audio file is required" });
      }

      // Create audio message with file buffer
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
      console.error("SEND AUDIO MESSAGE ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete text message (supports both "me" and "everyone")
  async deleteMessage(req, res) {
    try {
      const { chatRoomId, messageId } = req.params;
      const userId = req.user.id;
      const { deleteType } = req.query; // Get deleteType from query params

      // Verify the message exists
      const messageCheck = await pool.query(
        "SELECT sender_id, message_type FROM messages WHERE id = $1 AND chat_room_id = $2",
        [messageId, chatRoomId]
      );

      if (messageCheck.rows.length === 0) {
        return res.status(404).json({ error: "Message not found" });
      }

      const message = messageCheck.rows[0];

      // Handle "Delete for Everyone" - only sender can do this
      if (deleteType === "everyone") {
        if (message.sender_id !== userId) {
          return res.status(403).json({ error: "You can only delete your own messages for everyone" });
        }

        // Permanently delete the message from database
        await pool.query("DELETE FROM messages WHERE id = $1", [messageId]);

        return res.json({ 
          success: true, 
          message: "Message deleted for everyone",
          deleteType: "everyone"
        });
      } 
      
      // Handle "Delete for Me" - any participant can do this
      else if (deleteType === "me") {
        // Check if user is part of the chat room
        const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
        
        if (!isAllowed) {
          return res.status(403).json({ error: "Access denied to this chat room" });
        }

        // Add to deleted_messages table (soft delete for specific user)
        await pool.query(
          `INSERT INTO deleted_messages (message_id, user_id, deleted_at) 
           VALUES ($1, $2, NOW())
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [messageId, userId]
        );

        return res.json({ 
          success: true, 
          message: "Message deleted for you",
          deleteType: "me"
        });
      }

      // If no deleteType specified, default to old behavior (delete for everyone, sender only)
      else {
        if (message.sender_id !== userId) {
          return res.status(403).json({ error: "You can only delete your own messages" });
        }

        await pool.query("DELETE FROM messages WHERE id = $1", [messageId]);

        return res.json({ 
          success: true, 
          message: "Message deleted successfully" 
        });
      }
    } catch (error) {
      console.error("DELETE MESSAGE ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete audio message (with Cloudinary cleanup, supports both "me" and "everyone")
  async deleteAudioMessage(req, res) {
    try {
      const { chatRoomId, messageId } = req.params;
      const userId = req.user.id;
      const { deleteType } = req.query; // Get deleteType from query params

      // Verify the audio message exists
      const messageCheck = await pool.query(
        "SELECT sender_id, cloudinary_audio_id FROM messages WHERE id = $1 AND chat_room_id = $2 AND message_type = 'audio'",
        [messageId, chatRoomId]
      );

      if (messageCheck.rows.length === 0) {
        return res.status(404).json({ error: "Audio message not found" });
      }

      const message = messageCheck.rows[0];

      // Handle "Delete for Everyone" - only sender can do this
      if (deleteType === "everyone") {
        if (message.sender_id !== userId) {
          return res.status(403).json({ error: "You can only delete your own messages for everyone" });
        }

        // Delete using the Message model (handles Cloudinary cleanup)
        await Message.deleteAudioMessage(messageId);

        return res.json({
          success: true,
          message: "Audio message deleted for everyone",
          deleteType: "everyone"
        });
      }
      
      // Handle "Delete for Me" - any participant can do this
      else if (deleteType === "me") {
        // Check if user is part of the chat room
        const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
        
        if (!isAllowed) {
          return res.status(403).json({ error: "Access denied to this chat room" });
        }

        // Add to deleted_messages table (soft delete for specific user)
        await pool.query(
          `INSERT INTO deleted_messages (message_id, user_id, deleted_at) 
           VALUES ($1, $2, NOW())
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [messageId, userId]
        );

        return res.json({
          success: true,
          message: "Audio message deleted for you",
          deleteType: "me"
        });
      }

      // If no deleteType specified, default to old behavior (delete for everyone, sender only)
      else {
        if (message.sender_id !== userId) {
          return res.status(403).json({ error: "You can only delete your own messages" });
        }

        await Message.deleteAudioMessage(messageId);

        return res.json({
          success: true,
          message: "Audio message deleted successfully",
        });
      }
    } catch (error) {
      console.error("DELETE AUDIO MESSAGE ERROR:", error);
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

      // Get messages excluding ones deleted by this user
      const messages = await pool.query(
        `SELECT m.*, u.name as sender_name, u.profile_image_public_id
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.chat_room_id = $1
         AND m.id NOT IN (
           SELECT message_id FROM deleted_messages 
           WHERE user_id = $2
         )
         ORDER BY m.created_at DESC
         LIMIT $3 OFFSET $4`,
        [chatRoomId, userId, limit, offset]
      );

      const formattedMessages = messages.rows.map((msg) => ({
        ...msg,
        sender_profile_image: generateCloudinaryUrl(msg.profile_image_public_id),
      }));

      await Message.markAsRead(chatRoomId, userId);

      res.json({
        success: true,
        messages: formattedMessages.reverse(), // Reverse to show oldest first
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
  },
  async clearAllMessages(req, res) {
        let client;
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id;

            // 1. Authorization check
            const isAllowed = await ChatRoom.isUserInChatRoom(chatRoomId, userId);
            if (!isAllowed) {
                return res.status(403).json({ error: "Access denied to this chat room" });
            }

            client = await pool.connect();
            await client.query('BEGIN'); // Start transaction

            // 2. Get IDs of all messages in the chat room that are NOT already soft-deleted by this user
            const messagesToClear = await client.query(
                `SELECT m.id FROM messages m
                WHERE m.chat_room_id = $1
                AND m.id NOT IN (
                    SELECT message_id FROM deleted_messages 
                    WHERE user_id = $2
                )`,
                [chatRoomId, userId]
            );

            if (messagesToClear.rows.length === 0) {
                 await client.query('COMMIT');
                return res.json({
                    success: true,
                    message: "Chat history already cleared for this user, or no messages found."
                });
            }

            // 3. Insert all these message IDs into the deleted_messages table for the current user.
            // This is the "soft delete" operation.
            const values = messagesToClear.rows.map(row => `(${row.id}, ${userId}, NOW())`).join(',');
            
            await client.query(
                `INSERT INTO deleted_messages (message_id, user_id, deleted_at) 
                 VALUES ${values} 
                 ON CONFLICT (message_id, user_id) DO NOTHING`
            );

            await client.query('COMMIT'); // End transaction successfully

            return res.json({
                success: true,
                message: `Cleared ${messagesToClear.rows.length} messages for user ${userId} in chat room ${chatRoomId}`
            });

        } catch (error) {
            if (client) await client.query('ROLLBACK'); // Rollback on error
            console.error("CLEAR ALL MESSAGES ERROR:", error);
            res.status(500).json({ error: "Failed to clear chat history: " + error.message });
        } finally {
           if (client) client.release();
        }
    }
};

module.exports = chatController;