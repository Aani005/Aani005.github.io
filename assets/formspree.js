/* ============================================================
   ShipSpree — Formspree submission handler (Framer static export)
   Framer's runtime intercepts clicks and tries to submit to Framer's
   backend, which doesn't exist on GitHub Pages — so nothing happens.
   This script binds on CLICK at the capture phase (before Framer's
   own handler), takes over, and POSTs to Formspree via AJAX.
   ============================================================ */
(function () {
  "use strict";

  var ENDPOINT = "https://formspree.io/f/xeaovkew";

  var FORMS = [
    { formClass: "framer-l680r9", type: "Quote request",
      subject: "New quote request — ShipSpree",
      success: "Thanks — we'll send your transparent quote within one business day." },
    { formClass: "framer-ftisgs", type: "Carrier sign-up",
      subject: "New carrier sign-up — ShipSpree",
      success: "Thanks — we'll be in touch about getting you set up to haul." }
  ];

  // Capture-phase CLICK listener on the whole document.
  // This runs BEFORE Framer's own click handlers, so we win.
  document.addEventListener("click", function (e) {
    // Find the nearest submit-ish control the user clicked.
    var target = e.target.closest(
      'button[type="submit"], input[type="submit"], [data-framer-name*="Ballpark"], [data-framer-name*="Submit"], [name="Get Ballpark Pricing"]'
    );
    if (!target) return;

    // Which form is it inside?
    var form = target.closest("form");
    if (!form) return;

    var cfg = FORMS.filter(function (f) { return form.classList.contains(f.formClass); })[0];
    if (!cfg) return; // not one of our forms — leave it alone

    // Take over completely, before Framer can act.
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    submit(form, target, cfg);
  }, true); // <-- true = capture phase

  function submit(form, btn, cfg) {
    // Basic required-field check (don't send half-empty forms).
    var missing = [];
    form.querySelectorAll("[required]").forEach(function (el) {
      if (!el.value || (el.type === "checkbox" && !el.checked)) {
        var nm = el.getAttribute("name") || el.getAttribute("placeholder") || "a required field";
        missing.push(nm);
      }
    });
    // Also check email format if an email field is present & filled.
    var emailEl = form.querySelector('input[type="email"], input[name*="Email" i]');
    if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      missing.push("a valid email");
    }
    if (missing.length) {
      show(form, "Please fill in: " + missing.slice(0, 4).join(", ") +
        (missing.length > 4 ? "…" : "") + ".", true);
      return;
    }

    var data = new FormData(form);
    data.set("form_type", cfg.type);
    data.set("_subject", cfg.subject);

    busy(btn, true);
    show(form, "Sending…", false, true);

    fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (res) {
        busy(btn, false);
        if (res.ok) { form.reset(); show(form, cfg.success, false); }
        else {
          res.json().then(function (j) {
            var m = (j && j.errors && j.errors.length)
              ? j.errors.map(function (x) { return x.message; }).join(", ")
              : "Something went wrong.";
            show(form, m + " You can also email hello@shipspree.com.", true);
          }).catch(function () { show(form, "Something went wrong. Email hello@shipspree.com.", true); });
        }
      })
      .catch(function () {
        busy(btn, false);
        show(form, "Network error — please try again, or email hello@shipspree.com.", true);
      });
  }

  function busy(btn, on) {
    if (!btn) return;
    btn.style.opacity = on ? "0.6" : "";
    btn.style.pointerEvents = on ? "none" : "";
    btn.setAttribute("aria-busy", on ? "true" : "false");
  }

  function show(form, message, isError, isPending) {
    var status = form.__fsStatus;
    if (!status) {
      status = document.createElement("p");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.style.cssText =
        "margin-top:16px;font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.45;" +
        "padding:12px 16px;border-radius:8px;text-align:center;";
      form.parentNode.insertBefore(status, form.nextSibling);
      form.__fsStatus = status;
    }
    status.textContent = message;
    if (isPending) { status.style.background = "#EEF2F7"; status.style.color = "#0E1116"; }
    else if (isError) { status.style.background = "#FDECEC"; status.style.color = "#8A1C1C"; }
    else { status.style.background = "#EAF6EF"; status.style.color = "#0B6B3A"; }
  }
})();
