/* חברויות: גילוי, בקשה, בקשות נכנסות, אישור/דחייה, רשימת חברים */
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  listDiscover,
  sendRequest,
  listIncoming,
  respondRequest,
  listFriends,
} from "../controllers/friendController.js";

const router = Router();

router.get("/discover", protect, listDiscover);
router.post("/request/:userId", protect, sendRequest);
router.get("/requests", protect, listIncoming);
router.patch("/requests/:id", protect, respondRequest);
router.get("/list", protect, listFriends);

export default router;
