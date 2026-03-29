/* חנות Redux — כרגע רק מצב אימות */
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});
