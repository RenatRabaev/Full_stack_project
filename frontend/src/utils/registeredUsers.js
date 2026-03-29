// רשימת משתמשים שנרשמו (בלי סיסמה) — נשארת אחרי סגירת הדפדפן
const REGISTRY_KEY = "sn_registered_users";

function readRegistry() {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

// אחרי הרשמה מוצלחת — דוחף/מעדכן לפי אימייל (מקס' 300 רשומות)
export function rememberRegisteredUser(user) {
  if (!user?.email) return;
  const email = String(user.email).trim().toLowerCase();
  if (!email) return;
  const arr = readRegistry();
  const entry = {
    name: user.name || "",
    email,
    registeredAt: new Date().toISOString(),
    _id: String(user._id || user.id || ""),
  };
  const i = arr.findIndex((x) => String(x.email || "").toLowerCase() === email);
  if (i >= 0) arr[i] = { ...arr[i], ...entry };
  else arr.push(entry);
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(arr.slice(-300)));
  } catch {
    /* אם האחסון מלא — לא שוברים את ההרשמה */
  }
}
