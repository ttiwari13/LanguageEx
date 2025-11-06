const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const userController = {
  async signup(req, res) {
    try {
      const {
  name,
  username,
  email,
  password,
  offeringLanguage,  
  seekingLanguage,  
} = req.body;
      if (!name || !username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const existingUser = await User.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(409) 
          .json({ message: "User already exists with this email" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.createUser(
        name,
        username,
        email,
        hashedPassword,
        offeringLanguage,
        seekingLanguage
      );
      const token = jwt.sign(
        { id: newUser.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.status(201).json({
        message: "Signup successful",
        user: newUser,
        token,
      });

    } catch (error) {
      console.error("Signup error:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({ message: "Invalid data provided" });
      }

      if (error.code === "23505" || error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Duplicate email or username" });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(403).json({ message: "Invalid token" });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      res.status(500).json({ message: "Server error during signup" });
    }
  },
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const user = await User.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password: _, ...userData } = user; //object destructure in which the we remove the password from the user and make another userdata which has all remaining properties except password ready to send to frontend
      res.status(200).json({
        message: "Login successful",
        user: userData,
        token,
      });

    } catch (error) {
      console.error("Login error:", error);

      if (error.name === "JsonWebTokenError") {
        return res.status(403).json({ message: "Invalid token" });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }

      res.status(500).json({ message: "Server error during login" });
    }
  },
};

module.exports = userController;
