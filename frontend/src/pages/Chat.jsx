/* דף צ'אט: רשימת שיחות, הודעות בזמן אמת (Socket.IO), קבוצות */
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddCommentIcon from "@mui/icons-material/AddComment";
import client from "../api/client";

/* רכיב ראשי: בחירת שיחה מה־URL, סוקט, טעינת הודעות */
export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useSelector((s) => s.auth);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState({});

  /* רשימת כל השיחות */
  useEffect(() => {
    (async () => {
      const { data } = await client.get("/conversations");
      setConversations(data);
    })();
  }, [conversationId]);

  /* חיבור Socket.IO עם JWT */
  useEffect(() => {
    if (!token || !conversationId) return;
    const s = io({
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [token, conversationId]);

  /* טעינת היסטוריה + הצטרפות לחדר + האזנה להודעות */
  useEffect(() => {
    if (!socket || !conversationId) return;
    let cancelled = false;
    (async () => {
      const { data } = await client.get(`/conversations/${conversationId}/messages`);
      if (!cancelled) setMessages(data);
    })();
    socket.emit("join", conversationId);
    const onMsg = (msg) => {
      const cid = String(msg.conversation?._id || msg.conversation || "");
      if (cid === String(conversationId)) {
        setMessages((prev) => [...prev.filter((m) => m._id !== msg._id), msg]);
      }
    };
    socket.on("message", onMsg);
    return () => {
      cancelled = true;
      socket.emit("leave", conversationId);
      socket.off("message", onMsg);
    };
  }, [socket, conversationId]);

  /* פתיחת דיאלוג יצירת קבוצה — טוען חברים */
  async function openGroupDialog() {
    const { data } = await client.get("/friends/list");
    setFriends(data);
    setSelectedIds({});
    setGroupName("");
    setGroupOpen(true);
  }

  /* יצירת שיחת קבוצה ומעבר אליה */
  async function createGroup() {
    const participantIds = Object.keys(selectedIds).filter((id) => selectedIds[id]);
    if (participantIds.length < 1) return;
    const { data } = await client.post("/conversations/group", {
      name: groupName.trim() || "קבוצה",
      participantIds,
    });
    setGroupOpen(false);
    const { data: list } = await client.get("/conversations");
    setConversations(list);
    navigate(`/chat/${data._id}`);
  }

  /* שליחת הודעה דרך הסוקט */
  function send(e) {
    e.preventDefault();
    if (!text.trim() || !socket || !conversationId) return;
    socket.emit("message", { conversationId, content: text.trim() });
    setText("");
  }

  /* כותרת לרשימת שיחות (שם קבוצה או שם הצד השני) */
  function title(conv) {
    if (!conv) return "";
    if (conv.isGroup) return conv.name || "קבוצה";
    const other = conv.participants?.find((p) => p._id !== user?._id);
    return other?.name || "שיחה";
  }

  const activeConv = conversations.find((c) => c._id === conversationId);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            צ׳אט בזמן אמת
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Socket.IO — שיחות אישיות או קבוצתיות, היסטוריה נשמרת ב־DB (לפי המסמך)
          </Typography>
        </Box>
        <Button startIcon={<AddCommentIcon />} variant="outlined" onClick={openGroupDialog}>
          קבוצה חדשה
        </Button>
      </Box>

      <Dialog open={groupOpen} onClose={() => setGroupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>יצירת צ׳אט קבוצתי</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="שם הקבוצה"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            בחר חברים להוספה
          </Typography>
          <FormGroup>
            {friends.map((f) => (
              <FormControlLabel
                key={f._id}
                control={
                  <Checkbox
                    checked={!!selectedIds[f._id]}
                    onChange={(e) =>
                      setSelectedIds((prev) => ({ ...prev, [f._id]: e.target.checked }))
                    }
                  />
                }
                label={f.name}
              />
            ))}
          </FormGroup>
          {friends.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              הוסף חברים בעמוד חברויות כדי ליצור קבוצה.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupOpen(false)}>ביטול</Button>
          <Button onClick={createGroup} variant="contained" disabled={friends.length === 0}>
            צור
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "280px 1fr" }}
        gap={2}
        minHeight={480}
      >
        <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
            <Typography variant="subtitle2" fontWeight={600}>
              שיחות
            </Typography>
          </Box>
          <List dense sx={{ overflow: "auto", flex: 1, py: 0 }}>
            {conversations.map((c) => (
              <ListItemButton
                key={c._id}
                component={RouterLink}
                to={`/chat/${c._id}`}
                selected={c._id === conversationId}
              >
                <ListItemText
                  primary={title(c)}
                  secondary={
                    c.lastMessage
                      ? `${c.lastMessage.sender?.name}: ${c.lastMessage.content}`
                      : " "
                  }
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            ))}
            {conversations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                פתח צ׳אט מעמוד חברויות (כפתור &quot;צ׳אט&quot;) או צור קבוצה.
              </Typography>
            )}
          </List>
        </Card>

        <Paper variant="outlined" sx={{ display: "flex", flexDirection: "column", minHeight: 400 }}>
          {!conversationId ? (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center" p={2}>
              <Typography color="text.secondary">בחר שיחה מהרשימה</Typography>
            </Box>
          ) : (
            <>
              <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
                <Typography fontWeight={600}>{title(activeConv)}</Typography>
              </Box>
              <Box flex={1} overflow="auto" p={2} display="flex" flexDirection="column" gap={1}>
                {messages.map((m) => {
                  const mine = m.sender?._id === user?._id || m.sender === user?._id;
                  return (
                    <Box key={m._id} display="flex" justifyContent={mine ? "flex-start" : "flex-end"}>
                      <Box
                        sx={{
                          maxWidth: "80%",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: mine ? "primary.main" : "grey.200",
                          color: mine ? "primary.contrastText" : "text.primary",
                        }}
                      >
                        {!mine && (
                          <Typography variant="caption" display="block" sx={{ opacity: 0.85 }}>
                            {m.sender?.name}
                          </Typography>
                        )}
                        <Typography variant="body2">{m.content}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              <Divider />
              <Box component="form" onSubmit={send} display="flex" gap={1} p={2}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="הקלד הודעה…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button type="submit" variant="contained">
                  שלח
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
