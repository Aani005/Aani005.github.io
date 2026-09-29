/* ============================================================
   ShipSpree — swap text wordmark for logo image (post-hydration)
   Editing the static HTML doesn't work: Framer's React hydration
   reconciles the DOM back to its component tree (text "ShipSpree").
   So we swap AFTER hydration and keep re-applying, since Framer may
   re-render. We replace the <p>ShipSpree</p> inside each wordmark
   container (nav + footer) with the white horizontal logo.
   ============================================================ */
(function () {
  "use strict";

  var LOGO = "/assets/brand/shipspree-logo-horizontal-white.svg?v=3";

  // The two wordmark containers Framer generates (nav + footer).
  var SELECTORS = [
    { cls: "framer-1c3wd02", h: 22 },  // nav
    { cls: "framer-11jj3ko", h: 28 }   // footer
  ];

  function apply() {
    SELECTORS.forEach(function (s) {
      document.querySelectorAll("." + s.cls).forEach(function (box) {
        // Already swapped? skip.
        if (box.querySelector("img[data-ss-logo]")) return;
        var p = box.querySelector("p");
        // Only swap if it currently holds the text wordmark.
        if (!p || !/ShipSpree/i.test(p.textContent)) return;
        var img = document.createElement("img");
        img.src = LOGO;
        img.alt = "ShipSpree";
        img.setAttribute("data-ss-logo", "1");
        img.style.height = s.h + "px";
        img.style.width = "auto";
        img.style.display = "block";
        p.replaceWith(img);
      });
    });
  }

  function boot() {
    apply();
    // Framer hydrates/re-renders late; keep re-applying for a while.
    var n = 0;
    var iv = setInterval(function () { apply(); if (++n > 30) clearInterval(iv); }, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
  window.addEventListener("load", boot);
})();
