/* ============================================================
   SANDMAN LIVE — feed renderer
   Builds the travelling feed from window.SANDMAN_LIVE:
   chronological cards, category filters, per-post sharing.
   No build step, no backend — pure browser.
   ============================================================ */
(function () {
  "use strict";

  var DATA = (window.SANDMAN_LIVE || []).slice();
  var feed = document.getElementById("feed");
  var bar = document.getElementById("filter-bar");
  if (!feed) return;

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  // preferred display order for category chips
  var ORDER = ["World Cup","Betting","Backgammon","Boxing","Art","Philosophy","Friends","Travel"];

  function fmtDate(s) {
    var p = String(s || "").split("-");
    if (p.length !== 3) return s || "";
    return parseInt(p[2], 10) + " " + (MONTHS[parseInt(p[1], 10) - 1] || "") + " " + p[0];
  }

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // newest first
  DATA.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });

  // ---- media block ----
  function mediaHTML(post) {
    if (post.type === "video") {
      if (post.embed) return '<div class="post-media"><div class="embed"><iframe src="' + esc(post.embed) + '" title="' + esc(post.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></div>';
      if (post.video) return '<div class="post-media"><video controls preload="metadata" src="' + esc(post.video) + '"></video></div>';
      return placeholder("video");
    }
    if (post.type === "photo") {
      if (post.media) {
        return '<div class="post-media"><img loading="lazy" alt="' + esc(post.title) +
          '" src="' + esc(post.media) + '" onerror="this.parentNode.innerHTML=window.__livePH(\'photo\')"></div>';
      }
      return placeholder("photo");
    }
    return ""; // text post
  }

  function placeholder(kind) {
    var icon = kind === "video"
      ? '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
      : '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-4 4 3 3-2 6 5"/></svg>';
    return '<div class="post-media"><div class="ph">' + icon + '<small>' + (kind === "video" ? "Video coming" : "Photo coming") + '</small></div></div>';
  }
  // expose for img onerror fallback
  window.__livePH = function (kind) {
    return '<div class="ph"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-4 4 3 3-2 6 5"/></svg><small>Photo coming</small></div>';
  };

  function postHTML(post) {
    var url = location.origin + location.pathname + "#" + encodeURIComponent(post.id || "");
    var tags = (post.categories || []).map(function (c) {
      return '<button class="tag" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");

    return '' +
      '<article class="post" id="' + esc(post.id) + '" data-cats="' + esc((post.categories || []).join("|")) + '">' +
        '<div class="post-head">' +
          '<span class="post-date">' + esc(fmtDate(post.date)) + "</span>" +
          (post.location ? '<span class="post-loc">' + esc(post.location) + "</span>" : "") +
        "</div>" +
        mediaHTML(post) +
        '<div class="post-body">' +
          (post.title ? '<h2 class="post-title">' + esc(post.title) + "</h2>" : "") +
          (post.caption ? '<p class="post-caption">' + esc(post.caption) + "</p>" : "") +
          '<div class="post-foot">' +
            '<div class="post-tags">' + tags + "</div>" +
            '<div class="share-wrap">' +
              '<button class="share-btn" type="button" aria-label="Share this post">' +
                '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> Share' +
              "</button>" +
              '<div class="share-menu" data-url="' + esc(url) + '" data-title="' + esc(post.title) + '">' +
                '<a target="_blank" rel="noopener" data-net="wa">WhatsApp</a>' +
                '<a target="_blank" rel="noopener" data-net="x">X / Twitter</a>' +
                '<a target="_blank" rel="noopener" data-net="fb">Facebook</a>' +
                '<button type="button" data-net="copy">Copy link</button>' +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</article>";
  }

  // ---- filters ----
  var present = {};
  DATA.forEach(function (p) { (p.categories || []).forEach(function (c) { present[c] = true; }); });
  var cats = ORDER.filter(function (c) { return present[c]; });
  var active = "All";

  function renderBar() {
    if (!bar) return;
    var btns = ['<button class="filter-btn' + (active === "All" ? " active" : "") + '" data-cat="All">All</button>'];
    cats.forEach(function (c) {
      btns.push('<button class="filter-btn' + (active === c ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>");
    });
    bar.innerHTML = btns.join("");
  }

  function renderFeed() {
    var list = active === "All" ? DATA : DATA.filter(function (p) {
      return (p.categories || []).indexOf(active) !== -1;
    });
    if (!list.length) { feed.innerHTML = '<p class="feed-empty">No posts in this category yet — check back from the road.</p>'; return; }
    feed.innerHTML = list.map(postHTML).join("");
  }

  function setActive(cat) { active = cat; renderBar(); renderFeed(); }

  // ---- events (delegated) ----
  document.addEventListener("click", function (e) {
    var fb = e.target.closest ? e.target.closest(".filter-btn") : null;
    if (fb) { setActive(fb.getAttribute("data-cat")); window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    var tag = e.target.closest ? e.target.closest(".post-tags .tag") : null;
    if (tag) { setActive(tag.getAttribute("data-cat")); window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    var sb = e.target.closest ? e.target.closest(".share-btn") : null;
    if (sb) {
      var menu = sb.parentNode.querySelector(".share-menu");
      var url = menu.getAttribute("data-url");
      var title = menu.getAttribute("data-title") || "Sandman Lyra";
      // native share sheet on phones — perfect from the road
      if (navigator.share) {
        navigator.share({ title: title, text: title, url: url }).catch(function () {});
        return;
      }
      document.querySelectorAll(".share-menu.open").forEach(function (m) { if (m !== menu) m.classList.remove("open"); });
      menu.classList.toggle("open");
      return;
    }

    var net = e.target.closest ? e.target.closest(".share-menu [data-net]") : null;
    if (net) {
      var m2 = net.closest(".share-menu");
      var u = m2.getAttribute("data-url");
      var t = m2.getAttribute("data-title") || "Sandman Lyra";
      var n = net.getAttribute("data-net");
      if (n === "copy") {
        if (navigator.clipboard) navigator.clipboard.writeText(u);
        net.textContent = "Copied ✓";
        setTimeout(function () { net.textContent = "Copy link"; }, 1600);
      } else {
        var href = n === "wa" ? "https://wa.me/?text=" + encodeURIComponent(t + " " + u)
          : n === "x" ? "https://twitter.com/intent/tweet?text=" + encodeURIComponent(t) + "&url=" + encodeURIComponent(u)
          : "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(u);
        net.setAttribute("href", href);
      }
      return;
    }

    // click outside → close menus
    document.querySelectorAll(".share-menu.open").forEach(function (m) { m.classList.remove("open"); });
  });

  renderBar();
  renderFeed();

  // deep link to a specific post
  if (location.hash.length > 1) {
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView();
  }
})();
