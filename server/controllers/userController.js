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

      const { password: _, ...userData } = user;
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
  
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  },
  
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const { 
        name, 
        username, 
        location, 
        offering_language, 
        seeking_language, 
        interests,
        currentPassword,
        newPassword
      } = req.body;
      
      // If user wants to change password
      if (currentPassword && newPassword) {
        console.log('Password change requested for user:', userId);
        
        // Get user with password - need to fetch with password field
        const userWithPassword = await User.getUserByIdWithPassword(userId);
        
        if (!userWithPassword) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Current password from DB (hashed):', userWithPassword.password);
        console.log('Provided current password:', currentPassword);
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
        console.log('Password validation result:', isPasswordValid);
        
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('New password hashed:', hashedPassword);
        
        // Update password in database
        const passwordUpdateResult = await User.updatePassword(userId, hashedPassword);
        console.log('Password update result:', passwordUpdateResult);
      }
      
      // Update other profile fields
      const updatedUser = await User.updateProfile(userId, {
        name,
        username,
        location,
        offering_language,
        seeking_language,
        interests,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        message: 'Profile updated successfully',
        user: userWithoutPassword,
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Username already taken' });
      }
      
      res.status(500).json({ message: 'Failed to update profile' });
    }
  },
};

module.exports = userController;