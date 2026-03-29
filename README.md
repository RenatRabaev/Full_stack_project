# Social network — final project (React + Node + Socket.IO + MongoDB)

פרויקט גמר לפי המסמך: רשת חברתית עם **פרופילים**, **פוסטים (פיד, לייקים, תגובות)**, **בקשות חברות**, **צ׳אט בזמן אמת** (יחד ליחד וקבוצות), **אימות JWT**, **העלאות (multer)**, **MongoDB**.

## מיפוי מהיר לדרישות הקורס

| נושא במסמך | מימוש בפרויקט |
|------------|----------------|
| צד לקוח — הרשמה/התחברות, JWT | `frontend/src/pages/Login.jsx`, `Register.jsx`, `store/authSlice.js` |
| פרופיל — צפייה + עריכה (כולל תמונה, ביוגרפיה, טלפון, מיקום) | `frontend/src/pages/Profile.jsx` · נתיבים לפרופיל אחר: `/users/:id` |
| פיד — פוסטים, לייקים, תגובות, טקסט + תמונה | `frontend/src/pages/Feed.jsx` |
| חברויות — גילוי, בקשות, רשימת חברים | `frontend/src/pages/Friends.jsx` |
| צ׳אט — Socket.IO, שיחות, היסטוריה ב־DB | `frontend/src/pages/Chat.jsx` · `backend/sockets/chatSocket.js` |
| צד שרת — REST, Auth (bcrypt + JWT), Users, Friends, Posts, Conversations | `backend/src/index.js`, `backend/routes/*`, `backend/controllers/*` |
| העלאות קבצים | `backend/middleware/uploadMiddleware.js` · קבצים ב־`backend/uploads/` |
| מודל נתונים | `backend/models/` (User, Post, FriendRequest, Conversation, Message) |

**רכיבים אופציונליים במסמך** (התראות, Stories, מצב כהה, רענון פיד בזמן אמת, פריסה מלאה) — **לא ממומשים** כרגע.

**תיעוד נוסף:** סיכום מפורט מול מסמך הדרישות (HTML/PDF) בתיקייה `docs/` (למשל `docs/project-gmar-summary.pdf`).

## Prerequisites

- **Node.js** 18+ (ל־`node --watch` ב־backend; אפשר גם `npm start` בלי watch)
- **MongoDB** מקומי או URI בענן (Atlas)

## Setup

### 1. MongoDB

ברירת מחדל: `mongodb://127.0.0.1:27017/social_network`

### 2. Backend

```bash
cd backend
copy .env.example .env
# ערוך .env — JWT_SECRET, MONGODB_URI, ואופציונלי CLIENT_URL (ברירת מחדל: http://localhost:5173)
npm install
npm run dev
```

ה־API רץ ב־**http://localhost:5000** (REST + Socket.IO + קבצים סטטיים תחת `/uploads`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

פתח **http://localhost:5173**. Vite מפנה (proxy) את `/api`, `/uploads` ו־`/socket.io` לשרת בפורט 5000.

## דפי HTML+CSS סטטיים (השלמה לפני React)

ב־`frontend/public/` — אותו עיצוב (`landing.css`), קישורים ביניהם: `landing.html`, `login.html`, `register.html`, `feed.html`, `profile.html`, `about.html` (אודות הפרויקט) וקבצי JS עזר. בפיתוח, לדוגמה: `/landing.html`, `/about.html`, …

## Features implemented

| Area | Details |
|------|--------|
| Auth | Register / login, **bcrypt**, **JWT** — הטוקן נשמר ב־**sessionStorage** (`sn_token`, נסגר עם סגירת הלשונית) |
| Profile | צפייה ועריכה: שם, ביוגרפיה, תמונת פרופיל, טלפון, מיקום |
| Feed | פוסטים עם **טקסט + תמונה**, **לייקים**, **תגובות**, מחיקה לבעלים |
| Friends | גילוי משתמשים, **חיפוש**, שליחת בקשה, אישור/דחייה, רשימת חברים, פתיחת DM |
| Chat | **Socket.IO** rooms לפי שיחה, **היסטוריית הודעות** ב־MongoDB; יצירת **קבוצה** מהממשק |
| Server | Express **REST**, העלאות תחת `backend/uploads` |

הממשק בעברית עם **RTL**, בהתאם לאופי מסמך הקורס.

## תוצרים נדרשים (מסמך הקורס)

| תוצר | סטטוס |
|------|--------|
| מאגר קוד (Frontend + Backend) | כאן |
| README עם הוראות התקנה והרצה | כאן |
| פרויקט רץ ומדגים את התכונות | לאחר הרצת MongoDB + השרת + Vite |
| סרטון 5–10 דקות / הדגמה חיה | **מחוץ לריפו** — יש להפיק ולהגיש לפי הנחיות הקורס |

## Suggested demo flow (5–10 min video)

1. הרשמה לשני משתמשים (שני דפדפנים או incognito).
2. שליחת בקשת חברות ואישור; וידוא ששניהם רואים זה את זה ב־Friends.
3. פרסום פוסט עם טקסט ותמונה; לייק ותגובה מצד המשתמש השני.
4. פתיחת **Chat** מ־Friends; שליחת הודעות בזמן אמת בשני הכיוונים.
5. עריכת פרופיל והעלאת אווטאר.

## Project layout (כמו המלצת המסמך)

```
/backend
  /routes
  /models
  /controllers
  /middleware
  /sockets
  /uploads
/frontend
  /public          ← דפי HTML סטטיים + CSS
  /src
    /components
    /pages
    /store         ← Redux Toolkit (מקביל ל־Context API במסמך)
    /api
    /theme
/docs              ← סיכום דרישות (אופציונלי)
README.md
```

## Tech choices — בהתאם למסמך

- **React** + **React Router**
- **Material UI (MUI)** — עיצוב רספונסיבי (חלופה ל־Tailwind במסמך)
- **Redux Toolkit** — ניהול סטייט גלובלי (חלופה ל־Context API במסמך)
- **Socket.IO** (שרת + לקוח) — צ׳אט בזמן אמת
- **MongoDB + Mongoose** (במסמך: MongoDB או SQL)
- **Express**, **bcrypt**, **JWT**, **multer**

## API overview (בסיסי)

| Prefix | תיאור |
|--------|--------|
| `/api/auth` | הרשמה, התחברות |
| `/api/users` | פרופיל, חיפוש, עדכון, אווטאר |
| `/api/posts` | פיד, פוסטים, לייקים, תגובות |
| `/api/friends` | גילוי, בקשות, חברים |
| `/api/conversations` | שיחות, הודעות, DM, קבוצה |

פרטים מלאים בקבצי ה־routes וה־controllers.
