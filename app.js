/* Eco-Metric · slide navigation */

(function () {
  "use strict";

  var deck = document.getElementById("deck");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dotsBox = document.getElementById("dots");
  var cur = document.getElementById("cur");
  var totalEl = document.getElementById("total");
  var presentBtn = document.getElementById("present");
  var bar = document.getElementById("bar");
  var total = slides.length;

  totalEl.textContent = String(total).padStart(2, "0");

  slides.forEach(function (s, i) {
    var b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.setAttribute("aria-label", "Slide " + (i + 1) + ": " + (s.dataset.title || ""));
    b.addEventListener("click", function () { goTo(i); });
    dotsBox.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsBox.children);

  function goTo(i) {
    i = Math.max(0, Math.min(total - 1, i));
    slides[i].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function currentIndex() {
    var best = 0, dist = Infinity;
    slides.forEach(function (s, i) {
      var d = Math.abs(s.getBoundingClientRect().top);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  function setActive(i) {
    dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
    cur.textContent = String(i + 1).padStart(2, "0");
  }

  var ticking = false;
  deck.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      setActive(currentIndex());
      ticking = false;
    });
  }, { passive: true });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-goto]");
    if (!el) return;
    e.preventDefault();
    goTo(parseInt(el.getAttribute("data-goto"), 10));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault(); goTo(currentIndex() + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault(); goTo(currentIndex() - 1);
    } else if (e.key === "Home") {
      e.preventDefault(); goTo(0);
    } else if (e.key === "End") {
      e.preventDefault(); goTo(total - 1);
    } else if (e.key === "p" || e.key === "P") {
      togglePresent();
    } else if (e.key === "Escape") {
      setPresent(false);
    }
  });

  /* present mode: auto advance */
  var timer = null, tick = null, SLIDE_MS = 9000;

  function setPresent(on) {
    if (timer) { clearInterval(timer); timer = null; }
    if (tick) { clearInterval(tick); tick = null; }
    presentBtn.setAttribute("aria-pressed", on ? "true" : "false");
    bar.classList.toggle("on", on);
    if (!on) { bar.querySelector("i").style.width = "0%"; return; }
    var fill = bar.querySelector("i");
    var elapsed = 0;
    tick = setInterval(function () {
      elapsed += 100;
      fill.style.width = Math.min(100, (elapsed / SLIDE_MS) * 100) + "%";
    }, 100);
    timer = setInterval(function () {
      elapsed = 0;
      fill.style.width = "0%";
      var n = currentIndex() + 1;
      goTo(n >= total ? 0 : n);
    }, SLIDE_MS);
  }

  function togglePresent() { setPresent(presentBtn.getAttribute("aria-pressed") !== "true"); }
  presentBtn.addEventListener("click", togglePresent);

  setActive(0);
})();
