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
  origin: ["http://localhost:3000","https://69318d92057fd115e31ab2b9--langex.netlify.app/"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => res.send("Server running"));

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ["http://localhost:3000","https://69318d92057fd115e31ab2b9--langex.netlify.app/"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
let userSockets = new Map(); 
let socketUsers = new Map(); 

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  socket.on("user-online", async (userId) => {
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, userId);
    
    await User.updateOnlineStatus(userId, true);
    io.emit("user-status-change", { userId, isOnline: true });
    
    console.log(`User ${userId} is now online with socket ${socket.id}`);
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
      io.emit("user-status-change", { userId, isOnline: false });
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