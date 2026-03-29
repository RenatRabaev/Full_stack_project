/* ניתוב: אורח (התחברות/הרשמה) מול משתמש מחובר + Layout */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { bootstrapAuth } from "./store/authSlice.js";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Chat from "./pages/Chat";

/* מסך טעינה בזמן בדיקת טוקן */
function LoadingScreen() {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
    >
      <CircularProgress />
    </Box>
  );
}

/* מגן מסלולים — רק עם JWT תקף */
function RequireAuth() {
  const { token, loading } = useSelector((s) => s.auth);
  if (loading) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/* דפי התחברות/הרשמה — מפנה לפיד אם כבר מחובר */
function GuestOnly() {
  const { token, loading } = useSelector((s) => s.auth);
  if (loading) return <LoadingScreen />;
  if (token) return <Navigate to="/feed" replace />;
  return <Outlet />;
}

// טוען סשן מ-sessionStorage (אם יש טוקן תקף)
export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:id" element={<Profile />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}
