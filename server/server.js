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

// 🌟 IMPORTANT: Load models in correct order
const ChatRoom = require("./models/chatRoom"); 
const Message = require("./models/Message"); // 🌟 Add Message model
// Wait for ChatRoom table to be created, then load VideoCall
setTimeout(() => {
  const VideoCall = require("./models/videoCall");
}, 1000);

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.get("/", (req, res) => res.send("Server running"));

const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

let onlineUsers = new Map(); // socketId -> userId
let userSockets = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ==================== USER ONLINE/OFFLINE ====================
  socket.on("user-online", async (userId) => {
    onlineUsers.set(socket.id, userId);
    userSockets.set(userId, socket.id);

    await User.updateOnlineStatus(userId, true);
    console.log("🟢 User marked online:", userId);

    socket.broadcast.emit("user-status-change", { userId, isOnline: true });
  });

  // ==================== CHAT MESSAGING ====================
  
  // 🌟 Join chat room
  socket.on("join-chat-room", (chatRoomId) => {
    socket.join(`room-${chatRoomId}`);
    console.log(`💬 User joined chat room: ${chatRoomId}`);
  });

  // 🌟 Send message (broadcast to room)
  socket.on("send-message", (messageData) => {
    console.log("📨 New message:", messageData);
    io.to(`room-${messageData.chat_room_id}`).emit("new-message", messageData);
  });

  // 🌟 Typing indicator
  socket.on("typing", ({ chatRoomId, userId, userName }) => {
    console.log(`⌨️ ${userName} is typing in room ${chatRoomId}`);
    socket.to(`room-${chatRoomId}`).emit("user-typing", { userId, userName });
  });

  socket.on("stop-typing", ({ chatRoomId, userId }) => {
    socket.to(`room-${chatRoomId}`).emit("user-stopped-typing", { userId });
  });

  // ==================== VIDEO CALL SIGNALING ====================
  
  // 🎥 Initiate call
  socket.on("call-user", async ({ callerId, receiverId, chatRoomId, offer }) => {
    console.log(`📞 Call from ${callerId} to ${receiverId}`);

    const receiverSocketId = userSockets.get(receiverId);

    if (receiverSocketId) {
      try {
        const VideoCall = require("./models/videoCall");
        await VideoCall.createVideoCall(chatRoomId, callerId, receiverId);
      } catch (err) {
        console.error("Error creating video call record:", err);
      }

      io.to(receiverSocketId).emit("incoming-call", {
        callerId,
        chatRoomId,
        offer
      });
    } else {
      socket.emit("call-failed", { message: "User is offline" });
    }
  });

  // ✅ Accept call
  socket.on("accept-call", ({ callerId, answer }) => {
    console.log(`✅ Call accepted by receiver`);

    const callerSocketId = userSockets.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { answer });
    }
  });

  // ❌ Reject call
  socket.on("reject-call", ({ callerId }) => {
    console.log(`❌ Call rejected`);

    const callerSocketId = userSockets.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
    }
  });

  // 🧊 ICE Candidate exchange
  socket.on("ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocketId = userSockets.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  // 📴 End call
  socket.on("end-call", ({ targetUserId, callId }) => {
    console.log(`📴 Call ended`);

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

  // ==================== DISCONNECT ====================
  socket.on("disconnect", async () => {
    const userId = onlineUsers.get(socket.id);

    if (userId) {
      await User.updateOnlineStatus(userId, false);
      console.log("🔴 User marked offline:", userId);

      socket.broadcast.emit("user-status-change", { userId, isOnline: false });

      onlineUsers.delete(socket.id);
      userSockets.delete(userId);
    }
  });
});

// ==================== ROUTES ====================
app.use("/api/users", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api", friendRoutes);
app.use("/api/chats", chatRoutes);

// ==================== START SERVER ====================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 WebSocket server ready for:`);
  console.log(`   📞 Real-time video calls`);
  console.log(`   💬 Real-time messaging`);
  console.log(`   ⌨️  Typing indicators`);
  console.log(`   🟢 Online/offline status`);
});