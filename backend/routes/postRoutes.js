/* פוסטים: פיד, פוסטים עם תמונה למשתמש, יצירה, לייק, תגובה, מחיקה */
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createPost,
  getFeed,
  getMyComments,
  getUserImagePosts,
  toggleLike,
  addComment,
  deletePost,
} from "../controllers/postController.js";

const router = Router();

router.get("/feed", protect, getFeed);
router.get("/my-comments", protect, getMyComments);
router.get("/user/:userId", protect, getUserImagePosts);
router.post("/", protect, upload.single("image"), createPost);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/comments", protect, addComment);
router.delete("/:id", protect, deletePost);

export default router;
