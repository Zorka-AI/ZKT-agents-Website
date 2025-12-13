(function () {
  "use strict";

  // ✅ Banner standardmäßig deaktiviert, weil unklar ist, ob (optionale) Cookies/Tracking genutzt werden.
  // Wenn du später Analytics/Marketing/Third-Party-Cookies einbaust: auf true setzen und Text in index.html anpassen.
  const ENABLE_COOKIE_BANNER = false;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  // ---------- Theme (LIGHT default, optional DARK) ----------
  const THEME_KEY = "zkt_theme_v1";
  const THEMES = { LIGHT: "light", DARK: "dark" };

  const themeBtn = $("#theme-toggle");

  const readTheme = () => {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  };
  const writeTheme = (t) => {
    try { localStorage.setItem(THEME_KEY, t); } catch {}
  };

  const setTheme = (t) => {
    const theme = t === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
    document.documentElement.dataset.theme = theme;

    // Button UI aktualisieren
    if (themeBtn) {
      const iconEl = themeBtn.querySelector("iconify-icon");
      const isDark = theme === THEMES.DARK;

      themeBtn.setAttribute("aria-label", isDark ? "Light Mode aktivieren" : "Dark Mode aktivieren");
      themeBtn.title = isDark ? "Light Mode" : "Dark Mode";

      if (iconEl) {
        iconEl.setAttribute(
          "icon",
          isDark ? "material-symbols:light-mode-rounded" : "material-symbols:dark-mode-rounded"
        );
      }
    }
  };

  let currentTheme = readTheme() || THEMES.LIGHT; // ✅ Standard: Light
  setTheme(currentTheme);

  if (themeBtn) {
    const toggle = (e) => {
      // wichtig: Button sitzt in <a>… -> Navigation verhindern
      if (e) { e.preventDefault(); e.stopPropagation(); }

      currentTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      setTheme(currentTheme);
      writeTheme(currentTheme);
    };

    themeBtn.addEventListener("click", toggle);
    themeBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") toggle(e);
    });
  }

  // ---------- Global Search / Filter (Homepage) ----------
  const searchInput = $("#site-search");
  const clearBtn = $(".search-clear");
  const chips = $$(".chip");

  const searchableEls = $$("[data-searchable]");
  const buildIndex = (el) => {
    const title = el.getAttribute("data-title") || el.querySelector("h3")?.textContent || "";
    const tags = el.getAttribute("data-tags") || "";
    const text = el.textContent || "";
    el.__searchIndex = norm(`${title} ${tags} ${text}`);
  };
  searchableEls.forEach(buildIndex);

  const applyFilter = (q) => {
    const query = norm(q);
    if (!query) {
      searchableEls.forEach((el) => (el.hidden = false));
      return;
    }
    searchableEls.forEach((el) => {
      const hit = el.__searchIndex.includes(query);
      el.hidden = !hit;
    });
  };

  if (searchInput) {
    searchInput.addEventListener("input", () => applyFilter(searchInput.value));

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchInput.focus();
        applyFilter("");
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const value = chip.getAttribute("data-chip") || chip.textContent || "";
        searchInput.value = value;
        applyFilter(value);
        searchInput.focus();
      });
    });
  }

  // ---------- Cookie Banner (optional) ----------
  const banner = $("#cookie-banner");
  const accept = $("#cookie-accept");
  const KEY = "zkt_cookie_ok_v1";

  if (ENABLE_COOKIE_BANNER && banner) {
    const showBanner = () => { banner.hidden = false; };
    const hideBanner = () => { banner.hidden = true; };

    try {
      const ok = localStorage.getItem(KEY);
      if (!ok) showBanner();
    } catch {
      showBanner();
    }

    if (accept) {
      accept.addEventListener("click", () => {
        try { localStorage.setItem(KEY, "1"); } catch {}
        hideBanner();
      });
    }
  } else if (banner) {
    // sicherheitshalber verstecken
    banner.hidden = true;
  }

  // ---------- Smooth anchor scroll ----------
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });
})();
