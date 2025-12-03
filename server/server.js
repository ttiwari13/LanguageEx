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

app.use(cors({
  origin: ["http://localhost:3000","https://langex.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.get("/", (req, res) => res.send("Server running"));
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ["http://localhost:3000","https://langex.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

let onlineUsers = new Map(); 
let userSockets = new Map(); 

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("user-online", async (userId) => {
    onlineUsers.set(socket.id, userId);
    userSockets.set(userId, socket.id);
    await User.updateOnlineStatus(userId, true);
    socket.broadcast.emit("user-status-change", { userId, isOnline: true });
  });
  socket.on("join-chat-room", (chatRoomId) => {
    socket.join(`room-${chatRoomId}`);
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
  socket.to(chatRoomId).emit("message-deleted", { messageId });
  });
  socket.on("call-user", async ({ callerId, receiverId, chatRoomId, offer }) => {
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
  socket.on("accept-call", ({ callerId, answer }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { answer });
    }
  });
  socket.on("reject-call", ({ callerId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
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
    const userId = onlineUsers.get(socket.id);

    if (userId) {
      await User.updateOnlineStatus(userId, false);
      socket.broadcast.emit("user-status-change", { userId, isOnline: false });

      onlineUsers.delete(socket.id);
      userSockets.delete(userId);
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