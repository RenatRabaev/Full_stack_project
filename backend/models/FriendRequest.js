/* בקשת חברות בין שני משתמשים וסטטוס */
import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

friendRequestSchema.index({ toUser: 1, status: 1 });

export default mongoose.model("FriendRequest", friendRequestSchema);
