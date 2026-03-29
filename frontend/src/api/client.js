// axios ל-/api; ה-JWT נקבע אחרי login (בדרך כלל מ-sessionStorage)
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

/* קובע או מסיר Bearer token מכל הבקשות */
export function setAuthToken(token) {
  if (token) client.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete client.defaults.headers.common.Authorization;
}

export default client;
