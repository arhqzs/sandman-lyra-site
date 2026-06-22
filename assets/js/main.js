/* ============================================================
   SANDMAN LYRA — site behaviour
   Small, dependency-free. Powers the starfield, the mobile
   menu, scroll reveals and the footer year.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Footer year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Mobile menu ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.innerHTML = open ? "&times;" : "&#9776;";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = "&#9776;";
      });
    });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Starfield (hero) ---- */
  var canvas = document.getElementById("starfield");
  if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(160, Math.floor((W * H) / 6500));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.3 + 0.2,
          base: Math.random() * 0.5 + 0.2,
          amp: Math.random() * 0.5,
          speed: Math.random() * 0.02 + 0.004,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.phase += s.speed;
        var a = s.base + Math.sin(s.phase) * s.amp;
        if (a < 0) a = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(236, 233, 225, " + a.toFixed(3) + ")";
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t); t = setTimeout(resize, 150);
    });
  }
})();
