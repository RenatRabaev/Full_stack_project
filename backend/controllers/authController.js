/* הרשמה והתחברות — JWT ל־7 ימים */
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* JWT עם מזהה משתמש */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/* יצירת משתמש + החזרת טוקן ופרופיל */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "נא למלא שם משתמש, אימייל וסיסמה." });
    }
    const nameTrim = String(name).trim();
    const emailNorm = String(email).toLowerCase().trim();
    if (!nameTrim || !emailNorm) {
      return res.status(400).json({ message: "נא למלא שם משתמש ואימייל תקינים." });
    }
    const existing = await User.findOne({ email: emailNorm });
    if (existing) {
      return res.status(400).json({
        message: "המייל כבר רשום נא להתחבר או לאפס סיסמה",
      });
    }
    const user = await User.create({ name: nameTrim, email: emailNorm, password });
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({
        message: "המייל כבר רשום נא להתחבר או לאפס סיסמה",
      });
    }
    res.status(500).json({ message: e.message });
  }
}

/* אימות סיסמה והחזרת JWT */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "נא להזין אימייל וסיסמה." });
    }
    const emailNorm = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "לא נמצא חשבון עם האימייל הזה." });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: "הסיסמה שגויה." });
    }
    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        location: user.location,
      },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
