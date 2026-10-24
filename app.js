/* Eco-Metric v3 · interactions
   Static site. Every number is hard coded and cited on the slide. */

(function () {
  "use strict";

  var deck = document.getElementById("deck");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dotsBox = document.getElementById("dots");
  var folioNum = document.getElementById("folioNum");
  var presentBtn = document.getElementById("present");
  var presentBar = document.getElementById("presentBar");
  var total = slides.length;

  var ink = "#1b1a16";
  var ink2 = "#4a443a";
  var muted = "#8a8272";
  var rule = "#e2d7c2";
  var accent = "#b5543a";
  var olive = "#6b7449";
  var sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  var serif = '"Newsreader", Georgia, serif';

  var charts = {};
  var chartReady = {};

  /* ---------------- navigation ---------------- */
  function goTo(i) {
    i = Math.max(0, Math.min(total - 1, i));
    slides[i].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  slides.forEach(function (s, i) {
    var b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.setAttribute("aria-label", "Slide " + (i + 1) + ": " + (s.dataset.title || ""));
    b.addEventListener("click", function () { goTo(i); });
    dotsBox.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsBox.children);

  function setActive(i) {
    dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
    folioNum.textContent = String(i + 1).padStart(2, "0");
  }

  function currentIndex() {
    var best = 0, bestDist = Infinity;
    slides.forEach(function (s, i) {
      var d = Math.abs(s.getBoundingClientRect().top);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  /* ---------------- explore marks ---------------- */
  var found = { apple: false, pen: false };

  function markFound(kind) {
    if (!kind || found[kind]) return;
    found[kind] = true;
    var btn = document.querySelector('#rail .jump[data-goto="' + (kind === "apple" ? 4 : 5) + '"]');
    if (btn) btn.classList.add("found");
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-goto]");
    if (!el) return;
    e.preventDefault();
    markFound(el.getAttribute("data-collect"));
    goTo(parseInt(el.getAttribute("data-goto"), 10));
  });

  /* ---------------- keyboard ---------------- */
  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea")) return;
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

  var ticking = false;
  deck.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      setActive(currentIndex());
      ticking = false;
    });
  }, { passive: true });

  /* ---------------- present mode ---------------- */
  var presentTimer = null;
  var presentTick = null;
  var PRESENT_MS = 9000;

  function setPresent(on) {
    if (presentTimer) { clearInterval(presentTimer); presentTimer = null; }
    if (presentTick) { clearInterval(presentTick); presentTick = null; }
    if (!on) {
      presentBar.classList.remove("on");
      presentBtn.setAttribute("aria-pressed", "false");
      return;
    }
    presentBtn.setAttribute("aria-pressed", "true");
    presentBar.classList.add("on");
    var bar = presentBar.querySelector("i");
    var elapsed = 0;
    presentTick = setInterval(function () {
      elapsed += 100;
      bar.style.width = Math.min(100, (elapsed / PRESENT_MS) * 100) + "%";
    }, 100);
    presentTimer = setInterval(function () {
      bar.style.width = "0%";
      elapsed = 0;
      var next = currentIndex() + 1;
      goTo(next >= total ? 0 : next);
    }, PRESENT_MS);
  }

  function togglePresent() {
    setPresent(presentBtn.getAttribute("aria-pressed") !== "true");
  }
  presentBtn.addEventListener("click", togglePresent);

  /* ---------------- chart building blocks ---------------- */
  function valueAxis(unit, max) {
    return {
      type: "value",
      max: max,
      axisLabel: {
        color: muted, fontSize: 11, fontFamily: sans,
        formatter: function (v) { return v + unit; }
      },
      splitLine: { lineStyle: { color: rule, type: [2, 5] } },
      axisLine: { show: false },
      axisTick: { show: false }
    };
  }

  function categoryAxis(list) {
    return {
      type: "category", inverse: true, data: list,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: ink, fontSize: 12.5, fontWeight: 600, fontFamily: sans }
    };
  }

  function bar(data, opts) {
    opts = opts || {};
    return {
      type: "bar",
      barWidth: opts.width || 24,
      itemStyle: { borderRadius: 0 },
      data: data.map(function (d) {
        return {
          value: d.v,
          itemStyle: { color: d.c || ink },
          label: {
            show: true, position: "right", distance: 8,
            color: d.c || ink, fontWeight: 700, fontSize: 13,
            fontFamily: sans, formatter: "{c}" + (opts.unit || "")
          }
        };
      })
    };
  }

  var WORKLOAD = {
    past: {
      unit: "%", max: 100,
      cats: ["Considering leaving, 2021"],
      rows: [{ v: 14, c: accent }]
    },
    present: {
      unit: "%", max: 100,
      cats: ["Considering leaving", "Workload unmanageable", "Depression symptoms"],
      rows: [{ v: 46.8, c: accent }, { v: 70 }, { v: 52 }]
    },
    improve: {
      unit: "h", max: 7,
      cats: ["Marking today", "If halved (scenario)"],
      rows: [{ v: 5.7, c: accent }, { v: 2.85, c: olive }]
    }
  };

  var VIEW_NOTES = {
    past: "In 2021, 14% of Australian teachers had considered leaving the profession.",
    present: "By 2026 that figure is 46.8%. Workload and mental health moved with it.",
    improve: "A scenario, not a forecast: halve the marking load and see the week again."
  };

  function renderWorkload(view) {
    var cfg = WORKLOAD[view];
    if (!charts.workload) return;
    charts.workload.setOption({
      backgroundColor: "transparent",
      animationDuration: 460,
      grid: { left: 2, right: 54, top: 10, bottom: 2, containLabel: true },
      xAxis: valueAxis(cfg.unit, cfg.max),
      yAxis: categoryAxis(cfg.cats),
      series: [bar(cfg.rows, { unit: cfg.unit, width: 22 })]
    }, true);
    var note = document.getElementById("viewNote");
    if (note) note.textContent = VIEW_NOTES[view];
  }

  function hoursOption() {
    return {
      backgroundColor: "transparent",
      animationDuration: 520,
      grid: { left: 2, right: 60, top: 10, bottom: 2, containLabel: true },
      xAxis: valueAxis(" h", 50),
      yAxis: categoryAxis(["OECD average", "Australian teachers"]),
      series: [bar([
        { v: 41, c: ink2 },
        { v: 46.5, c: accent }
      ], { unit: " h", width: 28 })]
    };
  }

  function markingOption() {
    return {
      backgroundColor: "transparent",
      animationDuration: 520,
      grid: { left: 2, right: 60, top: 10, bottom: 2, containLabel: true },
      xAxis: valueAxis(" h", 260),
      yAxis: categoryAxis(["Hours per year", "If marking halved"]),
      series: [bar([
        { v: 228, c: accent },
        { v: 114, c: olive }
      ], { unit: " h", width: 26 })]
    };
  }

  function ensureChart(i) {
    var id = slides[i] && slides[i].id;
    if (!id || chartReady[id]) return;
    chartReady[id] = true;
    if (id === "s2") {
      charts.workload = echarts.init(document.getElementById("chartWorkload"));
      renderWorkload("present");
    } else if (id === "s4") {
      charts.hours = echarts.init(document.getElementById("chartHours"));
      charts.hours.setOption(hoursOption());
    } else if (id === "s7") {
      charts.marking = echarts.init(document.getElementById("chartMarking"));
      charts.marking.setOption(markingOption());
    }
  }

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      tab.setAttribute("aria-selected", "true");
      renderWorkload(tab.dataset.view);
    });
  });

  window.addEventListener("resize", function () {
    Object.keys(charts).forEach(function (k) { if (charts[k]) charts[k].resize(); });
  });

  setActive(0);
  slides.forEach(function (_, i) { ensureChart(i); });
})();
