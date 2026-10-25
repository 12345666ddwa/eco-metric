/* pick.html · coordinate picker for the storyboard artwork
   Open this page, click the apple and the pen, read the numbers. */

(function () {
  "use strict";

  var pages = Array.prototype.slice.call(document.querySelectorAll(".page"));
  var book = document.getElementById("book");
  var out = document.getElementById("out");
  var list = document.getElementById("list");
  var cur = document.getElementById("cur");
  var index = 0;
  var marks = [];

  function show(i) {
    pages.forEach(function (p, k) { p.classList.toggle("active", k === i); });
    cur.textContent = (i + 1) + " / " + pages.length;
    index = i;
  }

  function imageRect() {
    var img = pages[index].querySelector("img");
    var nw = img.naturalWidth || 16, nh = img.naturalHeight || 9;
    var cw = book.clientWidth, ch = book.clientHeight;
    var s = Math.min(cw / nw, ch / nh);
    return { left: (cw - nw * s) / 2, top: (ch - nh * s) / 2, w: nw * s, h: nh * s };
  }

  book.addEventListener("click", function (e) {
    var r = imageRect();
    var x = (e.clientX - r.left) / r.w;
    var y = (e.clientY - r.top) / r.h;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    var line = "slide " + (index + 1) + "   x=" + x.toFixed(3) + "   y=" + y.toFixed(3);
    marks.push(line);
    out.textContent = line;

    var li = document.createElement("li");
    li.textContent = line;
    list.appendChild(li);

    var dot = document.createElement("i");
    dot.className = "pin";
    dot.style.left = (r.left + x * r.w) + "px";
    dot.style.top = (r.top + y * r.h) + "px";
    book.appendChild(dot);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") show(Math.min(pages.length - 1, index + 1));
    if (e.key === "ArrowLeft") show(Math.max(0, index - 1));
  });

  document.getElementById("next").addEventListener("click", function (e) {
    e.stopPropagation();
    show(Math.min(pages.length - 1, index + 1));
  });
  document.getElementById("prev").addEventListener("click", function (e) {
    e.stopPropagation();
    show(Math.max(0, index - 1));
  });

  show(0);
})();
