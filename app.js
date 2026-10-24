/* Eco-Metric · interactions
   Static site. No backend. All values hard coded below with their sources
   documented in index.html. */

(function () {
  "use strict";

  var deck = document.getElementById("deck");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dotsBox = document.getElementById("dots");
  var counter = document.getElementById("counter");
  var total = slides.length;

  var palette = {
    paper: "#f7f3e9",
    ink: "#14130f",
    ink2: "#4a463d",
    muted: "#7a7466",
    rule: "#d8d0bd",
    accent: "#b23a2c",
    olive: "#6e7b4b"
  };

  var charts = {};
  var chartReady = {};

  /* ---------- navigation ---------- */
  function goTo(index) {
    var i = Math.max(0, Math.min(total - 1, index));
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

  function setActive(index) {
    dots.forEach(function (d, i) { d.setAttribute("aria-current", i === index ? "true" : "false"); });
    counter.textContent = String(index + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-goto]");
    if (!el) return;
    e.preventDefault();
    goTo(parseInt(el.getAttribute("data-goto"), 10));
  });

  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      goTo(currentIndex() + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goTo(currentIndex() - 1);
    } else if (e.key === "Home") {
      e.preventDefault(); goTo(0);
    } else if (e.key === "End") {
      e.preventDefault(); goTo(total - 1);
    }
  });

  function currentIndex() {
    var best = 0, bestDist = Infinity;
    slides.forEach(function (s, i) {
      var d = Math.abs(s.getBoundingClientRect().top);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

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

  /* ---------- charts ---------- */
  function baseGrid() {
    return { left: 8, right: 56, top: 10, bottom: 8, containLabel: true };
  }

  function axisStyle() {
    return {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: palette.ink2, fontSize: 12.5 },
      splitLine: { show: false }
    };
  }

  function barOption(cfg) {
    return {
      backgroundColor: "transparent",
      animationDuration: 420,
      animationEasing: "cubicOut",
      grid: baseGrid(),
      xAxis: {
        type: "value",
        max: cfg.max,
        axisLabel: {
          color: palette.muted,
          fontSize: 11.5,
          formatter: function (v) { return v + cfg.unit; }
        },
        splitLine: { lineStyle: { color: palette.rule, type: [2, 4] } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: cfg.data.map(function (d) { return d.name; }),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: palette.ink, fontSize: 13, fontWeight: 600 }
      },
      series: [{
        type: "bar",
        barWidth: cfg.barWidth || 26,
        data: cfg.data.map(function (d) {
          return {
            value: d.value,
            itemStyle: { color: d.hl ? palette.accent : palette.ink },
            label: {
              show: true,
              position: "right",
              distance: 8,
              color: d.hl ? palette.accent : palette.ink,
              fontWeight: 700,
              fontSize: 14,
              formatter: "{c}" + cfg.unit
            }
          };
        }),
        itemStyle: { borderRadius: 0 }
      }]
    };
  }

  /* slide 2: three views */
  var WORKLOAD = {
    past: {
      unit: "%",
      max: 100,
      data: [{ name: "Considering leaving, 2021", value: 14, hl: true }]
    },
    present: {
      unit: "%",
      max: 100,
      data: [
        { name: "Considering leaving", value: 46.8, hl: true },
        { name: "Workload unmanageable", value: 70, hl: false },
        { name: "Depression symptoms", value: 52, hl: false }
      ]
    },
    improve: {
      unit: " h",
      max: 6.5,
      data: [
        { name: "Marking today", value: 5.7, hl: true },
        { name: "If halved (scenario)", value: 2.85, hl: false }
      ]
    }
  };

  var VIEW_NOTES = {
    past: "In 2021, 14% of Australian teachers had considered leaving the profession.",
    present: "By 2026 that figure is 46.8%. Workload and mental health moved with it.",
    improve: "A scenario, not a forecast: halve the marking load and see what the week looks like."
  };

  function renderWorkload(view) {
    var cfg = WORKLOAD[view];
    if (!charts.workload) return;
    charts.workload.setOption(barOption(cfg), true);
    var note = document.getElementById("viewNote");
    if (note) note.textContent = VIEW_NOTES[view];
  }

  /* slide 4: depression prevalence */
  function costOption() {
    return {
      backgroundColor: "transparent",
      grid: { left: 8, right: 64, top: 10, bottom: 8, containLabel: true },
      xAxis: {
        type: "value", max: 100,
        axisLabel: { color: palette.muted, fontSize: 11.5, formatter: "{value}%" },
        splitLine: { lineStyle: { color: palette.rule, type: [2, 4] } },
        axisLine: { show: false }, axisTick: { show: false }
      },
      yAxis: {
        type: "category", inverse: true,
        data: ["Teachers", "General population"],
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: palette.ink, fontSize: 13, fontWeight: 600 }
      },
      series: [{
        type: "bar", barWidth: 34,
        data: [
          { value: 52, itemStyle: { color: palette.accent }, label: { show: true, position: "right", formatter: "{c}%", color: palette.accent, fontWeight: 700, fontSize: 15 } },
          { value: 12, itemStyle: { color: palette.ink }, label: { show: true, position: "right", formatter: "{c}%", color: palette.ink, fontWeight: 700, fontSize: 15 } }
        ]
      }]
    };
  }

  /* slide 5: marking hours per year */
  function hoursOption() {
    return {
      backgroundColor: "transparent",
      grid: { left: 8, right: 64, top: 10, bottom: 8, containLabel: true },
      xAxis: {
        type: "value", max: 260,
        axisLabel: { color: palette.muted, fontSize: 11.5, formatter: "{value} h" },
        splitLine: { lineStyle: { color: palette.rule, type: [2, 4] } },
        axisLine: { show: false }, axisTick: { show: false }
      },
      yAxis: {
        type: "category", inverse: true,
        data: ["Hours per year", "If halved"],
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: palette.ink, fontSize: 12.5, fontWeight: 600 }
      },
      series: [{
        type: "bar", barWidth: 30,
        data: [
          { value: 228, itemStyle: { color: palette.accent }, label: { show: true, position: "right", formatter: "{c} h", color: palette.accent, fontWeight: 700, fontSize: 14 } },
          { value: 114, itemStyle: { color: palette.olive }, label: { show: true, position: "right", formatter: "{c} h", color: palette.olive, fontWeight: 700, fontSize: 14 } }
        ]
      }]
    };
  }

  /* slide 6: minutes per question */
  function penOption() {
    return {
      backgroundColor: "transparent",
      grid: { left: 8, right: 56, top: 10, bottom: 8, containLabel: true },
      xAxis: {
        type: "value", max: 12,
        axisLabel: { color: palette.muted, fontSize: 11.5, formatter: "{value} min" },
        splitLine: { lineStyle: { color: palette.rule, type: [2, 4] } },
        axisLine: { show: false }, axisTick: { show: false }
      },
      yAxis: {
        type: "category", inverse: true,
        data: ["Student answers", "Teacher reads", "Teacher writes feedback"],
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: palette.ink, fontSize: 12.5, fontWeight: 600 }
      },
      series: [{
        type: "bar", barWidth: 26,
        data: [
          { value: 5, itemStyle: { color: palette.ink } },
          { value: 10, itemStyle: { color: palette.ink2 } },
          { value: 10, itemStyle: { color: palette.accent }, label: { show: true, position: "right", formatter: "{c} min", color: palette.accent, fontWeight: 700, fontSize: 14 } }
        ],
        label: { show: true, position: "right", color: palette.ink2, fontSize: 13, formatter: "{c} min" }
      }]
    };
  }

  /* slide 7: 60% gauge */
  function amateurOption() {
    return {
      backgroundColor: "transparent",
      series: [{
        type: "gauge",
        startAngle: 200, endAngle: -20,
        min: 0, max: 100,
        radius: "92%",
        center: ["50%", "62%"],
        progress: { show: true, width: 18, itemStyle: { color: palette.accent } },
        axisLine: { lineStyle: { width: 18, color: [[1, palette.rule]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        detail: {
          offsetCenter: [0, "-6%"],
          fontSize: 46, fontWeight: 800, color: palette.ink,
          formatter: "{value}%"
        },
        title: {
          offsetCenter: [0, "26%"],
          fontSize: 13, color: palette.muted
        },
        data: [{ value: 60, name: "name marking as the most stressful part" }]
      }]
    };
  }

  function ensureChart(slideIndex) {
    var id = slides[slideIndex] && slides[slideIndex].id;
    if (!id || chartReady[id]) return;
    chartReady[id] = true;

    if (id === "s2") {
      charts.workload = echarts.init(document.getElementById("chartWorkload"));
      renderWorkload("present");
    } else if (id === "s4") {
      charts.cost = echarts.init(document.getElementById("chartCost"));
      charts.cost.setOption(costOption());
    } else if (id === "s5") {
      charts.hours = echarts.init(document.getElementById("chartHours"));
      charts.hours.setOption(hoursOption());
    } else if (id === "s6") {
      charts.pen = echarts.init(document.getElementById("chartPen"));
      charts.pen.setOption(penOption());
    } else if (id === "s7") {
      charts.amateur = echarts.init(document.getElementById("chartAmateur"));
      charts.amateur.setOption(amateurOption());
    }
  }

  /* tabs on slide 2 */
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      tab.setAttribute("aria-selected", "true");
      renderWorkload(tab.dataset.view);
    });
  });

  /* resize */
  window.addEventListener("resize", function () {
    Object.keys(charts).forEach(function (k) { if (charts[k]) charts[k].resize(); });
  });

  /* boot */
  setActive(0);
  slides.forEach(function (_, i) { ensureChart(i); });
})();
