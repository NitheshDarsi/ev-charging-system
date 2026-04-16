const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    let adminFlag = Boolean(isAdmin);

    // Enforce max 2 admins rule
    if (adminFlag) {
      const adminCount = await User.countDocuments({ isAdmin: true });
      if (adminCount >= 2) {
        return res.status(400).json({ message: "Maximum limit of 2 Admins reached. You can only register as a User." });
      }
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: adminFlag,
    });

    await user.save();
    res.json({ message: "User registered" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, isAdmin: !!user.isAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, email, password, vehicles } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    
    // EV Profile array rewrite
    if (vehicles !== undefined) user.vehicles = vehicles;

    await user.save();
    
    // Return sanitized version
    const updatedUser = await User.findById(user._id).select("-password").lean();
    res.json({ message: "Garage & Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};