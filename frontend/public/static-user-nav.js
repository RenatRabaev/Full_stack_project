/**
 * כותרת סטטית בכל דפי ה-HTML: מציג משתמש אם יש שם תצוגה ב-sessionStorage; התנתקות מנקה סשן.
 * חשבונות רשומים (sn_static_accounts) ב-localStorage — מיגרציה חד־פעמית מגרסה ישנה שאחסנה בסשן.
 *
 * window.StaticSession (אחרי טעינת הקובץ):
 *   isLoggedIn() — true אם יש משתמש מחובר (לפי שם בסשן).
 *   setPostLoginRedirect(url) — שומר יעד לניווט אחרי התחברות (למשל מכרטיסי דף הבית).
 *   consumePostLoginRedirect() — קורא את היעד ומוחק אותו (קוראים מ-login אחרי הצלחה).
 */
(function () {
  var NAME_KEY = "sn_static_display_name";
  var ACCOUNTS_KEY = "sn_static_accounts";
  var POSTS_KEY = "sn_static_feed_posts";
  var INTERACTIONS_KEY = "sn_static_post_interactions";
  var PREFILL_FORGOT_KEY = "sn_static_forgot_email";
  var SESSION_EMAIL_KEY = "sn_static_session_email";
  var INCOMING_REQ_KEY = "sn_static_incoming_requests";
  var CHAT_LOG_KEY = "sn_static_profile_chat_demo";
  var CHAT_THREADS_KEY = "sn_static_profile_chat_threads";
  var PROFILE_GALLERY_KEY = "sn_static_profile_gallery";
  var OUTGOING_FRIEND_KEY = "sn_static_outgoing_friend_requests";
  var FRIENDS_LIST_KEY = "sn_static_friends_list";
  var COMMENT_HISTORY_KEY = "sn_static_comment_history";
  var POST_LOGIN_REDIRECT_KEY = "sn_static_post_login_redirect";

  function normEmail(s) {
    return String(s || "")
      .trim()
      .toLowerCase();
  }

  // אם נשארו חשבונות ב-session מגרסה ישנה — מעבירים ל-localStorage ומוחקים מהסשן
  function migrateAccountsToLocalOnce() {
    try {
      var rawS = sessionStorage.getItem(ACCOUNTS_KEY);
      if (!rawS) return;
      var fromSess = JSON.parse(rawS);
      if (!Array.isArray(fromSess) || fromSess.length === 0) return;
      var rawL = localStorage.getItem(ACCOUNTS_KEY);
      var fromLocal = [];
      if (rawL) {
        try {
          fromLocal = JSON.parse(rawL);
        } catch (e) {
          fromLocal = [];
        }
      }
      if (!Array.isArray(fromLocal)) fromLocal = [];
      var by = {};
      for (var i = 0; i < fromLocal.length; i++) {
        var em = normEmail(fromLocal[i].email);
        if (em) by[em] = fromLocal[i];
      }
      for (var j = 0; j < fromSess.length; j++) {
        var em2 = normEmail(fromSess[j].email);
        if (em2) by[em2] = fromSess[j];
      }
      var merged = [];
      for (var k in by) {
        if (Object.prototype.hasOwnProperty.call(by, k)) merged.push(by[k]);
      }
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(merged));
      sessionStorage.removeItem(ACCOUNTS_KEY);
    } catch (e) {}
  }

  /* קורא את שם התצוגה מהסשן (ריק אם אין משתמש מחובר) */
  function getDisplayName() {
    try {
      var s = sessionStorage.getItem(NAME_KEY);
      return s && String(s).trim() ? String(s).trim() : "";
    } catch (e) {
      return "";
    }
  }

  /* יוצר ראשי תיבות מאותיות השם (לאווטאר) */
  function initialsFromName(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      var a = parts[0][0] || "";
      var b = parts[1][0] || "";
      return (a + b).toUpperCase();
    }
    if (parts[0]) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "?";
  }

  /* מחליף בין מצב אורח למצב משתמש מחובר בכותרת לפי קיום שם */
  function applyStaticHeader() {
    var guest = document.getElementById("staticHeaderGuest");
    var user = document.getElementById("staticHeaderUser");
    var nameEl = document.getElementById("staticUserName");
    var initialsEl = document.getElementById("staticUserInitials");
    var chip = document.getElementById("staticUserChip");
    if (!guest || !user) return;

    var name = getDisplayName();
    if (name) {
      guest.setAttribute("hidden", "");
      user.removeAttribute("hidden");
      if (nameEl) nameEl.textContent = name;
      if (initialsEl) initialsEl.textContent = initialsFromName(name);
      if (chip) chip.setAttribute("title", name);
    } else {
      guest.removeAttribute("hidden");
      user.setAttribute("hidden", "");
    }
  }

  /* לחיצה על התנתקות — מנקה נתוני סשן (ללא מחיקת רשימת חשבונות רשומים) */
  function bindLogout() {
    var logout = document.getElementById("staticLogout");
    if (!logout) return;
    logout.addEventListener("click", function () {
      try {
        sessionStorage.removeItem(NAME_KEY);
        sessionStorage.removeItem(POSTS_KEY);
        sessionStorage.removeItem(INTERACTIONS_KEY);
        sessionStorage.removeItem(PREFILL_FORGOT_KEY);
        sessionStorage.removeItem(SESSION_EMAIL_KEY);
        sessionStorage.removeItem(INCOMING_REQ_KEY);
        sessionStorage.removeItem(CHAT_LOG_KEY);
        sessionStorage.removeItem(CHAT_THREADS_KEY);
        sessionStorage.removeItem(PROFILE_GALLERY_KEY);
        sessionStorage.removeItem(OUTGOING_FRIEND_KEY);
        sessionStorage.removeItem(FRIENDS_LIST_KEY);
        sessionStorage.removeItem(COMMENT_HISTORY_KEY);
        sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      } catch (e) {}
    });
  }

  /* בודק התחברות סטטית (מבוסס שם בסשן בלבד) */
  function isLoggedIn() {
    return !!getDisplayName();
  }

  /* שומר URL מלא או יחסי לפתיחה מיד אחרי login מוצלח */
  function setPostLoginRedirect(url) {
    try {
      var u = String(url || "").trim();
      if (u) sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, u);
    } catch (e) {}
  }

  /* מחזיר יעד שמור ומוחק אותו מהסשן כדי שלא יישמר בין כניסות */
  function consumePostLoginRedirect() {
    try {
      var u = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      return u && String(u).trim() ? String(u).trim() : "";
    } catch (e) {
      return "";
    }
  }

  window.StaticSession = {
    isLoggedIn: isLoggedIn,
    setPostLoginRedirect: setPostLoginRedirect,
    consumePostLoginRedirect: consumePostLoginRedirect,
  };

  function run() {
    migrateAccountsToLocalOnce();
    bindLogout();
    applyStaticHeader();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
