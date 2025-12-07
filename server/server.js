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
const VideoCall = require("./models/videoCall");

dotenv.config();
const app = express();

// Dynamic CORS configuration
const allowedOrigins = [
  "https://langex.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || (origin && origin.includes('.netlify.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => res.send("Server running"));

const server = http.createServer(app);

// Socket.IO CORS configuration
const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || (origin && origin.includes('.netlify.app'))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// Store user sockets for video calling and messaging
let userSockets = new Map(); 
let socketUsers = new Map(); 

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  
  // Register user with their socket ID
  socket.on("register-user", (userId) => {
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
    console.log(`📊 Total registered users: ${userSockets.size}`);
  });
  
  socket.on("join-chat-room", (chatRoomId) => {
    socket.join(`room-${chatRoomId}`);
    console.log(`🚪 Socket ${socket.id} joined room-${chatRoomId}`);
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
  
  // ==================== VIDEO CALL EVENTS ====================
  
  socket.on("call-user", async ({ callerId, receiverId, chatRoomId, offer }) => {
    console.log(`📞 Call initiated: ${callerId} -> ${receiverId} in room ${chatRoomId}`);
    
    try {
      // Register caller if not already registered
      if (!userSockets.has(callerId)) {
        userSockets.set(callerId, socket.id);
        socketUsers.set(socket.id, callerId);
        console.log(`📝 Auto-registered caller ${callerId}`);
      }
      
      // Get caller information from database
      const callerResult = await pool.query(
        `SELECT id, name, profile_image_public_id FROM users WHERE id = $1`,
        [callerId]
      );
      
      if (callerResult.rows.length === 0) {
        console.error(`❌ Caller ${callerId} not found in database`);
        socket.emit("call-failed", { message: "Caller not found" });
        return;
      }
      
      const caller = callerResult.rows[0];
      console.log(`👤 Caller info: ${caller.name}`);
      
      // Create video call record in database
      let callId = null;
      try {
        const callRecord = await VideoCall.createVideoCall(
          chatRoomId,
          callerId,
          receiverId
        );
        callId = callRecord.id;
        console.log(`✅ Video call record created: ${callId}`);
      } catch (error) {
        console.error("❌ Error creating call record:", error);
        // Continue anyway - the call can still work
      }
      
      // Check if receiver is online
      const receiverSocketId = userSockets.get(receiverId);
      
      if (!receiverSocketId) {
        console.log(`⚠️ Receiver ${receiverId} is not online`);
        socket.emit("call-failed", { 
          message: "User is not available for calls" 
        });
        
        // Update call status to failed
        if (callId) {
          await VideoCall.updateCallStatus(callId, "failed", new Date());
        }
        return;
      }
      
      console.log(`📡 Sending incoming-call to socket ${receiverSocketId}`);
      
      // Send incoming call notification to receiver with ALL necessary data
      io.to(receiverSocketId).emit("incoming-call", {
        callerId: caller.id,
        callerName: caller.name,
        callerProfileImage: caller.profile_image_public_id,
        chatRoomId: chatRoomId,
        offer: offer,
        callId: callId
      });
      
      console.log(`✅ Incoming call sent to receiver ${receiverId}`);
      
    } catch (error) {
      console.error("❌ Error in call-user handler:", error);
      socket.emit("call-failed", { 
        message: "Failed to initiate call: " + error.message 
      });
    }
  });
  
  socket.on("accept-call", ({ callerId, answer, receiverId }) => {
    console.log(`✅ Call accepted by receiver, sending to caller ${callerId}`);
    
    const callerSocketId = userSockets.get(callerId);
    
    if (!callerSocketId) {
      console.error(`❌ Caller ${callerId} socket not found`);
      return;
    }
    
    io.to(callerSocketId).emit("call-accepted", { answer });
    console.log(`📡 Answer sent to caller socket ${callerSocketId}`);
    
    // Update call status to active
    // Note: You might want to pass callId here too if you have it
  });
  
  socket.on("reject-call", ({ callerId, callId }) => {
    console.log(`❌ Call rejected by receiver`);
    
    const callerSocketId = userSockets.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
      console.log(`📡 Rejection sent to caller socket ${callerSocketId}`);
    }
    
    // Update call status to rejected
    if (callId) {
      VideoCall.updateCallStatus(callId, "rejected", new Date())
        .catch(err => console.error("Error updating call status:", err));
    }
  });
  
  socket.on("ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocketId = userSockets.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
      // console.log(`🧊 ICE candidate sent to ${targetUserId}`);
    } else {
      console.warn(`⚠️ Target user ${targetUserId} not found for ICE candidate`);
    }
  });
  
  socket.on("end-call", ({ targetUserId, callId, chatRoomId }) => {
    console.log(`📴 Call ended, notifying user ${targetUserId}`);
    
    const targetSocketId = userSockets.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
      console.log(`📡 Call-ended sent to socket ${targetSocketId}`);
    }
    
    // Update call status in database
    if (callId) {
      VideoCall.updateCallStatus(callId, "completed", new Date())
        .then(() => console.log(`✅ Call ${callId} marked as completed`))
        .catch(err => console.error("❌ Error updating call status:", err));
    }
  });
  
  socket.on("video-toggled", ({ targetUserId, videoEnabled }) => {
    const targetSocketId = userSockets.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit("remote-video-toggled", { videoEnabled });
      console.log(`📹 Video toggle (${videoEnabled}) sent to ${targetUserId}`);
    }
  });
  
  // ==================== DISCONNECT ====================
  
  socket.on("disconnect", () => {
    const userId = socketUsers.get(socket.id);

    if (userId) {
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
      console.log(`👋 User ${userId} disconnected from socket ${socket.id}`);
      console.log(`📊 Remaining users: ${userSockets.size}`);
    } else {
      console.log(`👋 Socket ${socket.id} disconnected`);
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
  console.log(`🚀 Server running on port ${PORT}`);
});