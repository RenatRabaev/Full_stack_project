/**
 * חברויות סטטיות — sessionStorage: בקשות נכנסות/יוצאות, רשימת חברים, סנכרון שרשורי צ'אט בפרופיל.
 * נטען מ־feed.html ו־profile.html; window.StaticFriends חושף API לטעינה/שמירה ולכפתורי «חבר» בפיד.
 */
(function (global) {
  var NAME_KEY = "sn_static_display_name";
  var INCOMING_KEY = "sn_static_incoming_requests";
  var OUTGOING_KEY = "sn_static_outgoing_friend_requests";
  var FRIENDS_KEY = "sn_static_friends_list";
  var CHAT_THREADS_KEY = "sn_static_profile_chat_threads";

  /* אימיילים לפי שם מחבר בפוסטים סטטיים */
  var EMAIL_MAP = {
    "דנה כהן": "dana@demo.feed",
    "יונתן לוי": "yoni@demo.feed",
    "אתה": "self@demo.feed",
  };

  /* מנחש אימייל לפי שם כשאין רשומה מפורשת */
  function guessEmail(authorName) {
    var k = String(authorName || "").trim();
    if (EMAIL_MAP[k]) return EMAIL_MAP[k];
    return (
      k
        .replace(/\s+/g, ".")
        .toLowerCase()
        .replace(/[()]/g, "") + "@feed.demo"
    );
  }

  /* שם התצוגה של המשתמש המחובר */
  function getDisplayName() {
    try {
      return String(sessionStorage.getItem(NAME_KEY) || "").trim();
    } catch (e) {
      return "";
    }
  }

  /* טוען בקשות חברות נכנסות מ-sessionStorage */
  function loadIncoming() {
    try {
      var a = JSON.parse(sessionStorage.getItem(INCOMING_KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  /* שומר מערך בקשות נכנסות */
  function saveIncoming(arr) {
    sessionStorage.setItem(INCOMING_KEY, JSON.stringify(arr));
  }

  /* טוען בקשות חברות ששלחתי (ממתינות) */
  function loadOutgoing() {
    try {
      var a = JSON.parse(sessionStorage.getItem(OUTGOING_KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  /* שומר בקשות יוצאות */
  function saveOutgoing(arr) {
    sessionStorage.setItem(OUTGOING_KEY, JSON.stringify(arr));
  }

  /* טוען רשימת חברים מאושרים */
  function loadFriends() {
    try {
      var a = JSON.parse(sessionStorage.getItem(FRIENDS_KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  /* שומר רשימת חברים */
  function saveFriends(arr) {
    sessionStorage.setItem(FRIENDS_KEY, JSON.stringify(arr));
  }

  /* נירמול שם להשוואה */
  function normName(s) {
    return String(s || "").trim();
  }

  /* בודק אם השם כבר ברשימת החברים */
  function isFriend(authorName) {
    var n = normName(authorName);
    return loadFriends().some(function (f) {
      return normName(f.name) === n;
    });
  }

  /* כבר נשלחה בקשה יוצאת אל המשתמש */
  function hasOutgoingTo(authorName) {
    var n = normName(authorName);
    return loadOutgoing().some(function (r) {
      return normName(r.toName) === n;
    });
  }

  /* יש בקשה נכנסת מהמשתמש (ממתין לאישור בפרופיל) */
  function hasIncomingFrom(authorName) {
    var n = normName(authorName);
    return loadIncoming().some(function (r) {
      return normName(r.fromName) === n;
    });
  }

  /** שליחת בקשת חברות מהפיד. מחזיר סטטוס תוצאה */
  function sendFriendRequestTo(authorName) {
    var me = getDisplayName();
    var to = normName(authorName);
    if (!to) return "self";
    if (me && to === me) return "self";
    if (isFriend(to)) return "friend";
    if (hasOutgoingTo(to)) return "exists";
    if (hasIncomingFrom(to)) return "pending";
    var out = loadOutgoing();
    out.unshift({
      id: "out-" + Date.now(),
      toName: to,
      toEmail: guessEmail(to),
    });
    saveOutgoing(out);
    return "ok";
  }

  /* מוסיף חבר לאחר אישור בקשה ומסנכרן שיחות צ'אט */
  function addFriendAndSyncChat(fromName, fromEmail) {
    var friends = loadFriends();
    var n = normName(fromName);
    if (!n) return;
    if (
      friends.some(function (f) {
        return normName(f.name) === n;
      })
    ) {
      syncAllFriendsToChat();
      return;
    }
    friends.push({
      id: "fr-" + Date.now(),
      name: n,
      email: fromEmail || guessEmail(n),
    });
    saveFriends(friends);
    syncAllFriendsToChat();
  }

  /* יוצר/מעדכן שורות שיחה בפרופיל לכל חבר ברשימה */
  function syncAllFriendsToChat() {
    var friends = loadFriends();
    var threads;
    try {
      threads = JSON.parse(sessionStorage.getItem(CHAT_THREADS_KEY) || "[]");
    } catch (e) {
      threads = [];
    }
    if (!Array.isArray(threads)) threads = [];
    if (!threads.length) {
      threads = [
        { id: "dm1", title: "אליס", messages: [] },
        { id: "g1", title: "קבוצת פרויקט", messages: [] },
      ];
    }
    friends.forEach(function (f) {
      var fid = f.id ? String(f.id) : "";
      var tid = fid ? "friend-" + fid.replace(/[^a-zA-Z0-9_-]/g, "") : "friend-" + normName(f.name).replace(/\s+/g, "-");
      var exists = threads.some(function (t) {
        return (
          (fid && t.friendId === fid) ||
          (t.isFriendThread && normName(t.friendName) === normName(f.name))
        );
      });
      if (!exists) {
        threads.unshift({
          id: tid,
          title: f.name,
          messages: [],
          isFriendThread: true,
          friendName: f.name,
          friendId: fid || undefined,
        });
      }
    });
    sessionStorage.setItem(CHAT_THREADS_KEY, JSON.stringify(threads));
  }

  /* מעדכן מצב כפתור «חבר» ליד שם מחבר בפוסט */
  function updateFriendButton(btn, authorName) {
    if (!btn) return;
    var to = normName(authorName);
    var me = getDisplayName();
    btn.disabled = false;
    btn.classList.remove("post__add-friend--sent", "post__add-friend--friend", "post__add-friend--pending");
    if (!me) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    if (to === me) {
      btn.hidden = true;
      return;
    }
    if (isFriend(to)) {
      btn.classList.add("post__add-friend--friend");
      btn.disabled = true;
      btn.setAttribute("aria-label", "כבר חבר/ה עם " + to);
      return;
    }
    if (hasOutgoingTo(to)) {
      btn.classList.add("post__add-friend--sent");
      btn.disabled = true;
      btn.setAttribute("aria-label", "בקשה נשלחה ל־" + to);
      return;
    }
    if (hasIncomingFrom(to)) {
      btn.classList.add("post__add-friend--pending");
      btn.disabled = true;
      btn.setAttribute("aria-label", "יש בקשה נכנסת מ־" + to + " — אשר בפרופיל");
      return;
    }
    btn.setAttribute("aria-label", "שלח בקשת חברות ל־" + to);
  }

  /* מרענן את כל כפתורי החברות בפיד לפי מצב האחסון */
  function refreshAllFeedFriendButtons() {
    document.querySelectorAll(".post__add-friend").forEach(function (btn) {
      var nameEl = btn.closest(".post__head") && btn.closest(".post__head").querySelector(".post__name");
      var author = nameEl ? nameEl.textContent.trim() : btn.getAttribute("data-author");
      updateFriendButton(btn, author || "");
    });
  }

  /* מאזין ללחיצות על כפתור חבר ב־#staticPostList (העלאה דינמית של פוסטים) */
  function bindFeedFriendButtons() {
    var root = document.getElementById("staticPostList");
    if (root && root.dataset.snFriendDelegate !== "1") {
      root.dataset.snFriendDelegate = "1";
      root.addEventListener("click", function (e) {
        var btn = e.target.closest(".post__add-friend");
        if (!btn || btn.disabled || btn.hidden) return;
        e.preventDefault();
        e.stopPropagation();
        var head = btn.closest(".post__head");
        var nameEl = head && head.querySelector(".post__name");
        var author = nameEl ? nameEl.textContent.trim() : btn.getAttribute("data-author");
        var r = sendFriendRequestTo(author);
        if (r === "ok") {
          refreshAllFeedFriendButtons();
        } else if (r === "self") {
          /* ללא פעולה */
        } else if (r === "friend") {
          alert("כבר רשומים כחברים.");
        } else if (r === "exists") {
          alert("כבר שלחת בקשה למשתמש/ת זה/ו.");
        } else if (r === "pending") {
          alert("יש בקשה נכנסת ממשתמש/ת זה/ו — אשר או דחה בפרופיל > בקשות חברות.");
        }
      });
    }
    refreshAllFeedFriendButtons();
  }

  global.StaticFriends = {
    INCOMING_KEY: INCOMING_KEY,
    OUTGOING_KEY: OUTGOING_KEY,
    FRIENDS_KEY: FRIENDS_KEY,
    guessEmail: guessEmail,
    loadIncoming: loadIncoming,
    saveIncoming: saveIncoming,
    loadOutgoing: loadOutgoing,
    saveOutgoing: saveOutgoing,
    loadFriends: loadFriends,
    saveFriends: saveFriends,
    isFriend: isFriend,
    hasOutgoingTo: hasOutgoingTo,
    sendFriendRequestTo: sendFriendRequestTo,
    addFriendAndSyncChat: addFriendAndSyncChat,
    syncAllFriendsToChat: syncAllFriendsToChat,
    refreshAllFeedFriendButtons: refreshAllFeedFriendButtons,
    bindFeedFriendButtons: bindFeedFriendButtons,
    incomingCount: function () {
      return loadIncoming().length;
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
