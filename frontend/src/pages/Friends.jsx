/* חברויות: גילוי, בקשות נכנסות, רשימת חברים וחיפוש משתמשים */
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import client from "../api/client";

export default function Friends() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [discover, setDiscover] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  /* טעינת גילוי, בקשות וחברים במקביל */
  async function load() {
    const [d, i, f] = await Promise.all([
      client.get("/friends/discover"),
      client.get("/friends/requests"),
      client.get("/friends/list"),
    ]);
    setDiscover(d.data);
    setIncoming(i.data);
    setFriends(f.data);
  }

  useEffect(() => {
    load();
  }, []);

  /* חיפוש משתמשים עם debounce */
  useEffect(() => {
    let t;
    if (q.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    t = setTimeout(async () => {
      const { data } = await client.get("/users/search", { params: { q } });
      setSearchResults(data);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  /* שליחת בקשת חברות */
  async function sendRequest(userId) {
    await client.post(`/friends/request/${userId}`);
    load();
  }

  /* אישור או דחיית בקשה נכנסת */
  async function respond(id, action) {
    await client.patch(`/friends/requests/${id}`, { action });
    load();
  }

  /* פתיחת DM קיים או יצירה — מעבר לדף צ'אט */
  async function openChat(otherId) {
    const { data } = await client.get(`/conversations/dm/${otherId}`);
    navigate(`/chat/${data._id}`);
  }

  /* שורת משתמש ברשימה — צ'אט ו/או שליחת בקשה */
  function UserRow({ u, showAdd }) {
    return (
      <ListItem
        secondaryAction={
          <Box display="flex" gap={1}>
            {u._id !== user?._id && (
              <Button size="small" variant="outlined" onClick={() => openChat(u._id)}>
                צ׳אט
              </Button>
            )}
            {showAdd && u._id !== user?._id && (
              <Button size="small" variant="contained" onClick={() => sendRequest(u._id)}>
                שלח בקשה
              </Button>
            )}
          </Box>
        }
        sx={{ pr: showAdd || u._id !== user?._id ? 18 : 2 }}
      >
        <ListItemAvatar>
          <Avatar src={u.avatar || undefined}>{u.name?.[0]}</Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography component={RouterLink} to={`/users/${u._id}`} color="primary" sx={{ textDecoration: "none" }}>
              {u.name}
            </Typography>
          }
          secondary={u.email}
        />
      </ListItem>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        חברויות
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        חיפוש משתמשים, בקשות חברות, אישור/דחייה ורשימת חברים — כפי שמוגדר ב־API במסמך
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            חיפוש משתמשים
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="שם או אימייל…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ mb: 1 }}
          />
          <List dense disablePadding>
            {searchResults.map((u) => (
              <UserRow key={u._id} u={u} showAdd />
            ))}
          </List>
          {q.trim() && searchResults.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              אין תוצאות.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            בקשות נכנסות
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
                      <Button size="small" color="success" variant="contained" onClick={() => respond(r._id, "accept")}>
                        אשר
                      </Button>
                      <Button size="small" onClick={() => respond(r._id, "reject")}>
                        דחה
                      </Button>
                    </Box>
                  }
                  sx={{ pr: 22 }}
                >
                  <ListItemText primary={r.fromUser?.name} secondary={r.fromUser?.email} />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            החברים שלי
          </Typography>
          <List dense disablePadding>
            {friends.map((u) => (
              <UserRow key={u._id} u={u} showAdd={false} />
            ))}
          </List>
          {friends.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              עדיין אין חברים.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            גילוי משתמשים
          </Typography>
          <List dense disablePadding>
            {discover
              .filter((u) => u._id !== user?._id)
              .map((u) => (
                <Box key={u._id}>
                  <UserRow u={u} showAdd />
                  <Divider component="li" />
                </Box>
              ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
