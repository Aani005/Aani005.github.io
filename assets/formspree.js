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

  // Framer builds the submit control as an <a>/<button> with data-reset="button",
  // NOT always a type=submit. So: catch any click, see if it's inside one of our
  // forms, and if the clicked thing is the form's main action control, take over.
  // We ignore clicks on the dropdown toggles (aria-haspopup) and on inputs.
  document.addEventListener("click", function (e) {
    // Is the click inside one of our forms?
    var form = e.target.closest("form");
    if (!form) return;
    var cfg = FORMS.filter(function (f) { return form.classList.contains(f.formClass); })[0];
    if (!cfg) return; // not one of our forms — leave it alone

    // The clicked control (link or button).
    var ctrl = e.target.closest('a, button, [data-reset="button"], [role="button"]');
    if (!ctrl) return;

    // Ignore the select/dropdown toggles inside the form — they open menus, not submit.
    if (ctrl.getAttribute("aria-haspopup") === "listbox" || ctrl.closest('[aria-haspopup="listbox"]')) return;

    // Ignore clicks on the actual input fields.
    if (e.target.closest("input, textarea, select")) return;

    // This is the form's action control (Get Ballpark Pricing / Join the Carrier Network).
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    submit(form, ctrl, cfg);
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
