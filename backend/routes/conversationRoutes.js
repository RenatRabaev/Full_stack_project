/* שיחות: רשימה, DM, קבוצה, הודעות לפי שיחה */
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  listConversations,
  getOrCreateDm,
  createGroup,
  getMessages,
} from "../controllers/conversationController.js";

const router = Router();

router.get("/", protect, listConversations);
router.get("/dm/:userId", protect, getOrCreateDm);
router.post("/group", protect, createGroup);
router.get("/:id/messages", protect, getMessages);

export default router;
