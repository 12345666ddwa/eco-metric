/* Eco-Metric · page-flip deck, artwork hotspots, live data panels */

(function () {
  "use strict";

  /* ---------------------------------------------------------------
     Hotspots on the artwork.
     Fractions of the slide image (0 to 1). go = target slide (1 based).
     --------------------------------------------------------------- */
  var HOTSPOTS = {
    // 2: [{ x: .08, y: .12, w: .1, h: .16, go: 5, label: "apple" }],
  };

  /* ---------------------------------------------------------------
     Data panels. Slides 2, 4 and 7 carry a live chart.
     Every figure is cited in the note line.
     --------------------------------------------------------------- */
  var ink = "#2b1b12", muted = "rgba(43,27,18,.6)", rule = "rgba(43,27,18,.16)";
  var accent = "#b5543a", olive = "#6b7449";
  var sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

  function barChart(cats, values, unit, colors, max) {
    return {
      backgroundColor: "transparent",
      animationDuration: 520,
      grid: { left: 2, right: 56, top: 14, bottom: 2, containLabel: true },
      xAxis: {
        type: "value", max: max,
        axisLabel: { color: muted, fontSize: 10.5, fontFamily: sans, formatter: function (v) { return v + unit; } },
        splitLine: { lineStyle: { color: rule, type: [2, 5] } },
        axisLine: { show: false }, axisTick: { show: false }
      },
      yAxis: {
        type: "category", inverse: true, data: cats,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 12, fontWeight: 600, fontFamily: sans }
      },
      series: [{
        type: "bar", barWidth: 24, itemStyle: { borderRadius: 0 },
        data: values.map(function (v, i) {
          return {
            value: v,
            itemStyle: { color: colors[i] || ink },
            label: {
              show: true, position: "right", distance: 7,
              color: colors[i] || ink, fontWeight: 700, fontSize: 12.5, fontFamily: sans,
              formatter: "{c}" + unit
            }
          };
        })
      }]
    };
  }

  var DP = {
    2: {
      kicker: "Slide 2 · scope",
      title: "How the profession moved between 2021 and 2026",
      tabs: [
        { id: "past", label: "Past 2021" },
        { id: "present", label: "Present 2026" },
        { id: "improve", label: "Improve" }
      ],
      note: "Source TALIS 2024 and Black Dog Institute data. The Improve view is a scenario on marking hours, not a forecast.",
      view: "present",
      build: function (view) {
        if (view === "past") {
          return { option: barChart(["Considering leaving, 2021"], [14], "%", [accent], 100),
                   note: "In 2021, 14% of Australian teachers had considered leaving the profession." };
        }
        if (view === "improve") {
          return { option: barChart(["Marking today", "If halved (scenario)"], [5.7, 2.85], "h", [accent, olive], 7),
                   note: "Halving the marking load is a scenario built on the TALIS weekly figure, not a projection." };
        }
        return { option: barChart(["Considering leaving", "Workload unmanageable", "Depression symptoms"],
                                  [46.8, 70, 52], "%", [accent, ink, ink], 100),
                 note: "By 2026, 46.8% had considered leaving, 70% called the workload unmanageable, 52% reported moderate to severe depression symptoms." };
      }
    },

    4: {
      kicker: "Slide 4 · burnout",
      title: "The working week that the system is built on",
      note: "Source TALIS 2024, OECD country note for Australia. Teachers 46.5 hours per week against an OECD average of 41.",
      build: function () {
        return {
          option: barChart(["OECD average", "Australian teachers"], [41, 46.5], " h", [ink, accent], 50),
          note: "The gap is 5.5 hours a week, about 13% more than the OECD average. Not 40%."
        };
      }
    },

    7: {
      kicker: "Slide 7 · new chapters",
      title: "What halving the marking load gives back",
      note: "Arithmetic on the TALIS 2024 weekly marking figure across a 40 week school year.",
      build: function () {
        return {
          option: barChart(["Hours a year", "If halved"], [228, 114], " h", [accent, olive], 260),
          note: "5.7 hours of marking a week is roughly 228 hours a year. Halved, 114 hours return to lesson design or to leaving work at work."
        };
      }
    }
  };

  var pages = Array.prototype.slice.call(document.querySelectorAll(".page"));
  var spots = document.getElementById("hotspots");
  var dotsBox = document.getElementById("dots");
  var cur = document.getElementById("cur");
  var totalEl = document.getElementById("total");
  var presentBtn = document.getElementById("present");
  var bar = document.getElementById("bar");
  var book = document.getElementById("book");
  var panel = document.getElementById("dataPanel");
  var dpOpenBtn = document.getElementById("dpOpen");
  var dpTitle = document.getElementById("dpTitle");
  var dpKicker = document.getElementById("dpKicker");
  var dpNote = document.getElementById("dpNote");
  var dpTabs = document.getElementById("dpTabs");
  var dpChartEl = document.getElementById("dpChart");

  var total = pages.length;
  var index = 0;
  var busy = false;
  var FLIP = 820;
  var chart = null;
  var panelSlide = 0;

  totalEl.textContent = String(total).padStart(2, "0");

  /* ---------------- dots ---------------- */
  pages.forEach(function (p, i) {
    var b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.setAttribute("aria-label", "Slide " + (i + 1) + ": " + (p.dataset.title || ""));
    b.addEventListener("click", function (e) { e.stopPropagation(); closePanel(); goTo(i); });
    dotsBox.appendChild(b);
  });
  var dots = Array.prototype.slice.call(dotsBox.children);

  function setActive(i) {
    dots.forEach(function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
    cur.textContent = String(i + 1).padStart(2, "0");
    renderHotspots(i);
    document.body.classList.toggle("has-data", !!DP[i + 1]);
  }

  /* ---------------- hotspots ---------------- */
  function imageRect() {
    var img = pages[index].querySelector("img");
    var nw = img.naturalWidth || 16, nh = img.naturalHeight || 9;
    var cw = book.clientWidth, ch = book.clientHeight;
    var s = Math.min(cw / nw, ch / nh);
    return { left: (cw - nw * s) / 2, top: (ch - nh * s) / 2, w: nw * s, h: nh * s };
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
      b.setAttribute("aria-label", "Open slide " + hs.go + (hs.label ? ", " + hs.label : ""));
      b.innerHTML = "<span>" + (hs.label ? "open " + hs.label : "open") + "</span>";
      b.addEventListener("click", function (e) { e.stopPropagation(); closePanel(); goTo(hs.go - 1); });
      spots.appendChild(b);
    });
  }

  window.addEventListener("resize", function () {
    renderHotspots(index);
    if (chart) chart.resize();
  });

  /* ---------------- page turning ---------------- */
  function goTo(target) {
    target = Math.max(0, Math.min(total - 1, target));
    if (busy || target === index) return;
    if (panel.classList.contains("open")) closePanel();
    busy = true;

    var forward = target > index;
    var out = pages[index];
    var inc = pages[target];

    out.classList.remove("arrive-next", "arrive-prev");
    out.classList.add("turning", forward ? "turn-next" : "turn-prev");
    inc.classList.add("active", forward ? "arrive-next" : "arrive-prev");
    inc.style.zIndex = "1";
    out.style.zIndex = "3";

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
    setTimeout(finish, FLIP + 90);
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  document.querySelector(".nav-arrow.next").addEventListener("click", function (e) { e.stopPropagation(); next(); });
  document.querySelector(".nav-arrow.prev").addEventListener("click", function (e) { e.stopPropagation(); prev(); });
  document.getElementById("rail").addEventListener("click", function (e) {
    var el = e.target.closest("[data-goto]");
    if (!el) return;
    e.stopPropagation();
    closePanel();
    goTo(parseInt(el.getAttribute("data-goto"), 10));
  });

  book.addEventListener("click", function (e) {
    if (e.target.closest(".hotspot")) return;
    if (panel.classList.contains("open")) return;
    if (e.clientX / window.innerWidth < 0.12) prev(); else next();
  });

  /* ---------------- data panel ---------------- */
  function openPanel() {
    var cfg = DP[index + 1];
    if (!cfg) return;
    panelSlide = index + 1;
    dpKicker.textContent = cfg.kicker;
    dpTitle.textContent = cfg.title;

    dpTabs.innerHTML = "";
    var current = cfg.view || (cfg.tabs ? cfg.tabs[0].id : null);
    if (cfg.tabs) {
      cfg.tabs.forEach(function (t) {
        var b = document.createElement("button");
        b.className = "dp-tab";
        b.type = "button";
        b.textContent = t.label;
        b.setAttribute("aria-selected", t.id === current ? "true" : "false");
        b.addEventListener("click", function () {
          dpTabs.querySelectorAll(".dp-tab").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
          b.setAttribute("aria-selected", "true");
          applyView(t.id);
        });
        dpTabs.appendChild(b);
      });
    }

    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    if (!chart) chart = echarts.init(dpChartEl);
    applyView(current);
    setTimeout(function () { if (chart) chart.resize(); }, 420);
    setPresent(false);
  }

  function applyView(view) {
    var cfg = DP[panelSlide];
    if (!cfg) return;
    var out = cfg.build(view);
    chart.setOption(out.option, true);
    dpNote.textContent = out.note;
  }

  function closePanel() {
    if (!panel.classList.contains("open")) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  dpOpenBtn.addEventListener("click", function (e) { e.stopPropagation(); openPanel(); });
  document.getElementById("dpClose").addEventListener("click", function (e) { e.stopPropagation(); closePanel(); });

  /* ---------------- keys ---------------- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(total - 1); }
    else if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      if (panel.classList.contains("open")) closePanel(); else openPanel();
    }
    else if (e.key === "p" || e.key === "P") { togglePresent(); }
    else if (e.key === "Escape") { if (panel.classList.contains("open")) closePanel(); else setPresent(false); }
    else if (e.key === "r" || e.key === "R") { goTo(0); }
  });

  /* ---------------- present mode, on by default ---------------- */
  var timer = null, tick = null, SLIDE_MS = 10000;

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
  setPresent(true);
})();
