/**
 * דף אודות (about.html): שדרוג קישורי תצוגה מקדימה ל-React אם השרת מגיש את ה-SPA,
 * ומודל לצפייה בקוד מקור של קבצי HTML (fetch + Escape לסגירה).
 */
(function () {
  var fallbackPage = "./landing.html";

  /* בודק זמינות נתיב React ומעדכן href / התראה ב-file:// */
  function tryUpgradeSpaPreview(a) {
    var path = a.getAttribute("data-react-path");
    if (!path) return;
    if (path.charAt(0) !== "/") path = "/" + path;
    if (location.protocol === "file:") {
      a.href = "#";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        window.alert(
          "תצוגה מקדימה זמינה כשהשרת רץ. הרץ: npm run dev בתיקיית frontend, ואז פתח את הדף בכתובת http://localhost:5173/about.html"
        );
      });
      return;
    }
    if (location.protocol !== "http:" && location.protocol !== "https:") return;

    var spaUrl = new URL(path, location.origin).href;
    var fallbackUrl = new URL(fallbackPage, location.href).href;

    /* כשה-SPA לא נגיש — קישור חוזר לדף הבית הסטטי */
    function applyFallback() {
      a.href = fallbackUrl;
      a.setAttribute(
        "title",
        "ממשק React לא זמין בכתובת זו. הרץ npm run dev ב־frontend או npm run build ואז פתח דרך השרת."
      );
    }

    fetch(spaUrl, { method: "GET", cache: "no-store" })
      .then(function (r) {
        if (r.ok) {
          a.href = spaUrl;
        } else {
          applyFallback();
        }
      })
      .catch(function () {
        applyFallback();
      });
  }

  document.querySelectorAll("a[data-react-path].js-react-preview").forEach(tryUpgradeSpaPreview);

  var modal = document.getElementById("htmlSourceModal");
  var codeEl = document.getElementById("htmlSourceCode");
  var titleEl = document.getElementById("htmlSourceTitle");
  var errEl = document.getElementById("htmlSourceError");

  /* מודל צפייה בקוד מקור של קובץ HTML */
  function openModal() {
    if (modal) modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  /* סגירת מודל קוד וניקוי תוכן */
  function closeModal() {
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
    if (codeEl) codeEl.textContent = "";
    if (errEl) errEl.hidden = true;
  }

  /* הודעת שגיאה כשטעינת קובץ המקור נכשלת */
  function showError(msg) {
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    if (codeEl) codeEl.textContent = "";
  }

  document.querySelectorAll("[data-html-source]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var file = btn.getAttribute("data-html-source");
      if (!file || !modal || !codeEl) return;
      if (titleEl) titleEl.textContent = file;
      if (errEl) errEl.hidden = true;
      codeEl.textContent = "טוען…";
      openModal();
      fetch("./" + file.replace(/^\.?\//, ""), { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("לא ניתן לטעון את הקובץ");
          return r.text();
        })
        .then(function (text) {
          codeEl.textContent = text;
        })
        .catch(function () {
          showError(
            "לא ניתן לטעון את קוד המקור. ודא שהדף נטען דרך שרת (למשל npm run dev) ולא מקובץ מקומי (file://)."
          );
        });
    });
  });

  var closeBtn = document.getElementById("htmlSourceModalClose");
  var backdrop = document.querySelector(".html-source-modal__backdrop");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) closeModal();
  });
})();
