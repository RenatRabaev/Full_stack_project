/* מעטפת אפליקציה: AppBar, ניווט, שם משתמש והתנתקות */
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Stack,
  Avatar,
  Link,
} from "@mui/material";
import { logout } from "../store/authSlice.js";

/* ראשי תיבות לתצוגה באווטאר */
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

const nav = [
  { to: "/feed", label: "פיד" },
  { to: "/friends", label: "חברויות" },
  { to: "/chat", label: "צ׳אט" },
  { to: "/profile", label: "פרופיל" },
];

/* תפריט עליון + תוכן הדף (Outlet) */
export default function Layout() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" bgcolor="background.default">
      <AppBar position="sticky" color="inherit" elevation={1} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/feed"
            sx={{ textDecoration: "none", color: "primary.main", fontWeight: 700, flexGrow: { xs: 1, sm: 0 } }}
          >
            רשת חברתית
          </Typography>
          {user && (
            <Link
              component={RouterLink}
              to="/profile"
              underline="none"
              aria-label={"פרופיל: " + (user.name || "")}
              sx={{
                order: { xs: 3, sm: 0 },
                width: { xs: "100%", sm: "auto" },
                py: { xs: 0.5, sm: 0 },
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "inherit",
                position: "relative",
                zIndex: 2,
                borderRadius: 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Avatar
                src={user.avatar || undefined}
                alt=""
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  fontSize: "1rem",
                }}
              >
                {!user.avatar ? userInitials(user.name) : null}
              </Avatar>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" component="span" noWrap>
                {user.name}
              </Typography>
            </Link>
          )}
          <Stack
            direction="row"
            spacing={0.5}
            flexWrap="wrap"
            useFlexGap
            sx={{ flex: 1, justifyContent: "flex-end", position: "relative", zIndex: 1 }}
          >
            {nav.map(({ to, label }) => (
              <Button
                key={to}
                component={RouterLink}
                to={to}
                color={pathname === to || pathname.startsWith(`${to}/`) ? "primary" : "inherit"}
                variant={pathname === to || (to !== "/feed" && pathname.startsWith(`${to}/`)) ? "contained" : "text"}
                size="small"
              >
                {label}
              </Button>
            ))}
            <Button size="small" color="inherit" onClick={() => dispatch(logout())}>
              התנתקות
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container id="main-app" maxWidth="lg" component="main" sx={{ py: 3, flex: 1 }} tabIndex={-1}>
        <Outlet />
      </Container>
      <Box component="footer" py={2} textAlign="center" borderTop={1} borderColor="divider" bgcolor="background.paper">
        <Typography variant="caption" color="text.secondary" component="div">
          מחובר כ־{user?.name}
        </Typography>
        <Box
          component="div"
          sx={{
            mt: 1,
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
    </Box>
  );
}
