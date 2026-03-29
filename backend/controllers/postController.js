/* פוסטים: יצירה, פיד, גלריה, לייק, תגובה, מחיקה */
import mongoose from "mongoose";
import Post from "../models/Post.js";
import User from "../models/User.js";

/* טקסט ו/או תמונה אחת */
export async function createPost(req, res) {
  try {
    const { content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";
    if (!content?.trim() && !image) {
      return res.status(400).json({ message: "Content or image required" });
    }
    const post = await Post.create({
      author: req.user._id,
      content: content?.trim() || "",
      image,
    });
    await post.populate("author", "name avatar email");
    res.status(201).json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* פוסטים עם תמונה של משתמש — לגלריית פרופיל */
export async function getUserImagePosts(req, res) {
  try {
    const { userId } = req.params;
    const posts = await Post.find({
      author: userId,
      image: { $nin: ["", null] },
    })
      .sort({ createdAt: -1 })
      .limit(48)
      .select("image content createdAt")
      .lean();
    res.json(posts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* כל התגובות שהמשתמש המחובר פרסם — על כל פוסט (לא רק שלו); התאמת user גם כשהשדה ObjectId או מחרוזת */
export async function getMyComments(req, res) {
  try {
    const uid = req.user._id;
    const oid =
      uid instanceof mongoose.Types.ObjectId ? uid : new mongoose.Types.ObjectId(String(uid));
    const uidStr = String(oid);

    const rows = await Post.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$comments", []] },
                    as: "c",
                    cond: {
                      $or: [
                        { $eq: ["$$c.user", oid] },
                        { $eq: [{ $toString: "$$c.user" }, uidStr] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      { $unwind: "$comments" },
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$comments.user", oid] },
              { $eq: [{ $toString: "$comments.user" }, uidStr] },
            ],
          },
        },
      },
      {
        $project: {
          _id: "$comments._id",
          text: "$comments.text",
          postId: "$_id",
          rawContent: { $ifNull: ["$content", ""] },
          createdAt: "$comments.createdAt",
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 120 },
    ]);

    const results = rows.map((r) => {
      const raw = String(r.rawContent || "").trim();
      const postSnippet = raw
        ? raw.length > 80
          ? raw.slice(0, 80) + "…"
          : raw
        : "(פוסט ללא טקסט)";
      return {
        _id: r._id,
        text: r.text,
        postId: r.postId,
        postSnippet,
        createdAt: r.createdAt,
      };
    });

    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* פוסטים שלי + חברים, עם populate */
export async function getFeed(req, res) {
  try {
    const me = await User.findById(req.user._id).select("friends");
    const ids = [req.user._id, ...(me.friends || [])];
    const posts = await Post.find({ author: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "name avatar email")
      .populate("likes", "name avatar")
      .populate("comments.user", "name avatar");
    res.json(posts);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* הוספה/הסרה ממערך likes */
export async function toggleLike(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const uid = req.user._id.toString();
    const idx = post.likes.findIndex((id) => id.toString() === uid);
    if (idx >= 0) post.likes.splice(idx, 1);
    else post.likes.push(req.user._id);
    await post.save();
    await post.populate("author", "name avatar email");
    await post.populate("likes", "name avatar");
    await post.populate("comments.user", "name avatar");
    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* תגובה חדשה בתת־מסמך comments */
export async function addComment(req, res) {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Text required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();
    await post.populate("author", "name avatar email");
    await post.populate("likes", "name avatar");
    await post.populate("comments.user", "name avatar");
    res.json(post);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

/* מחיקה רק על ידי המחבר */
export async function deletePost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }
    await post.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
