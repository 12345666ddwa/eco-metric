/* Eco-Metric v2 · interactions
   Static site, no backend. Values are hard coded here and cited on the page. */

(function () {
  "use strict";

  var deck = document.getElementById("deck");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dotsBox = document.getElementById("dots");
  var folioNum = document.getElementById("folioNum");
  var presentBtn = document.getElementById("present");
  var presentBar = document.getElementById("presentBar");
  var total = slides.length;

  var ink = "#16140e";
  var ink2 = "#453f33";
  var muted = "#867d6a";
  var rule = "#d3c8b0";
  var accent = "#a8382a";
  var olive = "#5f6b45";
  var sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

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

  /* ---------------- explore counter (light gamification) ---------------- */
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
      var i = currentIndex();
      setActive(i);
      ensureChart(i);
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
    var on = presentBtn.getAttribute("aria-pressed") !== "true";
    setPresent(on);
  }
  presentBtn.addEventListener("click", togglePresent);

  /* ---------------- chart helpers ---------------- */
  function axisCommon(unitLabel) {
    return {
      type: "value",
      axisLabel: {
        color: muted,
        fontSize: 11,
        fontFamily: sans,
        formatter: function (v) { return v + unitLabel; }
      },
      splitLine: { lineStyle: { color: rule, type: [2, 5] } },
      axisLine: { show: false },
      axisTick: { show: false }
    };
  }

  function catAxis(list) {
    return {
      type: "category",
      inverse: true,
      data: list,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: ink, fontSize: 12.5, fontWeight: 600, fontFamily: sans }
    };
  }

  var WORKLOAD = {
    past: {
      unit: "%", max: 100,
      cats: ["Considering leaving, 2021"],
      rows: [{ v: 14, hl: true }]
    },
    present: {
      unit: "%", max: 100,
      cats: ["Considering leaving", "Workload unmanageable", "Depression symptoms"],
      rows: [{ v: 46.8, hl: true }, { v: 70 }, { v: 52 }]
    },
    improve: {
      unit: "h", max: 6.5,
      cats: ["Marking today", "If halved (scenario)"],
      rows: [{ v: 5.7, hl: true }, { v: 2.85 }]
    }
  };

  var VIEW_NOTES = {
    past: "In 2021, 14% of Australian teachers had considered leaving the profession.",
    present: "By 2026 that figure is 46.8%. Workload and mental health moved with it.",
    improve: "A scenario, not a forecast: halve the marking load and see what the week looks like."
  };

  function barOption(cfg) {
    return {
      backgroundColor: "transparent",
      animationDuration: 460,
      animationEasing: "cubicOut",
      grid: { left: 4, right: 58, top: 12, bottom: 4, containLabel: true },
      xAxis: axisCommon(cfg.unit),
      yAxis: catAxis(cfg.cats),
      series: [{
        type: "bar",
        barWidth: 22,
        itemStyle: { borderRadius: 0 },
        data: cfg.rows.map(function (r) {
          return {
            value: r.v,
            itemStyle: { color: r.hl ? accent : ink },
            label: {
              show: true, position: "right", distance: 8,
              color: r.hl ? accent : ink,
              fontWeight: 700, fontSize: 13.5, fontFamily: sans,
              formatter: "{c}" + cfg.unit
            }
          };
        })
      }]
    };
  }

  function renderWorkload(view) {
    var cfg = WORKLOAD[view];
    cfg.xAxisMax = 100;
    var opt = barOption(cfg);
    opt.xAxis.max = cfg.max;
    if (charts.workload) charts.workload.setOption(opt, true);
    var note = document.getElementById("viewNote");
    if (note) note.textContent = VIEW_NOTES[view];
  }

  function costOption() {
    return {
      backgroundColor: "transparent",
      animationDuration: 460,
      grid: { left: 4, right: 62, top: 12, bottom: 4, containLabel: true },
      xAxis: (function () { var a = axisCommon("%"); a.max = 100; return a; })(),
      yAxis: catAxis(["Teachers", "General population"]),
      series: [{
        type: "bar", barWidth: 30,
        data: [
          { value: 52, itemStyle: { color: accent }, label: { show: true, position: "right", formatter: "{c}%", color: accent, fontWeight: 700, fontSize: 15, fontFamily: sans } },
          { value: 12, itemStyle: { color: ink }, label: { show: true, position: "right", formatter: "{c}%", color: ink, fontWeight: 700, fontSize: 15, fontFamily: sans } }
        ]
      }]
    };
  }

  function hoursOption() {
    return {
      backgroundColor: "transparent",
      animationDuration: 460,
      grid: { left: 4, right: 62, top: 12, bottom: 4, containLabel: true },
      xAxis: (function () { var a = axisCommon(" h"); a.max = 260; return a; })(),
      yAxis: catAxis(["Hours per year", "If halved"]),
      series: [{
        type: "bar", barWidth: 26,
        data: [
          { value: 228, itemStyle: { color: accent }, label: { show: true, position: "right", formatter: "{c} h", color: accent, fontWeight: 700, fontSize: 13.5, fontFamily: sans } },
          { value: 114, itemStyle: { color: olive }, label: { show: true, position: "right", formatter: "{c} h", color: olive, fontWeight: 700, fontSize: 13.5, fontFamily: sans } }
        ]
      }]
    };
  }

  function penOption() {
    return {
      backgroundColor: "transparent",
      animationDuration: 460,
      grid: { left: 4, right: 56, top: 12, bottom: 4, containLabel: true },
      xAxis: (function () { var a = axisCommon(" min"); a.max = 12; return a; })(),
      yAxis: catAxis(["Student answers", "Teacher reads", "Teacher writes feedback"]),
      series: [{
        type: "bar", barWidth: 24,
        data: [
          { value: 5, itemStyle: { color: ink } },
          { value: 10, itemStyle: { color: ink2 } },
          { value: 10, itemStyle: { color: accent } }
        ],
        label: {
          show: true, position: "right", color: ink2, fontSize: 12.5,
          fontFamily: sans, formatter: "{c} min"
        }
      }]
    };
  }

  function amateurOption() {
    return {
      backgroundColor: "transparent",
      series: [{
        type: "gauge",
        startAngle: 210, endAngle: -30,
        min: 0, max: 100,
        radius: "94%",
        center: ["50%", "60%"],
        progress: { show: true, width: 14, itemStyle: { color: accent } },
        axisLine: { lineStyle: { width: 14, color: [[1, rule]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        detail: {
          offsetCenter: [0, "-4%"],
          fontSize: 44, fontWeight: 600, color: ink,
          fontFamily: '"Newsreader", Georgia, serif',
          formatter: "{value}%"
        },
        title: {
          offsetCenter: [0, "28%"],
          fontSize: 11.5, color: muted, fontFamily: sans
        },
        data: [{ value: 60, name: "name marking as most stressful" }]
      }]
    };
  }

  function ensureChart(i) {
    var id = slides[i] && slides[i].id;
    if (!id || chartReady[id]) return;
    chartReady[id] = true;
    var el;
    if (id === "s2") { el = document.getElementById("chartWorkload"); charts.workload = echarts.init(el); renderWorkload("present"); }
    else if (id === "s4") { el = document.getElementById("chartCost"); charts.cost = echarts.init(el); charts.cost.setOption(costOption()); }
    else if (id === "s5") { el = document.getElementById("chartHours"); charts.hours = echarts.init(el); charts.hours.setOption(hoursOption()); }
    else if (id === "s6") { el = document.getElementById("chartPen"); charts.pen = echarts.init(el); charts.pen.setOption(penOption()); }
    else if (id === "s7") { el = document.getElementById("chartAmateur"); charts.amateur = echarts.init(el); charts.amateur.setOption(amateurOption()); }
  }

  /* tabs */
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

  /* boot */
  setActive(0);
  slides.forEach(function (_, i) { ensureChart(i); });
  document.body.classList.remove("is-loading");
})();
