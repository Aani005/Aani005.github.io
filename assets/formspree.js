/* ============================================================
   ShipSpree — Formspree submission handler (Framer static export)

   Framer's runtime attaches its own click/submit handlers that try to
   reach Framer's backend (gone on GitHub Pages), so the buttons do
   nothing. Racing it with a capture listener is unreliable. Instead we
   CLONE each submit control — cloning drops all attached event
   listeners, removing Framer's dead handler — then bind our own click
   handler to the clone. Deterministic, no race.
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

  function wire() {
    FORMS.forEach(function (cfg) {
      document.querySelectorAll("form." + cfg.formClass).forEach(function (form) {
        // Backstop: intercept the form's own submit event once per form.
        if (!form.__fsSubmitBound) {
          form.addEventListener("submit", function (e) {
            e.preventDefault(); e.stopPropagation();
            submit(form, null, cfg);
          }, true);
          form.__fsSubmitBound = true;
        }

        // Find the submit control (NOT a dropdown toggle, NOT a field).
        var candidates = Array.prototype.slice.call(
          form.querySelectorAll('button[type="submit"], input[type="submit"], a[data-reset="button"], button[data-reset="button"]')
        ).filter(function (el) {
          return el.getAttribute("aria-haspopup") !== "listbox" && !el.closest('[aria-haspopup="listbox"]');
        });
        var ctrl = candidates[candidates.length - 1];
        if (!ctrl || ctrl.__fsClone) return; // already our clean clone

        // Clone strips Framer's attached listeners; replace the original.
        var clean = ctrl.cloneNode(true);
        clean.__fsClone = true;
        if (clean.tagName === "A") { clean.removeAttribute("href"); clean.style.cursor = "pointer"; }
        ctrl.parentNode.replaceChild(clean, ctrl);

        clean.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          submit(form, clean, cfg);
        });
      });
    });
  }

  function submit(form, btn, cfg) {
    if (form.__fsSending) return;

    var missing = [];
    form.querySelectorAll("[required]").forEach(function (el) {
      if (!el.value || (el.type === "checkbox" && !el.checked)) {
        missing.push(el.getAttribute("name") || el.getAttribute("placeholder") || "a required field");
      }
    });
    var emailEl = form.querySelector('input[type="email"], input[name*="Email" i]');
    if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      missing.push("a valid email");
    }
    if (missing.length) {
      show(form, "Please fill in: " + missing.slice(0, 4).join(", ") + (missing.length > 4 ? "…" : "") + ".", true);
      return;
    }

    var data = new FormData(form);
    data.set("form_type", cfg.type);
    data.set("_subject", cfg.subject);

    form.__fsSending = true;
    busy(btn, true);
    show(form, "Sending…", false, true);

    fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (res) {
        form.__fsSending = false;
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
        form.__fsSending = false;
        busy(btn, false);
        show(form, "Network error — please try again, or email hello@shipspree.com.", true);
      });
  }

  function busy(btn, on) {
    if (!btn) return;
    btn.style.opacity = on ? "0.6" : "";
    btn.style.pointerEvents = on ? "none" : "";
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

  // Framer hydrates late, and may re-render buttons — wire repeatedly for a while.
  function boot() {
    wire();
    var tries = 0;
    var iv = setInterval(function () { wire(); if (++tries > 20) clearInterval(iv); }, 500);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
  window.addEventListener("load", boot);
})();
