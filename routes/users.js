import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ========== Image Upload Route ==========
router.post("/api/users/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.status(200).json({
      message: "File uploaded successfully",
      imageUrl: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    res.status(500).json({ message: `Error uploading image: ${error}` });
  }
});

// ========== User Routes (Same as before) ==========

// POST: Register user
// POST: Register user with optional image
router.post("/api/users/", upload.single("image"), async (req, res) => {
  const { username, password, age, jobrole, location, education } = req.body;

  if (!username || !password || !age || !jobrole || !location || !education) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const newUser = new User({
      username,
      password: hashedPassword,
      age,
      jobrole,
      location,
      education,
      imageUrl,
    });

    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: `Error creating user: ${error}` });
  }
});


// POST: Login user
router.post("/api/users/login/", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: `User ${username} not found` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid password" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: `Login error: ${error}` });
  }
});

// GET: All users with optional limit
router.get("/api/users/", async (req, res) => {
  try {
    const { limit } = req.query;
    const hasInvalidQuery = Object.keys(req.query).some((key) => key !== "limit");

    if (hasInvalidQuery) {
      return res.status(400).json({ message: "Invalid query parameter" });
    }

    if (!limit) {
      const allUsers = await User.find();
      return res.status(200).json(allUsers);
    }

    const parsedLimit = Number(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(404).json({
        message: "Limit should be a number > 0",
      });
    }

    const totalUsers = await User.countDocuments();
    if (parsedLimit > totalUsers) {
      return res.status(404).json({ message: `Only ${totalUsers} users found` });
    }

    const limitedUsers = await User.find().limit(parsedLimit);
    return res.status(200).json(limitedUsers);
  } catch (error) {
    res.status(500).json({ message: `Error fetching users: ${error}` });
  }
});

// GET: User by ID
router.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user
      ? res.status(200).json(user)
      : res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ message: `Error fetching user: ${error}` });
  }
});

// PUT: Update user
// PUT: Upload profile image and update user
router.put("/api/users/:id/upload", upload.single("image"), async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile image uploaded successfully",
      imageUrl,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: `Error uploading profile image: ${error}` });
  }
});

// DELETE: User
router.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    deletedUser
      ? res.status(200).json({ message: "User deleted" })
      : res.status(404).json({ message: "User not found" });
  } catch (error) {
    res.status(500).json({ message: `Error deleting user: ${error}` });
  }
});

export default router;
