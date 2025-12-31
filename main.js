(function () {
  "use strict";

  const ENABLE_COOKIE_BANNER = false;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // --- robustes Normalisieren für Tag-Suche (Umlaute/ß/Bindestriche) ---
  const norm = (s) => {
    let out = String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // diacritics weg
      .replace(/ß/g, "ss");

    // alles Nicht-Alphanumerische -> Space (macht aus "e-mails" => "e mails")
    out = out.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

    // häufige Schreibweisen zusammenziehen
    out = out.replace(/\be mails?\b/g, "email");
    out = out.replace(/\be mail\b/g, "email");

    return out;
  };

  const canonical = (t) => {
    if (!t) return "";
    // DE/EN Varianten
    if (t === "automationen" || t === "automations") return "automation";
    if (t === "emails" || t === "email" || t === "mail" || t === "mails") return "email";
    if (t === "integrationen" || t === "integrations") return "integration";
    if (t === "prozesse" || t === "prozessen") return "prozess";
    if (t === "tickets") return "ticket";
    if (t === "leads") return "lead";
    if (t === "kundenservice" || t === "service" || t === "hilfe") return "support";
    if (t === "vertrieb") return "sales";
    return t;
  };

  const tokenize = (s) => {
    const base = norm(s);
    if (!base) return [];
    const parts = base.split(" ");
    const out = [];
    for (const p of parts) {
      if (!p || p.length < 2) continue;
      out.push(p);
      const c = canonical(p);
      if (c && c !== p) out.push(c);
    }
    return out;
  };

  // ---------- Theme ----------
  const THEME_KEY = "zkt_theme_v1";
  const THEMES = { LIGHT: "light", DARK: "dark" };
  const themeBtn = $("#theme-toggle");

  const readTheme = () => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } };
  const writeTheme = (t) => { try { localStorage.setItem(THEME_KEY, t); } catch {} };

  const setTheme = (t) => {
    const theme = t === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
    document.documentElement.dataset.theme = theme;

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

  let currentTheme = readTheme() || THEMES.LIGHT;
  setTheme(currentTheme);

  if (themeBtn) {
    const toggle = (e) => {
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

  // ---------- Tag-only Search / Filter ----------
  const searchInput = $("#site-search");
  const clearBtn = $(".search-clear");
  const chips = $$(".chip");

  const searchableEls = $$("[data-searchable]");

  // Index: NUR data-tags (optional: zusätzlich .tag Texte, falls du sie weiterhin im HTML pflegst)
  const buildTagIndex = (el) => {
    const tagsAttr = el.getAttribute("data-tags") || "";
    const badgeTags = $$(".tag", el).map((t) => t.textContent || "").join(" "); // egal ob sichtbar
    const allTags = `${tagsAttr} ${badgeTags}`;

    const tokenSet = new Set(tokenize(allTags));
    el.__tagTokens = tokenSet;
    el.__tagList = Array.from(tokenSet);
  };
  searchableEls.forEach(buildTagIndex);

  const tagHit = (el, qTok) => {
    const tok = canonical(qTok);
    if (el.__tagTokens?.has(tok)) return true;

    // prefix match: "sup" -> "support"
    const list = el.__tagList || [];
    for (const t of list) {
      if (t.startsWith(tok)) return true;
    }
    return false;
  };

  const applyFilter = (q) => {
    const qTokens = tokenize(q);

    if (!qTokens.length) {
      searchableEls.forEach((el) => (el.hidden = false));
      return;
    }

    searchableEls.forEach((el) => {
      // ✅ AND-Logik: alle Suchwörter müssen als Tag vorkommen
      const hit = qTokens.every((t) => tagHit(el, t));
    el.toggleAttribute("hidden", !hit);
    });
  };

  const setQuickFilter = (value) => {
    if (!searchInput) return;
    searchInput.value = value;
    applyFilter(value);
    searchInput.focus();
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

    // Chips oben: setzen Query -> filtert über data-tags
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const value = chip.getAttribute("data-chip") || chip.textContent || "";
        setQuickFilter(value);
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

  // ---------- Price placeholders + click -> Contact page ----------
  const PRICE_TARGET = "contact-us.html";
  const PRICE_PLACEHOLDER = "Preis auf Anfrage";

  $$(".card-meta").forEach((meta) => {
    let price = meta.querySelector(".price");
    if (!price) {
      price = document.createElement("span");
      price.className = "price";
      meta.appendChild(price);
    }
    if (!norm(price.textContent)) {
      price.textContent = PRICE_PLACEHOLDER;
      price.dataset.placeholder = "true";
    }
  });

  $$(".price").forEach((el) => {
    if (el.tagName === "A") return;

    el.dataset.clickable = "true";
    el.setAttribute("role", "link");
    el.tabIndex = 0;

    const go = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      window.location.href = PRICE_TARGET;
    };

    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") go(e);
    });
  });
    // ---------- Website Input: erlaubt "google.com" ohne https:// ----------
  const websiteInput = $("#website-input");
  if (websiteInput) {
    const form = websiteInput.closest("form");

    const isIPv4 = (host) => {
      const m = host.match(/^(\d{1,3})(\.\d{1,3}){3}$/);
      if (!m) return false;
      return host.split(".").every((n) => {
        const x = Number(n);
        return Number.isInteger(x) && x >= 0 && x <= 255;
      });
    };

    const validateWebsite = (raw) => {
      const v = String(raw || "").trim();
      if (!v) return { ok: false, msg: "Bitte eine Website angeben." };

      // Wenn Nutzer schon http(s) schreibt -> lassen, sonst https:// davor
      const withScheme =
        /^https?:\/\//i.test(v) ? v :
        v.startsWith("//") ? `https:${v}` :
        `https://${v}`;

      let url;
      try {
        url = new URL(withScheme);
      } catch {
        return { ok: false, msg: "Bitte eine gültige Website eingeben (z.B. example.com)." };
      }

      const host = (url.hostname || "").toLowerCase();

      // einfache Plausibilitätsprüfung
      const okHost =
        host === "localhost" ||
        isIPv4(host) ||
        host.includes(".");

      if (!okHost) {
        return { ok: false, msg: "Bitte eine gültige Domain eingeben (z.B. example.com)." };
      }

      // Normalisierte URL fürs Absenden
      return { ok: true, normalized: url.toString() };
    };

    // Beim Tippen: Fehlermeldung zurücksetzen
    websiteInput.addEventListener("input", () => {
      websiteInput.setCustomValidity("");
    });

    // Beim Verlassen: validieren (ohne https:// sichtbar einzufügen)
    websiteInput.addEventListener("blur", () => {
      const r = validateWebsite(websiteInput.value);
      websiteInput.setCustomValidity(r.ok ? "" : r.msg);
    });

    // Beim Absenden: normalisieren (hier darf intern https:// gesetzt werden)
    if (form) {
      form.addEventListener("submit", (e) => {
        const r = validateWebsite(websiteInput.value);
        if (!r.ok) {
          websiteInput.setCustomValidity(r.msg);
          websiteInput.reportValidity();
          e.preventDefault();
          return;
        }
        websiteInput.setCustomValidity("");
        websiteInput.value = r.normalized; // -> wird sauber als URL verschickt
      });
    }
  }
})();
