/* Eco-Metric · page-flip deck + clickable artwork hotspots */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     HOTSPOTS
     Coordinates are fractions of the SLIDE IMAGE (0 to 1), so they stay
     correct at any window size. go = target slide number (1 based).
     Filled in from the storyboard artwork: the apple opens slide 5,
     the pen opens slide 6.
     ------------------------------------------------------------------ */
  var HOTSPOTS = {
    // 1: [{ x: 0.10, y: 0.20, w: 0.12, h: 0.18, go: 5, label: "apple" }],
  };

  var pages = Array.prototype.slice.call(document.querySelectorAll(".page"));
  var spots = document.getElementById("hotspots");
  var dotsBox = document.getElementById("dots");
  var cur = document.getElementById("cur");
  var totalEl = document.getElementById("total");
  var presentBtn = document.getElementById("present");
  var bar = document.getElementById("bar");
  var book = document.getElementById("book");
  var total = pages.length;
  var index = 0;
  var busy = false;
  var FLIP = 820;

  totalEl.textContent = String(total).padStart(2, "0");

  /* dots */
  pages.forEach(function (p, i) {
    var b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.setAttribute("aria-label", "Slide " + (i + 1) + ": " + (p.dataset.title || ""));
    b.addEventListener("click", function (e) { e.stopPropagation(); goTo(i); });
    dotsBox.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsBox.children);

  function setActive(i) {
    dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
    cur.textContent = String(i + 1).padStart(2, "0");
    renderHotspots(i);
  }

  /* geometry of the contained image */
  function imageRect() {
    var img = pages[index].querySelector("img");
    var nw = img.naturalWidth || 16, nh = img.naturalHeight || 9;
    var cw = book.clientWidth, ch = book.clientHeight;
    var scale = Math.min(cw / nw, ch / nh);
    var w = nw * scale, h = nh * scale;
    return { left: (cw - w) / 2, top: (ch - h) / 2, w: w, h: h };
  }

  function renderHotspots(i) {
    spots.innerHTML = "";
    var list = HOTSPOTS[i + 1];
    if (!list || !list.length) return;
    var r = imageRect();
    list.forEach(function (hs) {
      var b = document.createElement("button");
      b.className = "hotspot";
      b.type = "button";
      b.style.left = (r.left + hs.x * r.w) + "px";
      b.style.top = (r.top + hs.y * r.h) + "px";
      b.style.width = (hs.w * r.w) + "px";
      b.style.height = (hs.h * r.h) + "px";
      b.setAttribute("aria-label", "Open slide " + (hs.go || 1) + (hs.label ? " (" + hs.label + ")" : ""));
      b.innerHTML = "<span>" + (hs.label ? "open " + hs.label : "open") + "</span>";
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        goTo((hs.go || 1) - 1);
      });
      spots.appendChild(b);
    });
  }

  window.addEventListener("resize", function () { renderHotspots(index); });

  /* ---------------- page turning ---------------- */
  function goTo(target, opts) {
    target = Math.max(0, Math.min(total - 1, target));
    if (busy || target === index) return;
    busy = true;

    var forward = target > index;
    var out = pages[index];
    var inc = pages[target];

    out.classList.remove("arrive-next", "arrive-prev");
    out.classList.add("turning", forward ? "turn-next" : "turn-prev");

    inc.classList.add("active", forward ? "arrive-next" : "arrive-prev");
    inc.style.zIndex = "1";
    out.style.zIndex = "3";

    // hide other pages
    pages.forEach(function (p, k) {
      if (k !== index && k !== target) {
        p.classList.remove("active", "arrive-next", "arrive-prev", "turning", "turn-next", "turn-prev");
        p.style.zIndex = "";
      }
    });

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      out.classList.remove("turning", "turn-next", "turn-prev", "active");
      out.style.zIndex = "";
      inc.classList.remove("arrive-next", "arrive-prev");
      inc.classList.add("active");
      inc.style.zIndex = "";
      index = target;
      setActive(index);
      busy = false;
    }
    out.addEventListener("animationend", finish, { once: true });
    setTimeout(finish, FLIP + 80);
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  document.querySelector(".nav-arrow.next").addEventListener("click", next);
  document.querySelector(".nav-arrow.prev").addEventListener("click", prev);
  document.getElementById("rail").addEventListener("click", function (e) {
    var el = e.target.closest("[data-goto]");
    if (!el) return;
    e.stopPropagation();
    goTo(parseInt(el.getAttribute("data-goto"), 10));
  });

  /* click the artwork itself to turn the page */
  book.addEventListener("click", function (e) {
    if (e.target.closest(".hotspot")) return;
    var x = e.clientX / window.innerWidth;
    if (x < 0.12) prev(); else next();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(total - 1); }
    else if (e.key === "p" || e.key === "P") { togglePresent(); }
    else if (e.key === "Escape") { setPresent(false); }
  });

  /* ---------------- present mode ---------------- */
  var timer = null, tick = null, SLIDE_MS = 9000;

  function setPresent(on) {
    if (timer) { clearInterval(timer); timer = null; }
    if (tick) { clearInterval(tick); tick = null; }
    presentBtn.setAttribute("aria-pressed", on ? "true" : "false");
    bar.classList.toggle("on", on);
    if (!on) { bar.querySelector("i").style.width = "0%"; return; }
    var fill = bar.querySelector("i"), elapsed = 0;
    tick = setInterval(function () {
      elapsed += 100;
      fill.style.width = Math.min(100, (elapsed / SLIDE_MS) * 100) + "%";
    }, 100);
    timer = setInterval(function () {
      elapsed = 0; fill.style.width = "0%";
      if (index >= total - 1) goTo(0); else next();
    }, SLIDE_MS);
  }
  function togglePresent() { setPresent(presentBtn.getAttribute("aria-pressed") !== "true"); }
  presentBtn.addEventListener("click", function (e) { e.stopPropagation(); togglePresent(); });

  /* boot */
  setActive(0);
})();
