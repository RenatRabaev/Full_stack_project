/* פרופיל משתמש: אני, עדכון, אווטאר, חיפוש, צפייה לפי id */
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  getMe,
  updateMe,
  updateAvatar,
  getById,
  searchUsers,
  deleteMe,
} from "../controllers/userController.js";

const router = Router();

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.post("/me/avatar", protect, upload.single("avatar"), updateAvatar);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getById);
router.delete("/me", protect, deleteMe);

export default router;
