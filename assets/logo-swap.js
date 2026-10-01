/* ============================================================
   ShipSpree — Framer DOM fixups (logo swap + hide confirmation)
   Framer's React runtime re-renders the nav/footer wordmark and the
   quote "Confirmation message" on load and on interaction, undoing any
   static edit. A 250ms poll wasn't reliable. This uses a MutationObserver
   so we re-apply the INSTANT Framer touches the DOM, plus rAF passes for
   the first seconds after load.
   ============================================================ */
(function () {
  "use strict";

  var LOGO = "/assets/brand/shipspree-logo-horizontal-white.svg?v=6";

  // Wordmark containers (nav + footer) → swap text for logo image.
  var WORDMARKS = [
    { cls: "framer-1c3wd02", h: 22 },  // nav
    { cls: "framer-11jj3ko", h: 28 }   // footer
  ];

  // Framer confirmation elements to keep hidden until a real submit.
  var CONFIRM_IDS = ["fs-quote-confirmation"];

  function swapLogos() {
    WORDMARKS.forEach(function (s) {
      var boxes = document.querySelectorAll("." + s.cls);
      for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        if (box.querySelector("img[data-ss-logo]")) continue; // done
        var p = box.querySelector("p");
        if (!p || !/ShipSpree/i.test(p.textContent)) continue;
        var img = document.createElement("img");
        img.src = LOGO;
        img.alt = "ShipSpree";
        img.setAttribute("data-ss-logo", "1");
        img.style.height = s.h + "px";
        img.style.width = "auto";
        img.style.display = "block";
        img.style.objectFit = "contain";
        img.style.margin = "0";
        p.replaceWith(img);
      }
    });
  }

  function hideConfirmations() {
    CONFIRM_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.__fsRevealed) el.style.setProperty("display", "none", "important");
    });
  }

  function apply() { swapLogos(); hideConfirmations(); }

  // 1) Run now.
  apply();

  // 2) MutationObserver — re-apply the instant Framer mutates the DOM.
  var mo = new MutationObserver(function () { apply(); });
  function startObserver() {
    if (document.body) {
      mo.observe(document.body, { childList: true, subtree: true });
      apply();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else { startObserver(); }
  window.addEventListener("load", apply);

  // 3) rAF burst for the first ~4s (covers hydration frames the observer
  //    might fire during before body is ready).
  var start = Date.now();
  (function raf() {
    apply();
    if (Date.now() - start < 4000) requestAnimationFrame(raf);
  })();

  // Expose so formspree.js can mark a confirmation as intentionally revealed.
  window.__ssMarkConfirmationRevealed = function (id) {
    var el = document.getElementById(id);
    if (el) { el.__fsRevealed = true; el.style.setProperty("display", "block", "important"); }
  };
})();
