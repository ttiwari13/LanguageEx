const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const pool = require("./configs/db");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes"); 
dotenv.config();
const app = express();
app.use(cors({
  origin: "http://localhost:3000", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => res.send("Server running"));
app.use("/api/users", authRoutes);
app.use("/api/upload", uploadRoutes);
app.listen(process.env.PORT || 4000, () => console.log("Server started"));
