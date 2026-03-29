/* לוגיקת API למשתמש: פרופיל, עדכון, אווטאר, חיפוש, פרטיות */
import User from "../models/User.js";

/* GET /me — המשתמש כפי שנטען ב־protect */
export async function getMe(req, res) {
  res.json(req.user);
}

/* עדכון שדות טקסט בפרופיל המחובר */
export async function updateMe(req, res) {
  try {
    const { name, bio, phone, location } = req.body;
    if (name !== undefined) req.user.name = String(name).trim();
    if (bio !== undefined) req.user.bio = String(bio);
    if (phone !== undefined) req.user.phone = String(phone).trim();
    if (location !== undefined) req.user.location = String(location).trim();
    await req.user.save();
    res.json(req.user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* נתיב קובץ אווטאר אחרי Multer */
export async function updateAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });
    req.user.avatar = `/uploads/${req.file.filename}`;
    await req.user.save();
    res.json(req.user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* פרופיל ציבורי; מסתיר אימייל מצופים שאינם הבעלים */
export async function getById(req, res) {
  try {
    const user = await User.findById(req.params.id).select(
      "name email avatar bio friends createdAt phone location"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    const o = user.toObject();
    if (req.user._id.toString() !== req.params.id) {
      delete o.email;
    }
    res.json(o);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* חיפוש לפי שם או אימייל (regex), עד 20 תוצאות */
export async function searchUsers(req, res) {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 1) return res.json([]);
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ name: regex }, { email: regex }],
    })
      .select("name email avatar bio")
      .limit(20);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* מחיקת חשבון */
export async function deleteMe(req, res) {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
