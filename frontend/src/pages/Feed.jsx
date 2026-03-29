/* פיד: רשימת פוסטים, יצירה, לייקים, תגובות ומחיקה */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Dialog,
  IconButton,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CommentIcon from "@mui/icons-material/Comment";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useSelector } from "react-redux";
import client from "../api/client";
import { SN_COMMENT_POSTED } from "../utils/appEvents.js";

/* כרטיס פוסט בודד — לייק, תגובות, מחיקה לבעלים */
function PostCard({ post, user, onLike, onComment, onDelete, focusPostId }) {
  const authorId = post.author?._id || post.author;
  const liked = post.likes?.some((l) => String(l._id || l) === String(user?._id));
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [imageLightbox, setImageLightbox] = useState(false);
  const [highlight, setHighlight] = useState(false);

  const postElId = `feed-post-${post._id}`;

  useEffect(() => {
    if (!focusPostId || String(post._id) !== String(focusPostId)) {
      setHighlight(false);
      return;
    }
    setShowComments(true);
    setHighlight(true);
    const t = window.setTimeout(() => setHighlight(false), 4000);
    return () => window.clearTimeout(t);
  }, [focusPostId, post._id]);

  return (
    <Card
      id={postElId}
      variant="outlined"
      sx={
        highlight
          ? {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 4,
              borderRadius: 1,
            }
          : undefined
      }
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar src={post.author?.avatar || undefined} sx={{ bgcolor: "primary.light" }}>
            {post.author?.name?.[0]}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={600}>{post.author?.name}</Typography>
              {String(authorId) === String(user?._id) && (
                <IconButton size="small" color="error" onClick={() => onDelete(post._id)} aria-label="מחיקה">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
            {post.content ? (
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                {post.content}
              </Typography>
            ) : null}
            {post.image ? (
              <>
                <Box
                  component="img"
                  src={post.image}
                  alt=""
                  onClick={() => setImageLightbox(true)}
                  sx={{
                    mt: 2,
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    borderRadius: 1,
                    cursor: "zoom-in",
                  }}
                />
                <Dialog
                  open={imageLightbox}
                  onClose={() => setImageLightbox(false)}
                  fullScreen
                  PaperProps={{
                    sx: {
                      m: 0,
                      bgcolor: "rgba(15, 23, 42, 0.94)",
                      boxShadow: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={post.image}
                    alt=""
                    onClick={() => setImageLightbox(false)}
                    sx={{
                      display: "block",
                      maxWidth: "calc(100vw - 24px)",
                      maxHeight: "calc(100dvh - 24px)",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      cursor: "pointer",
                    }}
                  />
                </Dialog>
              </>
            ) : null}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <IconButton size="small" color={liked ? "error" : "default"} onClick={() => onLike(post._id)}>
                {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <Typography variant="caption">{post.likes?.length || 0}</Typography>
              <Button
                size="small"
                startIcon={<CommentIcon />}
                onClick={() => setShowComments((v) => !v)}
              >
                תגובות ({post.comments?.length || 0})
              </Button>
            </Stack>
            <Collapse in={showComments}>
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
                {(post.comments || []).map((c) => (
                  <Typography key={c._id} variant="body2" sx={{ mb: 1 }}>
                    <strong>{c.user?.name}</strong> {c.text}
                  </Typography>
                ))}
                <Stack
                  component="form"
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!commentText.trim()) return;
                    onComment(post._id, commentText);
                    setCommentText("");
                  }}
                >
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="כתוב תגובה…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button type="submit" variant="contained" size="small">
                    שלח
                  </Button>
                </Stack>
              </Box>
            </Collapse>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/* טעינת פיד, יצירת פוסט (טקסט/תמונה), לייק/תגובה/מחיקה */
export default function Feed() {
  const { user } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const focusPostId = searchParams.get("post");

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* שליפת פוסטים מהשרת */
  async function load() {
    const { data } = await client.get("/posts/feed");
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  /* קישור מפרופיל: ?post= — גלילה לפוסט, אחר כך הסרת הפרמטר מה־URL */
  useEffect(() => {
    if (!focusPostId || loading || posts.length === 0) return;
    const t1 = setTimeout(() => {
      const el = document.getElementById(`feed-post-${focusPostId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    const t2 = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("post");
          return next;
        },
        { replace: true }
      );
    }, 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [focusPostId, loading, posts.length, setSearchParams]);

  /* שליחת פוסט חדש (FormData) ורענון הרשימה */
  async function submitPost(e) {
    e.preventDefault();
    const fd = new FormData();
    if (content.trim()) fd.append("content", content.trim());
    if (file) fd.append("image", file);
    if (!content.trim() && !file) return;
    await client.post("/posts", fd);
    setContent("");
    setFile(null);
    load();
  }

  /* לייק/ביטול לייק — עדכון הפוסט ברשימה */
  async function onLike(id) {
    const { data } = await client.post(`/posts/${id}/like`);
    setPosts((prev) => prev.map((p) => (p._id === id ? data : p)));
  }

  /* הוספת תגובה — מחזיר את הפוסט המעודכן */
  async function onComment(id, text) {
    const { data } = await client.post(`/posts/${id}/comments`, { text });
    setPosts((prev) => prev.map((p) => (p._id === id ? data : p)));
    /* עדכון היסטוריית תגובות בפרופיל (גם על פוסט של חבר) */
    window.dispatchEvent(new CustomEvent(SN_COMMENT_POSTED));
  }

  /* מחיקת פוסט (רק בעלים) */
  async function onDelete(id) {
    if (!window.confirm("למחוק את הפוסט?")) return;
    await client.delete(`/posts/${id}`);
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        פיד
      </Typography>
      <Typography variant="body2" color="text.secondary">
        פוסטים שלך ושל חברים — לייקים ותגובות (כפי שמופיע במסמך הפרויקט)
      </Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            פוסט חדש (טקסט ו/או תמונה)
          </Typography>
          <Box component="form" onSubmit={submitPost}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="מה עולה לך בראש?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" component="label">
                {file ? file.name : "בחר תמונה"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Button type="submit" variant="contained">
                פרסם
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Typography color="text.secondary">אין פוסטים עדיין. הוסף חברים או פרסם משהו.</Typography>
      ) : (
        <Stack spacing={2}>
          {posts.map((p) => (
            <PostCard
              key={p._id}
              post={p}
              user={user}
              onLike={onLike}
              onComment={onComment}
              onDelete={onDelete}
              focusPostId={focusPostId}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
