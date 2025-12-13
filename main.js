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
