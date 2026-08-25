/* PUIMEI mööbel — procedural wood-grain background.
   Draws contour lines of a scalar field: a slow horizontal flow warped by
   "knots", so grain lines close into nested wood eyes around each knot. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- knots, in fractions of the canvas box ---- */
  var KNOTS = [
    { fx: 0.14, fy: 0.74, amp: 300, rx: 0.155, ry: 0.150 },
    { fx: 0.155, fy: 0.755, amp: 110, rx: 0.055, ry: 0.055 },
    { fx: 0.72, fy: 0.30, amp: 265, rx: 0.140, ry: 0.135 },
    { fx: 0.735, fy: 0.315, amp: 95, rx: 0.048, ry: 0.048 },
    { fx: 0.93, fy: 0.80, amp: 215, rx: 0.115, ry: 0.115 },
    { fx: 0.40, fy: 0.06, amp: 180, rx: 0.130, ry: 0.100 }
  ];

  function drawGrain(canvas) {
    var W = canvas.clientWidth;
    var H = canvas.clientHeight;
    if (!W || !H) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var small = W < 700;
    /* finer grid on small screens too: knot rings sit at a smaller physical
       radius there, so they need a tighter grid to render round, not faceted */
    var step = small ? 5 : 6;
    var spacing = 34;

    var cols = Math.ceil(W / step) + 1;
    var rows = Math.ceil(H / step) + 1;
    var field = new Float32Array(cols * rows);

    /* amp is a fixed field-height, but a knot's on-screen radius (rx/ry)
       shrinks with the viewport — without this, the same height gets
       squeezed into a smaller radius on narrow screens, so the rings crowd
       together. Scaling amp down with the viewport keeps ring spacing
       consistent across screen sizes. */
    var sizeScale = Math.max(0.6, Math.min(1.05, W / 1200));

    var knots = KNOTS.map(function (k) {
      return { x: k.fx * W, y: k.fy * H, amp: k.amp * sizeScale, rx: k.rx * W, ry: k.ry * H };
    });

    var i, j, n;
    for (j = 0; j < rows; j++) {
      var y = j * step;
      for (i = 0; i < cols; i++) {
        var x = i * step;
        var v = y;
        /* long, lazy horizontal flow */
        v += 46 * Math.sin(x / 300 + 0.4);
        v += 24 * Math.sin(x / 132 + 2.1);
        v += 11 * Math.sin(x / 61 + 4.2);
        v += 18 * Math.sin(y / 220 + x / 950);
        for (n = 0; n < knots.length; n++) {
          var k = knots[n];
          var dx = (x - k.x) / k.rx;
          var dy = (y - k.y) / k.ry;
          v += k.amp * Math.exp(-(dx * dx + dy * dy));
        }
        field[j * cols + i] = v;
      }
    }

    ctx.lineWidth = small ? 1.6 : 2.1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(241, 233, 218, 0.62)';
    ctx.beginPath();

    for (j = 0; j < rows - 1; j++) {
      for (i = 0; i < cols - 1; i++) {
        var a = field[j * cols + i];
        var b = field[j * cols + i + 1];
        var c = field[(j + 1) * cols + i + 1];
        var d = field[(j + 1) * cols + i];

        var lo = a < b ? a : b; if (c < lo) lo = c; if (d < lo) lo = d;
        var hi = a > b ? a : b; if (c > hi) hi = c; if (d > hi) hi = d;

        var nLo = Math.ceil(lo / spacing);
        var nHi = Math.floor(hi / spacing);
        if (nHi < nLo) continue;

        var x0 = i * step, y0 = j * step, x1 = x0 + step, y1 = y0 + step;

        for (n = nLo; n <= nHi; n++) {
          var L = n * spacing;
          var idx = (a > L ? 1 : 0) | (b > L ? 2 : 0) | (c > L ? 4 : 0) | (d > L ? 8 : 0);
          if (idx === 0 || idx === 15) continue;

          /* edge crossing points */
          var tT, tR, tB, tLf;
          var pTx, pRy, pBx, pLy;
          if (idx & 1 ? !(idx & 2) : !!(idx & 2)) { tT = (L - a) / (b - a); pTx = x0 + step * tT; }
          if (idx & 2 ? !(idx & 4) : !!(idx & 4)) { tR = (L - b) / (c - b); pRy = y0 + step * tR; }
          if (idx & 8 ? !(idx & 4) : !!(idx & 4)) { tB = (L - d) / (c - d); pBx = x0 + step * tB; }
          if (idx & 1 ? !(idx & 8) : !!(idx & 8)) { tLf = (L - a) / (d - a); pLy = y0 + step * tLf; }

          switch (idx) {
            case 1: case 14: ctx.moveTo(x0, pLy); ctx.lineTo(pTx, y0); break;
            case 2: case 13: ctx.moveTo(pTx, y0); ctx.lineTo(x1, pRy); break;
            case 3: case 12: ctx.moveTo(x0, pLy); ctx.lineTo(x1, pRy); break;
            case 4: case 11: ctx.moveTo(x1, pRy); ctx.lineTo(pBx, y1); break;
            case 6: case 9:  ctx.moveTo(pTx, y0); ctx.lineTo(pBx, y1); break;
            case 7: case 8:  ctx.moveTo(x0, pLy); ctx.lineTo(pBx, y1); break;
            case 5:
              ctx.moveTo(x0, pLy); ctx.lineTo(pTx, y0);
              ctx.moveTo(x1, pRy); ctx.lineTo(pBx, y1);
              break;
            case 10:
              ctx.moveTo(pTx, y0); ctx.lineTo(x1, pRy);
              ctx.moveTo(x0, pLy); ctx.lineTo(pBx, y1);
              break;
          }
        }
      }
    }
    ctx.stroke();
  }

  function init() {
    var canvas = document.querySelector('.wood-bg');
    if (canvas) {
      drawGrain(canvas);
      var t;
      var lastW = window.innerWidth;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          if (Math.abs(window.innerWidth - lastW) < 40 && canvas.width) return;
          lastW = window.innerWidth;
          drawGrain(canvas);
        }, 220);
      });

      if (!reduce) {
        var ticking = false;
        var drift = function () {
          var y = window.scrollY || window.pageYOffset || 0;
          canvas.style.transform = 'translate3d(0,' + (-y * 0.14).toFixed(1) + 'px,0)';
          ticking = false;
        };
        window.addEventListener('scroll', function () {
          if (!ticking) { window.requestAnimationFrame(drift); ticking = true; }
        }, { passive: true });
        drift();
      }
    }

    /* scroll reveal */
    var reveals = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(reveals, function (el) { el.classList.add('in-view'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
