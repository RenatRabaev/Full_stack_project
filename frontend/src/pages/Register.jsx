/* הרשמה; אם המייל קיים — הצעות להתחברות ואיפוס סיסמה */
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const REGISTER_EMAIL_EXISTS_MSG = "המייל כבר רשום נא להתחבר או לאפס סיסמה";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { clearError, registerUser } from "../store/authSlice.js";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authError = useSelector((s) => s.auth.error);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  /* registerUser ב־Redux — הצלחה מובילה לפיד */
  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    const res = await dispatch(registerUser({ name, email, password }));
    setPending(false);
    if (registerUser.fulfilled.match(res)) navigate("/feed", { replace: true });
  }

  return (
    <Box component="main" id="main-app" tabIndex={-1} maxWidth={420} mx="auto" mt={6} py={2} px={2}>
      <Card elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            הרשמה
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {authError && (
              <>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {authError}
                </Alert>
                {authError === REGISTER_EMAIL_EXISTS_MSG && (
                  <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                    <Button component={RouterLink} to="/login" variant="contained" sx={{ flex: "1 1 140px" }}>
                      התחברות
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      sx={{ flex: "1 1 140px" }}
                      onClick={() =>
                        navigate("/login", { state: { openForgot: true, forgotEmail: email } })
                      }
                    >
                      איפוס סיסמה
                    </Button>
                  </Box>
                )}
              </>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              label="שם משתמש"
              autoComplete="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="אימייל"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="סיסמה (מינימום 6)"
              type="password"
              inputProps={{ minLength: 6 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" fullWidth sx={{ mt: 2 }} disabled={pending}>
              {pending ? "נרשם…" : "צור חשבון"}
            </Button>
          </Box>
          <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
            כבר רשום?{" "}
            <Link component={RouterLink} to="/login">
              התחברות
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
