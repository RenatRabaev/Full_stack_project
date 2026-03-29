/* צ'אט מוטמע בטאב פרופיל — ללא ניווט ל־/chat */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
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

/* בחירת שיחה מקומית (state), לא מה־URL */
export default function ProfileChatPanel() {
  const { token, user } = useSelector((s) => s.auth);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState({});

  /* סוקט גלובלי לפאנל (כל עוד מחוברים) */
  useEffect(() => {
    if (!token) return;
    const s = io({
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [token]);

  /* רשימת שיחות */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await client.get("/conversations");
      setConversations(data);
    })();
  }, [token]);

  /* הודעות לשיחה הנבחרת + join/leave */
  useEffect(() => {
    if (!socket || !conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await client.get(`/conversations/${conversationId}/messages`);
      if (!cancelled) setMessages(data);
    })();
    socket.emit("join", conversationId);
    const onMsg = (msg) => {
      const cid = String(msg.conversation?._id || msg.conversation || "");
      if (cid === String(conversationId)) {
        setMessages((prev) => {
          const rest = prev.filter((m) => m._id !== msg._id);
          return [...rest, msg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      }
    };
    socket.on("message", onMsg);
    return () => {
      cancelled = true;
      socket.emit("leave", conversationId);
      socket.off("message", onMsg);
    };
  }, [socket, conversationId]);

  /* דיאלוג קבוצה — טוען רשימת חברים */
  async function openGroupDialog() {
    const { data } = await client.get("/friends/list");
    setFriends(data);
    setSelectedIds({});
    setGroupName("");
    setGroupOpen(true);
  }

  /* יצירת קבוצה ובחירתה מיד אחרי */
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
    setConversationId(data._id);
  }

  /* שליחת הודעה בזמן אמת */
  function send(e) {
    e.preventDefault();
    if (!text.trim() || !socket || !conversationId) return;
    socket.emit("message", { conversationId, content: text.trim() });
    setText("");
  }

  /* תווית שיחה בסרגל */
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
        <Typography variant="subtitle1" fontWeight={600}>
          צ׳אט
        </Typography>
        <Button startIcon={<AddCommentIcon />} variant="outlined" size="small" onClick={openGroupDialog}>
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
            בחר חברים
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
              הוסף חברים בעמוד חברויות.
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
        gridTemplateColumns={{ xs: "1fr", md: "minmax(200px, 280px) 1fr" }}
        gap={2}
        minHeight={{ xs: 420, md: 480 }}
      >
        <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: 520 }}>
          <Box px={2} py={1.5} borderBottom={1} borderColor="divider">
            <Typography variant="subtitle2" fontWeight={600}>
              שיחות
            </Typography>
          </Box>
          <List dense sx={{ overflow: "auto", flex: 1, py: 0 }}>
            {conversations.map((c) => (
              <ListItemButton key={c._id} selected={c._id === conversationId} onClick={() => setConversationId(c._id)}>
                <ListItemText
                  primary={title(c)}
                  secondary={
                    c.lastMessage
                      ? `${c.lastMessage.sender?.name || ""}: ${c.lastMessage.content}`
                      : " "
                  }
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            ))}
            {conversations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                אין שיחות. פתח צ׳אט מעמוד חברויות או צור קבוצה.
              </Typography>
            )}
          </List>
        </Card>

        <Paper variant="outlined" sx={{ display: "flex", flexDirection: "column", minHeight: 360, maxHeight: 520 }}>
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
