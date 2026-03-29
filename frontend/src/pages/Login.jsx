/* התחברות: Redux login + דיאלוג "שכחתי סיסמה" (מצב מקומי) */
import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { clearError, loginUser } from "../store/authSlice.js";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authError = useSelector((s) => s.auth.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotName, setForgotName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  /* פתיחת איפוס סיסמה כשנשלחים מההרשמה עם state */
  useEffect(() => {
    const st = location.state;
    if (st && st.openForgot) {
      setForgotSent(false);
      setForgotName("");
      setForgotEmail(st.forgotEmail ? String(st.forgotEmail) : "");
      setForgotOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  /* שליחת אימייל/סיסמה — מעבר לפיד אם הצליח */
  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    const res = await dispatch(loginUser({ email, password }));
    setPending(false);
    if (loginUser.fulfilled.match(res)) navigate("/feed", { replace: true });
  }

  /* פתיחת מודל איפוס */
  function openForgot() {
    setForgotSent(false);
    setForgotName("");
    setForgotEmail("");
    setForgotOpen(true);
  }

  /* ללא שרת — רק מציג "נשלח" */
  function submitForgot(e) {
    e.preventDefault();
    if (!forgotName.trim() || !forgotEmail.trim()) return;
    setForgotSent(true);
  }

  /* סגירת מודל ואיפוס מצב */
  function closeForgot() {
    setForgotOpen(false);
    setForgotSent(false);
  }

  return (
    <Box component="main" id="main-app" tabIndex={-1} maxWidth={420} mx="auto" mt={6} py={2} px={2}>
      <Dialog open={forgotOpen} onClose={closeForgot} fullWidth maxWidth="sm">
        <DialogTitle>איפוס סיסמה</DialogTitle>
        <DialogContent>
          {forgotSent ? (
            <Alert severity="success">הבקשה נקלטה.</Alert>
          ) : (
            <Box component="form" id="forgot-form" onSubmit={submitForgot}>
              <TextField
                margin="dense"
                required
                fullWidth
                label="שם משתמש"
                value={forgotName}
                onChange={(e) => setForgotName(e.target.value)}
                autoComplete="username"
              />
              <TextField
                margin="dense"
                required
                fullWidth
                label="אימייל"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoComplete="email"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeForgot}>סגור</Button>
          {!forgotSent && (
            <Button type="submit" form="forgot-form" variant="contained">
              שלח בקשת איפוס
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Card elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            התחברות
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {authError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {authError}
              </Alert>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              label="אימייל"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="סיסמה"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Box sx={{ mt: 0.5, textAlign: "start" }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={openForgot}
                sx={{ cursor: "pointer" }}
              >
                שכחתי סיסמה
              </Link>
            </Box>
            <Button type="submit" fullWidth sx={{ mt: 2 }} disabled={pending}>
              {pending ? "מתחבר…" : "התחבר"}
            </Button>
          </Box>
          <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
            אין חשבון?{" "}
            <Link component={RouterLink} to="/register">
              הרשמה
            </Link>
          </Typography>
        </CardContent>
      </Card>
      <Box
        sx={{
          mt: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          flexWrap: "wrap",
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "text.secondary",
        }}
      >
        <Box component="span" aria-hidden sx={{ color: "primary.main", opacity: 0.9, fontSize: "0.85rem" }}>
          ©
        </Box>
        <Typography component="span" variant="caption" sx={{ letterSpacing: "0.08em" }}>
          זכויות שמורים ל־
        </Typography>
        <Typography component="span" variant="caption" fontWeight={700} sx={{ letterSpacing: "0.06em", color: "text.primary" }}>
          Renat Rabaev
        </Typography>
      </Box>
    </Box>
  );
}
