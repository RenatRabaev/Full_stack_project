/* בקשות חברות ורשימת חברים */
import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

/* משתמשים אקראיים לגילוי (לא חברים ספציפיים) */
export async function listDiscover(req, res) {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email avatar bio")
      .limit(30);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* יצירת FriendRequest אם אין כפילות ולא חברים */
export async function sendRequest(req, res) {
  try {
    const toId = req.params.userId;
    if (toId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot friend yourself" });
    }
    const target = await User.findById(toId);
    if (!target) return res.status(404).json({ message: "User not found" });
    const me = await User.findById(req.user._id);
    if (me.friends.some((id) => id.toString() === toId)) {
      return res.status(400).json({ message: "Already friends" });
    }
    const existing = await FriendRequest.findOne({
      $or: [
        { fromUser: req.user._id, toUser: toId },
        { fromUser: toId, toUser: req.user._id },
      ],
      status: "pending",
    });
    if (existing) return res.status(400).json({ message: "Request already pending" });
    const fr = await FriendRequest.create({
      fromUser: req.user._id,
      toUser: toId,
      status: "pending",
    });
    await fr.populate("fromUser toUser", "name avatar email");
    res.status(201).json(fr);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: "Request exists" });
    res.status(500).json({ message: e.message });
  }
}

/* בקשות ממתינות אליי */
export async function listIncoming(req, res) {
  try {
    const list = await FriendRequest.find({ toUser: req.user._id, status: "pending" })
      .populate("fromUser", "name avatar email bio")
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* accept מעדכן friends לשני הצדדים */
export async function respondRequest(req, res) {
  try {
    const { action } = req.body;
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be accept or reject" });
    }
    const fr = await FriendRequest.findOne({
      _id: req.params.id,
      toUser: req.user._id,
      status: "pending",
    });
    if (!fr) return res.status(404).json({ message: "Request not found" });
    if (action === "reject") {
      fr.status = "rejected";
      await fr.save();
      return res.json(fr);
    }
    fr.status = "accepted";
    await fr.save();
    await User.updateOne({ _id: fr.fromUser }, { $addToSet: { friends: fr.toUser } });
    await User.updateOne({ _id: fr.toUser }, { $addToSet: { friends: fr.fromUser } });
    await fr.populate("fromUser toUser", "name avatar email");
    res.json(fr);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* חברים ממלא friends של המשתמש */
export async function listFriends(req, res) {
  try {
    const me = await User.findById(req.user._id).populate("friends", "name avatar email bio");
    res.json(me.friends);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
