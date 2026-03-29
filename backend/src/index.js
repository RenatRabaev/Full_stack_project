/*
 * שרת Express + MongoDB + Socket.IO.
 * מגדיר API תחת /api, קבצים סטטיים ל-uploads, ואירועי צ'אט.
 */
import "dotenv/config";
import { existsSync } from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { Server } from "socket.io";
import authRoutes from "../routes/authRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import postRoutes from "../routes/postRoutes.js";
import friendRoutes from "../routes/friendRoutes.js";
import conversationRoutes from "../routes/conversationRoutes.js";
import { registerChatHandlers } from "../sockets/chatSocket.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(rootDir, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/conversations", conversationRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

/* קבצי HTML/CSS סטטיים (ללא build) + dist אחרי build; SPA — index.html לכל נתיב React (GET+HEAD) */
const frontendPublic = path.join(rootDir, "..", "frontend", "public");
const frontendDist = path.join(rootDir, "..", "frontend", "dist");
if (existsSync(frontendPublic)) {
  app.use(express.static(frontendPublic));
}
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api")) return next();
    if (req.path.startsWith("/socket.io")) return next();
    res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) next(err);
    });
  });
} else {
  console.warn("frontend/dist missing — run: cd frontend && npm run build (required for React routes like /login from this port)");
}

registerChatHandlers(io);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/social_network";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`API + Socket.IO on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
