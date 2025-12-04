const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");    
const socketio = require("socket.io");

const pool = require("./configs/db");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const discoverRoutes = require("./routes/discoverRoutes");
const friendRoutes = require("./routes/friendRoute");
const chatRoutes = require("./routes/chatRoutes");
const User = require("./models/User"); 
const ChatRoom = require("./models/chatRoom"); 
const Message = require("./models/Message");

setTimeout(() => {
  const VideoCall = require("./models/videoCall");
}, 1000);

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    "https://langex.netlify.app",
    "https://69318d92057fd115e31ab2b9--langex.netlify.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/", (req, res) => res.send("Server running"));

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: [
    "https://langex.netlify.app",
    "https://69318d92057fd115e31ab2b9--langex.netlify.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
  }
});

let userSockets = new Map(); 
let socketUsers = new Map(); 
const notifyFriendsAboutStatus = async (userId, isOnline) => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN user_id = $1 THEN friend_id 
          ELSE user_id 
        END as friend_id
      FROM friendships
      WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'
    `;
    const result = await pool.query(query, [userId]);
  
    result.rows.forEach(row => {
      const friendSocketId = userSockets.get(row.friend_id);
      if (friendSocketId) {
        io.to(friendSocketId).emit("user-status-change", { userId, isOnline });
        console.log(`Notified friend ${row.friend_id} about user ${userId} status: ${isOnline}`);
      }
    });
  } catch (error) {
    console.error("Error notifying friends about status:", error);
  }
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  socket.on("user-online", async (userId) => {
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);
    
    await User.updateOnlineStatus(userId, true);
    await notifyFriendsAboutStatus(userId, true);
    
    console.log(`User ${userId} is now online with socket ${socket.id}`);
  });
  
  socket.on("join-chat-room", async (chatRoomId) => {
    socket.join(`room-${chatRoomId}`);
    console.log(`Socket ${socket.id} joined room-${chatRoomId}`);
    
    // Send current online status of the friend in this chat room
    try {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        const roomQuery = await pool.query(
          `SELECT user1_id, user2_id FROM chat_rooms WHERE id = $1`,
          [chatRoomId]
        );
        
        if (roomQuery.rows.length > 0) {
          const room = roomQuery.rows[0];
          const friendId = room.user1_id === userId ? room.user2_id : room.user1_id;
          const isOnline = userSockets.has(friendId);
          socket.emit("user-status-change", { userId: friendId, isOnline });
          console.log(`Sent initial status for friend ${friendId}: ${isOnline}`);
        }
      }
    } catch (error) {
      console.error("Error sending initial status:", error);
    }
  });
  socket.on("request-user-status", async (targetUserId) => {
    const isOnline = userSockets.has(targetUserId);
    socket.emit("user-status-change", { userId: targetUserId, isOnline });
    console.log(`Status request for user ${targetUserId}: ${isOnline}`);
  });
  
  socket.on("send-message", (messageData) => {
    io.to(`room-${messageData.chat_room_id}`).emit("new-message", messageData);
  });
  
  socket.on("typing", ({ chatRoomId, userId, userName }) => {
    socket.to(`room-${chatRoomId}`).emit("user-typing", { userId, userName });
  });

  socket.on("stop-typing", ({ chatRoomId, userId }) => {
    socket.to(`room-${chatRoomId}`).emit("user-stopped-typing", { userId });
  });
  
  socket.on("delete-message", ({ chatRoomId, messageId }) => {
    io.to(`room-${chatRoomId}`).emit("message-deleted", { messageId });
  });

  socket.on("clear-chat-history", (chatRoomId) => {
    io.to(`room-${chatRoomId}`).emit("chat-history-cleared");
  });
  
  socket.on("call-user", async ({ callerId, receiverId, chatRoomId, offer }) => {
    console.log(`Call from ${callerId} to ${receiverId} in room ${chatRoomId}`);
    const receiverSocketId = userSockets.get(receiverId);
    
    if (!receiverSocketId) {
      console.log(`Receiver ${receiverId} is offline`);
      socket.emit("call-failed", { message: "User is offline" });
      return;
    }

    console.log(`Sending call to socket ${receiverSocketId}`);
    io.to(receiverSocketId).emit("incoming-call", {
      callerId,
      chatRoomId,
      offer,
    });
  });
  
  socket.on("accept-call", ({ callerId, answer }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { answer });
      console.log(`Call accepted, sending to ${callerSocketId}`);
    }
  });
  
  socket.on("reject-call", ({ callerId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
      console.log(`Call rejected by receiver`);
    }
  });
  
  socket.on("ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocketId = userSockets.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });
  
  socket.on("end-call", ({ targetUserId, callId }) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
    if (callId) {
      const VideoCall = require("./models/videoCall");
      VideoCall.updateCallStatus(callId, "completed", new Date())
        .catch(err => console.error("Error updating call status:", err));
    }
  });
  
  socket.on("disconnect", async () => {
    const userId = socketUsers.get(socket.id);

    if (userId) {
      await User.updateOnlineStatus(userId, false);
      await notifyFriendsAboutStatus(userId, false);
      
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
      
      console.log(`User ${userId} disconnected`);
    }
  });
});

app.use("/api/users", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api", friendRoutes);
app.use("/api/chats", chatRoutes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});