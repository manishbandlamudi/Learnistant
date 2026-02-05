import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import gentoken from "../config/token.js"; // generates jwt

// ✅ SIGNUP
export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashPassword });

    const token = gentoken(newUser._id);

    const { password: _, ...rest } = newUser._doc;

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(201).json(rest); // ✅ return direct user object
  } catch (error) {
    console.log("Error in signUp controller:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ LOGIN
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = gentoken(user._id);

    const { password: _, ...rest } = user._doc;

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json(rest); // ✅ return direct user object
  } catch (error) {
    console.log("Error in Login controller:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ LOGOUT
export const Logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log("Error in Logout controller:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
