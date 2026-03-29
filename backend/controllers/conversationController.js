/* שיחות והודעות REST (שידור בזמן אמת ב־sockets) */
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

/* כל השיחות שלי + הודעה אחרונה לכל אחת */
export async function listConversations(req, res) {
  try {
    const list = await Conversation.find({ participants: req.user._id })
      .populate("participants", "name avatar email")
      .sort({ updatedAt: -1 });
    const withLast = await Promise.all(
      list.map(async (c) => {
        const last = await Message.findOne({ conversation: c._id })
          .sort({ createdAt: -1 })
          .populate("sender", "name avatar");
        return { ...c.toObject(), lastMessage: last };
      })
    );
    res.json(withLast);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* שיחה 1:1 לפי זוג משתתפים (ייחודית) */
export async function getOrCreateDm(req, res) {
  try {
    const otherId = req.params.userId;
    if (otherId === req.user._id.toString()) {
      return res.status(400).json({ message: "Invalid" });
    }
    const pair = [req.user._id, new mongoose.Types.ObjectId(otherId)].sort(
      (a, b) => a.toString().localeCompare(b.toString())
    );
    let conv = await Conversation.findOne({
      isGroup: false,
      participants: { $all: pair, $size: 2 },
    }).populate("participants", "name avatar email");
    if (!conv) {
      conv = await Conversation.create({
        participants: pair,
        isGroup: false,
      });
      await conv.populate("participants", "name avatar email");
    }
    res.json(conv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* קבוצה: אני + participantIds */
export async function createGroup(req, res) {
  try {
    const { name, participantIds } = req.body;
    const ids = [...new Set([req.user._id.toString(), ...(participantIds || [])])].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    if (ids.length < 2) {
      return res.status(400).json({ message: "Need at least 2 participants including you" });
    }
    const conv = await Conversation.create({
      participants: ids,
      isGroup: true,
      name: name || "Group",
    });
    await conv.populate("participants", "name avatar email");
    res.status(201).json(conv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* עד 200 הודעות כרונולוגיות אם אני משתתף */
export async function getMessages(req, res) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Not found" });
    if (!conv.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Not a participant" });
    }
    const messages = await Message.find({ conversation: conv._id })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate("sender", "name avatar");
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
