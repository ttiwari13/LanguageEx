const FriendRequest = require("../models/FriendRequest");
const ChatRoom = require("../models/chatRoom");

const friendController = {
  async send(req, res) {
    try {
      console.log("=== SEND REQUEST ===");
      console.log("req.user:", req.user);
      console.log("req.body:", req.body);

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const sender_id = req.user.id;
      const { receiver_id } = req.body;

      if (!receiver_id) {
        return res.status(400).json({ error: "receiver_id is required" });
      }
      
      if (sender_id === receiver_id) {
        return res.status(400).json({ error: "Cannot send request to yourself" });
      }
      const request = await FriendRequest.sendRequest(sender_id, receiver_id);
      if (request.status === 'accepted') {
        const chatRoom = await ChatRoom.createChatRoom(sender_id, receiver_id);
        res.json({ 
          message: "You are now friends!", 
          request,
          chatRoomId: chatRoom.id 
        });
      } else {
        res.json({ message: "Request sent", request });
      }
    } catch (error) {
      console.error("SEND REQUEST ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async accept(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { request_id } = req.body;

      if (!request_id) {
        return res.status(400).json({ error: "request_id is required" });
      }

      const updated = await FriendRequest.acceptRequest(request_id);

      const chatRoom = await ChatRoom.createChatRoom(
        updated.sender_id,
        updated.receiver_id
      ); 
      res.json({ 
        message: "Request accepted", 
        updated,
        chatRoomId: chatRoom.id 
      });
    } catch (error) {
      console.error("ACCEPT REQUEST ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },
  async reject(req, res) {
    try {
      const { request_id } = req.body;

      if (!request_id) {
        return res.status(400).json({ error: "request_id is required" });
      }
      const updated = await FriendRequest.rejectRequest(request_id);
      
      res.json({ message: "Request rejected", updated });
    } catch (error) {
      console.error("REJECT REQUEST ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },
  async friends(req, res) {
    try {

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userId = req.user.id;
      const list = await FriendRequest.getFriends(userId);
      
      res.json(list);
    } catch (error) {
      console.error("GET FRIENDS ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async pending(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userId = req.user.id;  
      const pending = await FriendRequest.getPendingRequests(userId);
      res.json(pending);
    } catch (error) {
      console.error("GET PENDING ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },
  async incoming(req, res) {
    try {

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userId = req.user.id;  
      const incoming = await FriendRequest.getIncomingRequests(userId);
      
      res.json(incoming);
    } catch (error) {
      console.error("GET INCOMING ERROR:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: error.message });
    }
  },

  async cancel(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const sender_id = req.user.id;
      const { receiverId } = req.params;

      if (!receiverId) {
        return res.status(400).json({ error: "receiverId is required" });
      }

      const deleted = await FriendRequest.cancelRequest(sender_id, parseInt(receiverId));

      res.json({ message: "Request cancelled", deleted });
    } catch (error) {
      console.error("CANCEL REQUEST ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async unfriend(req, res) {
    try {

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userId = req.user.id;
      const { friendId } = req.params;

      if (!friendId) {
        return res.status(400).json({ error: "friendId is required" });
      }
      const deleted = await FriendRequest.unfriend(userId, parseInt(friendId));
      res.json({ message: "Unfriended", deleted });
    } catch (error) {
      console.error("UNFRIEND ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = friendController;