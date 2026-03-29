// אימות: JWT ב-sessionStorage (נסגר עם הטאב), רשימת נרשמים ב-localStorage
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import client, { setAuthToken } from "../api/client";
import { rememberRegisteredUser } from "../utils/registeredUsers.js";

const SESSION_TOKEN_KEY = "sn_token";

function readSessionToken() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/* אחידות מזהה משתמש (_id) */
function normalizeUser(u) {
  if (!u) return null;
  return { ...u, _id: u._id || u.id };
}

// בעלייה: טוקן מהסשן בלבד; מנקים sn_token ישן מ-localStorage אם נשאר מגרסה קודמת
export const bootstrapAuth = createAsyncThunk("auth/bootstrap", async () => {
  try {
    const legacy = localStorage.getItem(SESSION_TOKEN_KEY);
    if (legacy) localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* */
  }
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    setAuthToken(null);
    return { user: null, token: null };
  }
  setAuthToken(token);
  try {
    const { data } = await client.get("/users/me");
    return { user: normalizeUser(data), token };
  } catch {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setAuthToken(null);
    return { user: null, token: null };
  }
});

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await client.post("/auth/login", { email, password });
      sessionStorage.setItem(SESSION_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      return { token: data.token, user: normalizeUser(data.user) };
    } catch (e) {
      const msg = e.response?.data?.message;
      return rejectWithValue(typeof msg === "string" && msg ? msg : "התחברות נכשלה");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await client.post("/auth/register", { name, email, password });
      rememberRegisteredUser(normalizeUser(data.user));
      sessionStorage.setItem(SESSION_TOKEN_KEY, data.token);
      setAuthToken(data.token);
      return { token: data.token, user: normalizeUser(data.user) };
    } catch (e) {
      const msg = e.response?.data?.message;
      return rejectWithValue(typeof msg === "string" && msg ? msg : "הרשמה נכשלה");
    }
  }
);

/* רענון אובייקט המשתמש מהשרת */
export const refreshUser = createAsyncThunk("auth/refresh", async () => {
  const { data } = await client.get("/users/me");
  return normalizeUser(data);
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: readSessionToken(),
    loading: true,
    error: null,
  },
  reducers: {
    logout(state) {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setAuthToken(null);
      state.user = null;
      state.token = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        if (action.payload.token) setAuthToken(action.payload.token);
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.user = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload ?? "התחברות נכשלה";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload ?? "הרשמה נכשלה";
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
