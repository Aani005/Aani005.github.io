/* ============================================================
   ShipSpree — Formspree submission handler (for Framer export)
   The Framer static export ships two forms with NO submit endpoint,
   so on GitHub Pages they go nowhere. This script intercepts both
   and POSTs to Formspree via AJAX, then shows an inline message.

   Forms are matched by Framer's generated class names:
     .framer-l680r9  → Quote request form
     .framer-ftisgs  → Carrier sign-up form
   If you re-export from Framer and these class names change, update
   the SELECTORS below (grep the new index.html for data-framer-name).
   ============================================================ */
(function () {
  "use strict";

  var ENDPOINT = "https://formspree.io/f/xeaovkew";

  var FORMS = [
    { selector: "form.framer-l680r9", type: "Quote request",
      subject: "New quote request — ShipSpree",
      success: "Thanks — we'll send your transparent quote within one business day." },
    { selector: "form.framer-ftisgs", type: "Carrier sign-up",
      subject: "New carrier sign-up — ShipSpree",
      success: "Thanks — we'll be in touch about getting you set up to haul." }
  ];

  function init() {
    FORMS.forEach(function (cfg) {
      document.querySelectorAll(cfg.selector).forEach(function (form) {
        // Guard against double-binding if the script runs twice.
        if (form.__fsBound) return;
        form.__fsBound = true;
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          e.stopPropagation();
          submit(form, cfg);
        }, true);
      });
    });
  }

  function submit(form, cfg) {
    // Honour native validation (required fields, email format).
    if (typeof form.checkValidity === "function" && !form.checkValidity()) {
      if (typeof form.reportValidity === "function") form.reportValidity();
      return;
    }

    var data = new FormData(form);
    // Label which form this is, and set the email subject line.
    data.set("form_type", cfg.type);
    data.set("_subject", cfg.subject);

    var btn = form.querySelector('button[type="submit"], input[type="submit"], [role="button"]');
    if (btn) { btn.setAttribute("aria-busy", "true"); btn.style.pointerEvents = "none"; btn.style.opacity = "0.6"; }

    fetch(ENDPOINT, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    })
      .then(function (res) {
        if (res.ok) { done(form, btn, cfg.success, false); }
        else {
          res.json().then(function (j) {
            var m = (j && j.errors && j.errors.length)
              ? j.errors.map(function (x) { return x.message; }).join(", ")
              : "Something went wrong.";
            done(form, btn, m + " You can also email hello@shipspree.com.", true);
          }).catch(function () { done(form, btn, "Something went wrong. Email hello@shipspree.com.", true); });
        }
      })
      .catch(function () {
        done(form, btn, "Network error — please try again, or email hello@shipspree.com.", true);
      });
  }

  function done(form, btn, message, isError) {
    if (btn) { btn.removeAttribute("aria-busy"); btn.style.pointerEvents = ""; btn.style.opacity = ""; }
    if (!isError) form.reset();

    // Insert / update an inline status line right after the form.
    var status = form.__fsStatus;
    if (!status) {
      status = document.createElement("p");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.style.cssText =
        "margin-top:14px;font-family:inherit;font-size:15px;line-height:1.4;" +
        "padding:12px 14px;border-radius:8px;";
      form.parentNode.insertBefore(status, form.nextSibling);
      form.__fsStatus = status;
    }
    status.textContent = message;
    status.style.background = isError ? "#FDECEC" : "#EAF6EF";
    status.style.color = isError ? "#8A1C1C" : "#0B6B3A";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  // Framer hydrates late; re-bind shortly after load in case forms mount after DOMContentLoaded.
  window.addEventListener("load", function () { setTimeout(init, 400); });
})();
