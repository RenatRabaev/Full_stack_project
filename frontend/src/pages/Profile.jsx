/* פרופיל: צפייה/עריכה, גלריית פוסטים, בקשות חברות, צ'אט (טאבים) */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import client from "../api/client";
import { refreshUser } from "../store/authSlice.js";
import ProfileChatPanel from "../components/ProfileChatPanel.jsx";
import { SN_COMMENT_POSTED } from "../utils/appEvents.js";

/* ראשי תיבות כשאין תמונת פרופיל */
function userInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || "";
    const b = parts[1][0] || "";
    return (a + b).toUpperCase();
  }
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "?";
}

/* תאריך בעברית לתצוגה */
function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

/* פרופיל עצמי או משתמש אחר לפי :id ב־URL */
export default function Profile() {
  const { id } = useParams();
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const authLoading = useSelector((s) => s.auth.loading);
  const isMe = !id || id === me?._id;
  const profileId = isMe ? me?._id : id;

  const [tab, setTab] = useState("view");
  const [profile, setProfile] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [incoming, setIncoming] = useState([]);
  const [reqBusy, setReqBusy] = useState(false);
  const [friendActionError, setFriendActionError] = useState("");
  const [commentHistory, setCommentHistory] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const isFriend = useMemo(() => {
    if (!profile || !me?._id) return false;
    return (profile.friends || []).some((fid) => String(fid) === String(me._id));
  }, [profile, me?._id]);

  /* טעינת נתוני פרופיל — מ־Redux או GET /users/:id */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isMe) {
          setProfile(me);
          setName(me?.name || "");
          setBio(me?.bio || "");
          setPhone(me?.phone || "");
          setUserLocation(me?.location || "");
        } else {
          const { data } = await client.get(`/users/${id}`);
          if (!cancelled) {
            setProfile(data);
            setName(data.name);
            setBio(data.bio || "");
            setPhone(data.phone || "");
            setUserLocation(data.location || "");
          }
        }
      } catch {
        if (!cancelled) setError("משתמש לא נמצא");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isMe, me]);

  /* גלריה: פוסטים עם תמונה של המשתמש */
  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/posts/user/${profileId}`);
        if (!cancelled) setGallery(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setGallery([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  /* היסטוריית תגובות: כל תגובה שפרסמת (גם על פוסט של חבר) — מוצגת כאן */
  const loadMyComments = useCallback(async () => {
    if (!me?._id) return;
    setCommentsLoading(true);
    try {
      const { data } = await client.get("/posts/my-comments");
      setCommentHistory(Array.isArray(data) ? data : []);
    } catch {
      setCommentHistory([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [me?._id]);

  useEffect(() => {
    if (!isMe || !me?._id || authLoading) return;
    if (tab !== "view") return;
    loadMyComments();
  }, [isMe, me?._id, tab, authLoading, routeLocation.pathname, routeLocation.key, loadMyComments]);

  useEffect(() => {
    if (!isMe || !me?._id || authLoading) return;
    if (tab !== "view") return;
    const onRefresh = () => {
      loadMyComments();
    };
    window.addEventListener(SN_COMMENT_POSTED, onRefresh);
    return () => window.removeEventListener(SN_COMMENT_POSTED, onRefresh);
  }, [isMe, me?._id, tab, authLoading, loadMyComments]);

  /* בקשות חברות נכנסות (רק לפרופיל שלי, כשהטאב רלוונטי) */
  useEffect(() => {
    if (!isMe) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get("/friends/requests");
        if (!cancelled) setIncoming(data);
      } catch {
        if (!cancelled) setIncoming([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMe, tab]);

  /* עדכון שם, ביו, טלפון ומיקום */
  async function saveProfile(e) {
    e.preventDefault();
    if (!isMe) return;
    setSaving(true);
    setError("");
    try {
      await client.patch("/users/me", { name, bio, phone, location: userLocation });
      await dispatch(refreshUser());
      setProfile((p) => ({ ...p, name, bio, phone, location: userLocation }));
    } catch (err) {
      setError(err.response?.data?.message || "שמירה נכשלה");
    } finally {
      setSaving(false);
    }
  }

  /* העלאת תמונת פרופיל */
  async function onAvatar(e) {
    const f = e.target.files?.[0];
    if (!f || !isMe) return;
    const fd = new FormData();
    fd.append("avatar", f);
    await client.post("/users/me/avatar", fd);
    await dispatch(refreshUser());
    const { data } = await client.get("/users/me");
    setProfile(data);
    setName(data.name);
    setBio(data.bio || "");
    setPhone(data.phone || "");
    setUserLocation(data.location || "");
  }

  /* אישור/דחיית בקשת חברות */
  async function respondRequest(requestId, action) {
    await client.patch(`/friends/requests/${requestId}`, { action });
    const { data } = await client.get("/friends/requests");
    setIncoming(data);
    await dispatch(refreshUser());
  }

  /* שליחת בקשה לפרופיל שאני צופה בו */
  async function sendFriendRequest() {
    if (!id || isMe) return;
    setReqBusy(true);
    setFriendActionError("");
    try {
      await client.post(`/friends/request/${id}`);
    } catch (err) {
      setFriendActionError(err.response?.data?.message || "לא ניתן לשלוח בקשה");
    } finally {
      setReqBusy(false);
    }
  }

  /* מעבר לצ'אט פרטי עם המשתמש */
  async function openDm() {
    if (!id) return;
    const { data } = await client.get(`/conversations/dm/${id}`);
    navigate(`/chat/${data._id}`);
  }

  if (error && !profile) return <Alert severity="error">{error}</Alert>;
  if (!profile) return <Typography color="text.secondary">טוען…</Typography>;

  const viewSection = (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "center", sm: "flex-start" }}
        gap={3}
        mb={3}
      >
        <Avatar
          src={profile.avatar || undefined}
          sx={{ width: 120, height: 120, bgcolor: "primary.light", fontSize: "2.5rem" }}
        >
          {!profile.avatar ? userInitials(profile.name) : null}
        </Avatar>
        <Box flex={1} textAlign={{ xs: "center", sm: "start" }} width="100%">
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {profile.name}
          </Typography>
          {isMe && profile.email && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {profile.email}
            </Typography>
          )}
          <Typography variant="body1" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {profile.bio || "אין ביוגרפיה."}
          </Typography>
          <Box mt={2} display="flex" flexDirection="column" gap={0.5}>
            {(isMe || profile.phone) && (
              <Typography variant="body2">
                <strong>טלפון:</strong> {profile.phone || "—"}
              </Typography>
            )}
            {(isMe || profile.location) && (
              <Typography variant="body2">
                <strong>מיקום:</strong> {profile.location || "—"}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              חבר מאז {formatDate(profile.createdAt)}
            </Typography>
          </Box>
          {!isMe && (
            <StackRow sx={{ mt: 2, justifyContent: { xs: "center", sm: "flex-start" } }}>
              {!isFriend && (
                <Button
                  startIcon={<PersonAddIcon />}
                  variant="contained"
                  onClick={sendFriendRequest}
                  disabled={reqBusy}
                >
                  שלח בקשת חברות
                </Button>
              )}
              <Button startIcon={<ChatIcon />} variant="outlined" onClick={openDm}>
                צ׳אט
              </Button>
              <Button component={RouterLink} to="/friends" variant="text" size="small">
                חזרה לחברויות
              </Button>
            </StackRow>
          )}
        </Box>
      </Box>

      <Typography variant="h6" fontWeight={700} gutterBottom>
        גלריית תמונות מהפוסטים
      </Typography>
      {gallery.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          אין תמונות בגלריה.
        </Typography>
      ) : (
        <ImageList variant="masonry" cols={3} gap={12} sx={{ mb: 0 }}>
          {gallery.map((item) => (
            <ImageListItem key={item._id}>
              <img
                src={item.image}
                alt={item.content?.slice(0, 80) || ""}
                loading="lazy"
                style={{ borderRadius: 12 }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {isMe && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            היסטוריית תגובות
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            כל התגובות שפרסמת בפיד — כולל על פוסטים של משתמשים אחרים (חברים).
          </Typography>
          {commentsLoading ? (
            <Typography variant="body2" color="text.secondary">
              טוען…
            </Typography>
          ) : commentHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              אין תגובות שפרסמת.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1 }}>
              {commentHistory.map((row) => (
                <ListItem key={row._id} alignItems="flex-start" sx={{ flexDirection: "column", py: 1.5 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", width: "100%" }}>
                    <strong>תגובתך:</strong> {row.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    על פוסט: {row.postSnippet}
                    {row.createdAt ? ` · ${formatDate(row.createdAt)}` : ""}
                  </Typography>
                  <Button
                    component={RouterLink}
                    to={`/feed?post=${encodeURIComponent(String(row.postId))}`}
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: "flex-start", mt: 1 }}
                  >
                    פתח בפיד
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Box>
  );

  const editSection = isMe && (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          עריכת פרופיל
        </Typography>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={2}>
          <Avatar src={profile.avatar || undefined} sx={{ width: 72, height: 72 }}>
            {!profile.avatar ? userInitials(profile.name) : null}
          </Avatar>
          <Button variant="outlined" component="label" size="small">
            החלפת תמונת פרופיל
            <input type="file" accept="image/*" hidden onChange={onAvatar} />
          </Button>
        </Box>
        <Box component="form" onSubmit={saveProfile}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField fullWidth label="שם" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            label="ביוגרפיה"
            multiline
            minRows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField fullWidth label="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ mb: 2 }} />
          <TextField
            fullWidth
            label="מיקום"
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "שומר…" : "שמור שינויים"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const requestsSection = isMe && (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          בקשות חברות נכנסות
        </Typography>
        {incoming.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            אין בקשות ממתינות.
          </Typography>
        ) : (
          <List dense disablePadding>
            {incoming.map((r) => (
              <ListItem
                key={r._id}
                secondaryAction={
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      color="success"
                      variant="contained"
                      onClick={() => respondRequest(r._id, "accept")}
                    >
                      אשר
                    </Button>
                    <Button size="small" onClick={() => respondRequest(r._id, "reject")}>
                      דחה
                    </Button>
                  </Box>
                }
                sx={{ pr: 22, alignItems: "flex-start" }}
              >
                <ListItemAvatar>
                  <Avatar src={r.fromUser?.avatar || undefined}>{r.fromUser?.name?.[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography component={RouterLink} to={`/users/${r.fromUser?._id}`} color="primary">
                      {r.fromUser?.name}
                    </Typography>
                  }
                  secondary={r.fromUser?.email}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", width: "100%" }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {isMe ? "הפרופיל שלי" : `פרופיל: ${profile.name}`}
      </Typography>

      {isMe ? (
        <>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
          >
            <Tab label="פרופיל וגלריה" value="view" />
            <Tab label="עריכת פרופיל" value="edit" />
            <Tab label="בקשות חברות" value="requests" />
            <Tab label="צ׳אט" value="chat" />
          </Tabs>
          {tab === "view" && viewSection}
          {tab === "edit" && editSection}
          {tab === "requests" && requestsSection}
          {tab === "chat" && <ProfileChatPanel />}
        </>
      ) : (
        <>
          {friendActionError && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFriendActionError("")}>
              {friendActionError}
            </Alert>
          )}
          {viewSection}
        </>
      )}
    </Box>
  );
}

/* שורת כפתורים/תוכן עם ריווח אחיד */
function StackRow({ children, sx = {} }) {
  return (
    <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" sx={sx}>
      {children}
    </Box>
  );
}
