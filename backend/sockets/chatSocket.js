/* Socket.IO: אימות JWT, join/leave לחדרי שיחה, שליחת הודעות ל-DB ושידור */
import jwt from "jsonwebtoken";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export function registerChatHandlers(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join", async (conversationId, cb) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv || !conv.participants.some((p) => p.toString() === socket.userId)) {
          cb?.({ error: "Forbidden" });
          return;
        }
        socket.join(roomName(conversationId));
        cb?.({ ok: true });
      } catch (e) {
        cb?.({ error: e.message });
      }
    });

    socket.on("leave", (conversationId) => {
      socket.leave(roomName(conversationId));
    });

    socket.on("message", async (payload, cb) => {
      try {
        const { conversationId, content } = payload || {};
        if (!conversationId || !content?.trim()) {
          cb?.({ error: "Invalid payload" });
          return;
        }
        const conv = await Conversation.findById(conversationId);
        if (!conv || !conv.participants.some((p) => p.toString() === socket.userId)) {
          cb?.({ error: "Forbidden" });
          return;
        }
        const msg = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          content: content.trim(),
        });
        await msg.populate("sender", "name avatar");
        await Conversation.updateOne({ _id: conversationId }, { updatedAt: new Date() });
        io.to(roomName(conversationId)).emit("message", msg.toObject());
        cb?.({ ok: true, id: msg._id });
      } catch (e) {
        cb?.({ error: e.message });
      }
    });
  });
}

/* שם חדר Socket.IO לפי מזהה שיחה */
function roomName(conversationId) {
  return `conv:${conversationId}`;
}
