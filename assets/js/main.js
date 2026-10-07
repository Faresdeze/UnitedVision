/* ==========================================================================
   United Vision – site behaviour
   - Settings: theme (light / dark / auto) and language (en / nl)
   - Mobile navigation
   - Quote form (sent by email via FormSubmit, mailto fallback)
   ========================================================================== */

(function () {
  "use strict";

  var CONFIG = {
    email: "waddah@unitedvision.be",
    formEndpoint: "https://formsubmit.co/ajax/waddah@unitedvision.be",
    shopHost: "https://unitedvision.b2b.gift/",
    languages: ["en", "nl"],
    htmlLang: { en: "en", nl: "nl-BE" },
    storageKeys: { theme: "uv-theme", lang: "uv-lang" }
  };

  var I18N = window.UV_I18N || {};
  var root = document.documentElement;
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var currentLang = "en";

  /* Storage (may be unavailable in private mode) ------------------------- */

  function load(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function save(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* ignore */
    }
  }

  function t(key) {
    var dict = I18N[currentLang] || I18N.en || {};
    return dict[key] != null ? dict[key] : (I18N.en && I18N.en[key]) || "";
  }

  /* Theme ------------------------------------------------------------------ */

  function resolveTheme(pref) {
    if (pref === "light" || pref === "dark") return pref;
    return darkQuery.matches ? "dark" : "light";
  }

  function applyTheme(pref) {
    var theme = resolveTheme(pref);
    root.setAttribute("data-theme", theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0e1516" : "#ffffff");

    checkRadio("theme", pref);
  }

  function getThemePref() {
    var pref = load(CONFIG.storageKeys.theme);
    return pref === "light" || pref === "dark" ? pref : "system";
  }

  darkQuery.addEventListener("change", function () {
    if (getThemePref() === "system") applyTheme("system");
  });

  /* Language --------------------------------------------------------------- */

  function detectLang() {
    var fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (CONFIG.languages.indexOf(fromUrl) !== -1) return fromUrl;

    var stored = load(CONFIG.storageKeys.lang);
    if (CONFIG.languages.indexOf(stored) !== -1) return stored;

    var browser = (navigator.language || "en").toLowerCase();
    return browser.indexOf("nl") === 0 ? "nl" : "en";
  }

  function applyLang(lang) {
    currentLang = I18N[lang] ? lang : "en";
    root.setAttribute("lang", CONFIG.htmlLang[currentLang]);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = t(el.getAttribute("data-i18n"));
      if (value) el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        if (parts.length !== 2) return;
        var value = t(parts[1].trim());
        if (value) el.setAttribute(parts[0].trim(), value);
      });
    });

    var titleKey = document.body.getAttribute("data-title-key") || "meta.title";
    document.title = t(titleKey);
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("meta.description"));

    // Point shop links at the same language on unitedvision.b2b.gift
    document.querySelectorAll('a[href^="' + CONFIG.shopHost + '"]').forEach(function (a) {
      a.href = a.href.replace(/(b2b\.gift\/)(en|nl)\//, "$1" + currentLang + "/");
    });

    checkRadio("lang", currentLang);
  }

  function checkRadio(name, value) {
    var input = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
  }

  /* Popovers: settings panel and mobile menu ------------------------------- */

  function setupToggle(button, panel, opts) {
    if (!button || !panel) return null;

    function setOpen(open) {
      button.setAttribute("aria-expanded", String(open));
      if (opts.useHidden) panel.hidden = !open;
      else panel.classList.toggle("is-open", open);
    }

    function isOpen() {
      return button.getAttribute("aria-expanded") === "true";
    }

    button.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    document.addEventListener("click", function (event) {
      if (isOpen() && !panel.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        button.focus();
      }
    });

    return setOpen;
  }

  function setupNavigation() {
    var nav = document.getElementById("site-nav");
    var closeMenu = setupToggle(document.querySelector(".menu-toggle"), nav, { useHidden: false });
    if (!nav || !closeMenu) return;

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu(false);
      });
    });

    // Leaving the mobile layout closes the menu
    window.matchMedia("(min-width: 900px)").addEventListener("change", function () {
      closeMenu(false);
    });
  }

  function setupSettings() {
    setupToggle(
      document.querySelector(".settings__toggle"),
      document.getElementById("settings-panel"),
      { useHidden: true }
    );

    document.querySelectorAll('input[name="theme"]').forEach(function (input) {
      input.addEventListener("change", function () {
        save(CONFIG.storageKeys.theme, input.value);
        applyTheme(input.value);
      });
    });

    document.querySelectorAll('input[name="lang"]').forEach(function (input) {
      input.addEventListener("change", function () {
        save(CONFIG.storageKeys.lang, input.value);
        applyLang(input.value);
      });
    });
  }

  /* Quote form ------------------------------------------------------------- */

  function setupQuoteForm() {
    var form = document.getElementById("quote-form");
    if (!form) return;

    var status = form.querySelector(".form__status");
    var submit = form.querySelector('button[type="submit"]');
    var fields = form.querySelectorAll("input[required], textarea[required], input[type='email']");

    form.setAttribute("novalidate", "");

    function fieldError(input) {
      if (input.validity.valueMissing) return t("quote.err.required");
      if (input.validity.typeMismatch) return t("quote.err.email");
      return "";
    }

    function showFieldError(input) {
      var message = fieldError(input);
      var wrapper = input.closest(".field");
      var slot = wrapper && wrapper.querySelector(".field__error");
      if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));
      if (slot) slot.textContent = message;
      input.setAttribute("aria-invalid", String(Boolean(message)));
      return !message;
    }

    fields.forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value) showFieldError(input);
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") showFieldError(input);
      });
    });

    function setStatus(type, message, withMailto) {
      status.className = "form__status" + (type ? " is-" + type : "");
      status.textContent = message;
      if (withMailto) {
        var link = document.createElement("a");
        link.href = mailtoHref();
        link.textContent = CONFIG.email;
        status.append(" ", link, ".");
      }
    }

    function value(name) {
      var el = form.elements[name];
      return el ? el.value.trim() : "";
    }

    function mailtoHref() {
      var body = [
        t("quote.name") + ": " + value("name"),
        t("quote.company") + ": " + value("company"),
        t("quote.email") + ": " + value("email"),
        "",
        value("message")
      ].join("\n");
      return "mailto:" + CONFIG.email +
        "?subject=" + encodeURIComponent(t("quote.subject")) +
        "&body=" + encodeURIComponent(body);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      fields.forEach(function (input) {
        if (!showFieldError(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Bots fill the hidden field; pretend success and drop it.
      if (value("_honey")) {
        setStatus("success", t("quote.success"));
        form.reset();
        return;
      }

      submit.disabled = true;
      submit.textContent = t("quote.sending");
      setStatus("", "");

      fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: value("name"),
          company: value("company") || "-",
          email: value("email"),
          message: value("message"),
          language: currentLang.toUpperCase(),
          _subject: t("quote.subject"),
          _replyto: value("email"),
          _template: "table",
          _captcha: "false"
        })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            if (!response.ok || String(data.success) !== "true") throw new Error(data.message || "Send failed");
          });
        })
        .then(function () {
          form.reset();
          setStatus("success", t("quote.success"));
        })
        .catch(function () {
          setStatus("error", t("quote.failure"), true);
        })
        .finally(function () {
          submit.disabled = false;
          submit.textContent = t("quote.submit");
          status.focus();
        });
    });

    // Returning from the no-JavaScript form post (see _next in index.html)
    if (new URLSearchParams(window.location.search).get("sent") === "1") {
      setStatus("success", t("quote.success"));
    }
  }

  /* Init ------------------------------------------------------------------- */

  applyTheme(getThemePref());
  applyLang(detectLang());
  setupNavigation();
  setupSettings();
  setupQuoteForm();

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
