/* ============================================================
   auth.js — 10th Marathi: Authentication (Sign Up / Log In)
   ------------------------------------------------------------
   OFFLINE-FIRST MODEL (no backend, all data in localStorage)
   ------------------------------------------------------------
   FLOW
   1. Sign Up  : First Name + Last Name + Access Code (10thmarathifree1)
                -> profile saved, session opened, redirect to home.
   2. Log In   : Name + Access Code -> matched against saved profile,
                session opened, redirect to home.
   3. Log Out  : (handled on the home page later) clears the session
                and bounces back here to the Log In tab.

   STORAGE KEYS (read these from the home page when you connect it)
     marathi10_users    -> { "firstname lastname": { firstName, lastName,
                                                        accessCode, createdAt }, ... }
     marathi10_session  -> { name: "firstname lastname", firstName, lastName }

   HOME PAGE INTEGRATION (to do later)
     - On load: if !localStorage.getItem("marathi10_session") -> redirect to
       "authmarathi/auth.html".
     - Show profile from marathi10_users[session.name].
     - Log Out button: localStorage.removeItem("marathi10_session");
       window.location.replace("authmarathi/auth.html").
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 1. HARDCODED ACCESS CODE ----------
     Registration / login is blocked unless this exact code is supplied. */
  const MASTER_ACCESS_CODE = "rsdeshmukh";

  /* ---------- 2. STORAGE KEY CONVENTIONS ---------- */
  const USERS_KEY = "marathi10_users";     // map of name -> profile
  const SESSION_KEY = "marathi10_session"; // { name, firstName, lastName }

  /* Where to send the user after a successful auth.
     The home page will be connected later. */
  const HOME_PAGE = "../homepagemarathi/marathihome.html";

  /* ---------- 3. ROUTE GUARD ----------
     If a session already exists, skip auth and go straight home. */
  if (localStorage.getItem(SESSION_KEY)) {
    console.log("[Auth] Active session found, redirecting to home.");
    window.location.replace(HOME_PAGE);
    return;
  }

  /* ---------- 4. DOM REFERENCES ---------- */
  const tabSignup = document.getElementById("tabSignup");
  const tabLogin = document.getElementById("tabLogin");
  const tabSlider = document.getElementById("tabSlider");
  const signupPanel = document.getElementById("signupPanel");
  const loginPanel = document.getElementById("loginPanel");
  const suMsg = document.getElementById("su_msg");
  const liMsg = document.getElementById("li_msg");

  /* ---------- 5. TAB SWITCHING (animated slider) ---------- */
  function showPanel(target) {
    const isSignup = target === "signupPanel";
    signupPanel.classList.toggle("is-hidden", !isSignup);
    loginPanel.classList.toggle("is-hidden", isSignup);
    tabSignup.classList.toggle("is-active", isSignup);
    tabLogin.classList.toggle("is-active", !isSignup);
    tabSignup.setAttribute("aria-selected", String(isSignup));
    tabLogin.setAttribute("aria-selected", String(!isSignup));
    tabSlider.classList.toggle("is-right", !isSignup);
    clearMessages();
  }
  tabSignup.addEventListener("click", () => showPanel("signupPanel"));
  tabLogin.addEventListener("click", () => showPanel("loginPanel"));

  function setMessage(el, text, type) {
    el.textContent = text;
    el.classList.remove("is-error", "is-success");
    if (type) el.classList.add(type === "error" ? "is-error" : "is-success");
  }
  function clearMessages() {
    setMessage(suMsg, "");
    setMessage(liMsg, "");
  }

  /* ---------- 6. STORAGE HELPERS ---------- */
  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      console.log("[Auth] loadUsers: raw data =", raw ? raw.substring(0, 80) + "…" : "null");
      return JSON.parse(raw) || {};
    } catch (e) {
      console.error("[Auth] loadUsers: JSON parse error —", e.message);
      return {};
    }
  }
  function saveUsers(users) {
    const json = JSON.stringify(users);
    localStorage.setItem(USERS_KEY, json);
    console.log("[Auth] saveUsers: saved", Object.keys(users).length, "user(s)");
  }
  // Build the stable lookup key from a first + last name.
  function userKey(firstName, lastName) {
    return `${firstName.trim().toLowerCase()} ${lastName.trim().toLowerCase()}`.trim();
  }
  // Open a session and route to the home page.
  function openSessionAndGoHome(firstName, lastName) {
    const key = userKey(firstName, lastName);
    const sessionData = JSON.stringify({ name: key, firstName: firstName.trim(), lastName: lastName.trim() });
    localStorage.setItem(SESSION_KEY, sessionData);
    console.log("[Auth] Session created for:", key);
    window.location.replace(HOME_PAGE);
  }

  /* ---------- 7. SIGN UP FLOW ---------- */
  signupPanel.addEventListener("submit", (e) => {
    e.preventDefault();
    clearMessages();

    const firstName = document.getElementById("su_firstName").value.trim();
    const lastName = document.getElementById("su_lastName").value.trim();
    const accessCode = document.getElementById("su_accessCode").value;

    // Basic validation
    if (!firstName || !lastName) {
      setMessage(suMsg, "कृपया पहिले व आडनाव भरा.", "error");
      return;
    }

    // Access code gatekeeping
    if (accessCode !== MASTER_ACCESS_CODE) {
      setMessage(suMsg, "चुकीचा प्रवेश कोड. नोंदणी नाकारली.", "error");
      return;
    }

    const users = loadUsers();
    const key = userKey(firstName, lastName);

    // Prevent duplicate (same first + last name) accounts
    if (users[key]) {
      console.log("[Auth] Duplicate signup attempt for:", key);
      setMessage(suMsg, "हे खाते आधीच अस्तित्वात आहे. कृपया लॉगिन करा.", "error");
      return;
    }

    // Build offline profile object and persist it
    users[key] = {
      firstName,
      lastName,
      accessCode, // stored so the home page / future checks can read it
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
    console.log("[Auth] New user created:", key);

    // Open session and route home instantly
    setMessage(suMsg, "खाते तयार झाले! पुढे जात आहोत…", "success");
    setTimeout(() => openSessionAndGoHome(firstName, lastName), 350);
  });

  /* ---------- 8. LOGIN FLOW ---------- */
  loginPanel.addEventListener("submit", (e) => {
    e.preventDefault();
    clearMessages();

    const name = document.getElementById("li_name").value.trim();
    const accessCode = document.getElementById("li_accessCode").value;

    if (!name || !accessCode) {
      setMessage(liMsg, "कृपया नाव व प्रवेश कोड भरा.", "error");
      return;
    }

    // Access code gatekeeping
    if (accessCode !== MASTER_ACCESS_CODE) {
      setMessage(liMsg, "चुकीचा प्रवेश कोड.", "error");
      return;
    }

    const users = loadUsers();
    const search = name.toLowerCase().replace(/\s+/g, " ").trim();

    console.log("[Auth] Login attempt — name:", JSON.stringify(name), "| search key:", JSON.stringify(search));
    console.log("[Auth] Stored user keys:", Object.keys(users));

    // Match the entered name against a stored profile.
    // Accepts: "FirstName", "FirstName LastName", or "LastName"
    const matchedKey = Object.keys(users).find((k) => {
      const parts = k.split(" ");
      const first = parts[0];
      const last = parts.length > 1 ? parts[parts.length - 1] : "";
      return (
        k === search ||
        first === search ||
        (last && last === search) ||
        (search.includes(" ") && k.startsWith(search.split(" ")[0]))
      );
    });

    if (!matchedKey) {
      console.warn("[Auth] No matching user found for:", search);
      setMessage(liMsg, "कोणतेही खाते सापडले नाही. प्रथम नवीन खाते तयार करा.", "error");
      return;
    }

    console.log("[Auth] Matched user key:", matchedKey);
    const profile = users[matchedKey];

    // Valid -> open session and route home
    setMessage(liMsg, "स्वागत आहे! पुढे जात आहोत…", "success");
    setTimeout(() => openSessionAndGoHome(profile.firstName, profile.lastName), 350);
  });
})();
