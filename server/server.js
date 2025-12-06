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

// Dynamic CORS configuration
const allowedOrigins = [
  "https://langex.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a Netlify preview
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
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list or is a Netlify preview
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
  console.log("User connected:", socket.id);
  
  // Store socket mapping when user identifies themselves (optional - only needed for video calls)
  socket.on("register-user", (userId) => {
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });
  
  socket.on("join-chat-room", (chatRoomId) => {
    socket.join(`room-${chatRoomId}`);
    console.log(`Socket ${socket.id} joined room-${chatRoomId}`);
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
  
  // Video call events
  socket.on("call-user", async ({ callerId, receiverId, chatRoomId, offer }) => {
    console.log(`Call from ${callerId} to ${receiverId} in room ${chatRoomId}`);
    
    // Register caller if not already registered
    if (!userSockets.has(callerId)) {
      userSockets.set(callerId, socket.id);
      socketUsers.set(socket.id, callerId);
    }
    
    const receiverSocketId = userSockets.get(receiverId);
    
    if (!receiverSocketId) {
      console.log(`Receiver ${receiverId} not connected to socket, but call can still be attempted`);
      // Still try to send the call - receiver might connect soon
      io.emit("incoming-call", {
        callerId,
        chatRoomId,
        offer,
      });
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
  
  socket.on("disconnect", () => {
    const userId = socketUsers.get(socket.id);

    if (userId) {
      userSockets.delete(userId);
      socketUsers.delete(socket.id);
      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    } else {
      console.log(`Socket ${socket.id} disconnected`);
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