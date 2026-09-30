/* ============================================================
   marathihome.js — Marathi Medium Home (Isolated Module)
   ------------------------------------------------------------
   - ROUTE GUARD: requires an activeSession or bounces to auth.
   - CLIENT-SIDE TAB ROUTING: Home / Profile / About Us.
   - SUBJECT ENGINE: renders the fixed Marathi-medium subject
     list (including the मराठी language subject) into
     #marathiSubjectGrid with flat SVG icons.
   ============================================================ */

(function () {
  "use strict";

  const SESSION_KEY = "marathi10_session";
  const USERS_KEY = "marathi10_users";

  /* ---------- 1. ROUTE GUARD ----------
     If the session is missing (or corrupt), force a redirect back
     to the auth screen. Paths are relative to 10th/marathi/homepagemarathi/. */
  function forceAuth() {
    const AUTH = "../authmarathi/auth.html";
    try {
      window.top.location.replace(AUTH);
    } catch (e) {
      window.location.replace(AUTH);
    }
  }

  const sessionRaw = localStorage.getItem(SESSION_KEY);
  if (!sessionRaw) { forceAuth(); return; }

  let session;
  try {
    session = JSON.parse(sessionRaw);
  } catch (e) {
    forceAuth();
    return;
  }
  if (!session || !session.name) { forceAuth(); return; }

  // Load the user's profile from the marathi10_users map written by authmarathi.
  let users = {};
  try { users = JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { users = {}; }
  const profile = users[session.name];
  if (!profile) {
    localStorage.removeItem(SESSION_KEY);
    forceAuth();
    return;
  }

  // Friendly display name (First Last) sourced from the auth profile.
  const displayName =
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || session.name;

  /* ---------- 2. TAB SWITCHING (client-side routing) ---------- */
  const tabs = Array.from(document.querySelectorAll(".nav-tab"));
  const screens = {
    homeScreen: document.getElementById("homeScreen"),
    profileScreen: document.getElementById("profileScreen"),
    aboutScreen: document.getElementById("aboutScreen"),
  };

  function activate(targetId) {
    Object.keys(screens).forEach((id) => {
      if (screens[id]) screens[id].classList.toggle("is-active", id === targetId);
    });
    tabs.forEach((tab) => {
      const active = tab.dataset.target === targetId;
      tab.classList.toggle("is-active", active);
      if (active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab.dataset.target));
  });

  const profileQuickBtn = document.getElementById("profileQuickBtn");
  if (profileQuickBtn) {
    profileQuickBtn.addEventListener("click", () => activate("profileScreen"));
  }

  /* ---------- 2a. NOTIFICATION BUTTON ----------
     Opens the local notification page which loads the blog in an iframe
     with a back button to return to the app. */
  const notifBtn = document.getElementById("notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
  }

  /* ---------- 2b. PROFILE DATA (name / login / logout) ----------
     The profile data originates from authmarathi (marathi10_session +
     marathi10_users). We surface it directly on the home page. */
  function renderProfileData() {
    const welcomeName = document.getElementById("welcomeName");
    const profileName = document.getElementById("profileName");
    if (welcomeName) welcomeName.textContent = displayName;
    if (profileName) profileName.textContent = displayName;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      forceAuth();
    });
  }

  /* ---------- 3. SUBJECT ENGINE ----------
     Flat SVG icons (inherit --primary-color via currentColor). */
  const ICONS = {
    math:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>',
    science:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 14h9"/></svg>',
    history:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/><path d="M8 7h6M8 11h6"/></svg>',
    geography:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
    language:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7M7.5 5v0M9 5c0 4-2 7-5 8M12 20l4-9 4 9M14.5 16h3"/></svg>',
  };

  // Fixed Marathi-medium subject list (core 6 + मराठी + इंग्रजी language subjects).
  // Each subject links to its dedicated folder under 10th/marathi/.
  const SUBJECTS = [
    { key: "math1",     icon: "math",      name: "गणित १",     link: "../math 1 marathi/math1chapters_mr.html" },
    { key: "math2",     icon: "math",      name: "गणित २",     link: "../math 2 marathi/math2chapters_mr.html" },
    { key: "science1",  icon: "science",   name: "विज्ञान १",   link: "../science 1 marathi/sciencechapters_mr.html" },
    { key: "science2",  icon: "science",   name: "विज्ञान २",   link: "../science 2 marathi/sciencechapters_mr.html" },
    { key: "history",   icon: "history",   name: "इतिहास",     link: "../history marathi/historychapters_mr.html" },
    { key: "geography", icon: "geography", name: "भूगोल",       link: "../geography marathi/geographychapters_mr.html" },
    { key: "marathi",   icon: "language",  name: "मराठी",       link: "../marathi lang/marathichapters_mr.html" },
    { key: "english",   icon: "language",  name: "इंग्रजी",     link: "../english lang/englishchapters_en.html" },
  ];

  function renderSubjects() {
    const grid = document.getElementById("marathiSubjectGrid");
    if (!grid) return;
    grid.setAttribute("dir", "ltr");
    grid.innerHTML = SUBJECTS.map((s) =>
      '<button class="subject-card" type="button" data-subject="' + s.key + '">' +
        '<span class="subject-card__icon">' + ICONS[s.icon] + "</span>" +
        '<span class="subject-card__name">' + s.name + "</span>" +
      "</button>"
    ).join("");

    // Connect each subject card to its dedicated folder.
    grid.querySelectorAll(".subject-card").forEach((card) => {
      const subject = SUBJECTS.find((s) => s.key === card.dataset.subject);
      if (subject && subject.link) {
        card.addEventListener("click", () => {
          window.location.href = subject.link;
        });
      }
    });
  }

  /* ---------- 4. AUTO NOTIFICATION (once per tab session) ----------
     After 5 seconds on the home page, auto-redirect to the notification
     page. Uses sessionStorage so it only fires once until the tab is
     fully closed and reopened. */
  function tryAutoNotification() {
    if (sessionStorage.getItem("autoNotifShown")) return;
    sessionStorage.setItem("autoNotifShown", "true");
    setTimeout(function () {
      window.location.href = "notifications.html";
    }, 5000);
  }

  /* ---------- 5. INITIAL ROUTE (default: Home) ---------- */
  activate("homeScreen");
  renderSubjects();
  renderProfileData();
  tryAutoNotification();
})();
