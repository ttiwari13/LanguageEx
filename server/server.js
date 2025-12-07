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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
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
  
  socket.on("disconnect", () => {
    console.log(` Socket ${socket.id} disconnected`);
  });
});

app.use("/api/users", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api", friendRoutes);
app.use("/api/chats", chatRoutes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});