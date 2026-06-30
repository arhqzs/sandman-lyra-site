/* ============================================================
   SANDMAN LYRA — Predictions
   Reads the "predictions" posts from window.SANDMAN_POSTS and builds:
     #pred-stats   → the track record + ROI dashboard
     #pred-ledger  → the full ledger table (every logged pick)
     #pred-calls   → the write-ups (the reasoning behind each call)
   ROI is tracked in UNITS, the professional standard — no bankroll
   is ever revealed. Edit picks (incl. result) in the Studio.
   ============================================================ */
(function () {
  "use strict";
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function fmtDate(s, sh) {
    var p = String(s || "").split("-");
    if (p.length !== 3) return s || "";
    var mo = (sh ? SHORT : MONTHS)[parseInt(p[1], 10) - 1] || "";
    return parseInt(p[2], 10) + " " + mo + (sh ? " " + p[0].slice(2) : " " + p[0]);
  }
  function signU(n) { return (n > 0 ? "+" : "") + n.toFixed(2) + "u"; }
  function pl(n) { return n == null ? "neutral" : n > 0.0001 ? "pos" : n < -0.0001 ? "neg" : "neutral"; }
  function paras(text) {
    return String(text || "").trim().split(/\n{2,}/).map(function (blk) {
      return "<p>" + esc(blk).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  var ALL = (window.SANDMAN_POSTS || []).filter(function (p) { return p.section === "predictions"; })
    .slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });

  function isBet(p) { return !!(p.pick || p.odds != null || p.stake != null || (p.status && p.status !== "pending")); }
  var bets = ALL.filter(isBet);

  /* ---------- the maths ---------- */
  var won = 0, lost = 0, voids = 0, pending = 0, staked = 0, net = 0;
  bets.forEach(function (p) {
    var st = (p.status || "pending").toLowerCase();
    var stake = num(p.stake) || 0;
    var odds = num(p.odds);
    if (st === "won") { won++; staked += stake; net += odds != null ? stake * (odds - 1) : 0; }
    else if (st === "lost") { lost++; staked += stake; net += -stake; }
    else if (st === "void") { voids++; }
    else { pending++; }
  });
  var settled = won + lost;
  var winRate = settled ? Math.round((won / settled) * 100) : null;
  var roi = staked ? (net / staked) * 100 : null;

  /* ---------- dashboard ---------- */
  var stats = document.getElementById("pred-stats");
  if (stats) {
    function tile(big, label, cls) {
      return '<div class="stat"><span class="stat-num ' + (cls || "") + '">' + big + '</span><span class="stat-label">' + esc(label) + "</span></div>";
    }
    var html = "";
    html += tile(settled ? won + "<span>&ndash;</span>" + lost : "0<span>&ndash;</span>0", "Record (W–L)");
    html += tile(winRate == null ? "&mdash;" : winRate + "%", "Win rate");
    html += tile(roi == null ? "&mdash;" : (roi > 0 ? "+" : "") + roi.toFixed(1) + "%", "ROI", roi == null ? "" : pl(roi));
    html += tile((net >= 0 ? "+" : "") + net.toFixed(2) + "u", "Net (units)", pl(settled ? net : null));
    html += tile(String(pending), pending === 1 ? "Open pick" : "Open picks");
    stats.innerHTML = html;
  }

  /* ---------- ledger table ---------- */
  var ledger = document.getElementById("pred-ledger");
  if (ledger) {
    if (!bets.length) {
      ledger.innerHTML = '<p class="pred-empty">The ledger opens with the first logged pick. Add one in the Studio &mdash; the record and ROI update the moment it&rsquo;s settled.</p>';
    } else {
      var rows = bets.map(function (p) {
        var st = (p.status || "pending").toLowerCase();
        var stake = num(p.stake), odds = num(p.odds);
        var profit = st === "won" ? (odds != null ? stake * (odds - 1) : null)
          : st === "lost" ? -(stake || 0) : null;
        var label = { won: "Won", lost: "Lost", void: "Void", pending: "Pending" }[st] || "Pending";
        return "<tr>" +
          '<td class="lg-date">' + esc(fmtDate(p.date, true)) + "</td>" +
          '<td class="lg-event">' + (p.event ? esc(p.event) : "&mdash;") + (p.competition ? '<small>' + esc(p.competition) + "</small>" : "") + "</td>" +
          "<td>" + (p.pick ? esc(p.pick) : "&mdash;") + "</td>" +
          '<td class="lg-num">' + (odds != null ? odds.toFixed(2) : "&mdash;") + "</td>" +
          '<td class="lg-num">' + (stake != null ? stake.toFixed(2) + "u" : "&mdash;") + "</td>" +
          '<td><span class="res ' + st + '">' + label + "</span></td>" +
          '<td class="lg-num ' + pl(profit) + '">' + (profit == null ? "&mdash;" : signU(profit)) + "</td>" +
          "</tr>";
      }).join("");
      ledger.innerHTML = '<div class="ledger-wrap"><table class="ledger">' +
        "<thead><tr><th>Date</th><th>Event</th><th>Pick</th><th>Odds</th><th>Stake</th><th>Result</th><th>P/L</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table></div>";
    }
  }

  /* ---------- the calls (write-ups) ---------- */
  var calls = document.getElementById("pred-calls");
  if (calls) {
    if (!ALL.length) {
      calls.innerHTML = '<p class="pred-empty">No calls published yet &mdash; the first read drops here.</p>';
    } else {
      calls.innerHTML = ALL.map(function (p) {
        var st = (p.status || (isBet(p) ? "pending" : "")).toLowerCase();
        var label = { won: "Won", lost: "Lost", void: "Void", pending: "Pending" }[st] || "";
        var odds = num(p.odds), stake = num(p.stake);
        var line = [];
        if (p.pick) line.push('<b>Pick</b> ' + esc(p.pick));
        if (odds != null) line.push('<b>Odds</b> ' + odds.toFixed(2));
        if (stake != null) line.push('<b>Stake</b> ' + stake.toFixed(2) + "u");
        var url = location.origin + location.pathname + "#" + encodeURIComponent(p.id || "");
        return '<article class="pred" id="' + esc(p.id) + '">' +
          '<div class="pred-top">' +
            '<span class="post-date">' + esc(fmtDate(p.date)) + "</span>" +
            (label ? '<span class="res ' + st + '">' + label + "</span>" : "") +
          "</div>" +
          (p.title ? '<h2 class="pred-title">' + esc(p.title) + "</h2>" : "") +
          (p.event ? '<p class="pred-event">' + esc(p.event) + (p.competition ? ' <span>&middot; ' + esc(p.competition) + "</span>" : "") + "</p>" : "") +
          (line.length ? '<div class="pred-line">' + line.join('<span class="dot">&middot;</span>') + "</div>" : "") +
          (p.caption ? '<div class="pred-analysis">' + paras(p.caption) + "</div>" : "") +
          '<div class="pred-foot">' +
            '<button class="share-btn" type="button" data-url="' + esc(url) + '" data-title="' + esc(p.title || p.event || "Sandman Lyra — a call") + '">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> Share' +
            "</button>" +
          "</div>" +
        "</article>";
      }).join("");
    }
  }

  /* ---------- share (native sheet, else copy link) ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".pred-foot .share-btn") : null;
    if (!b) return;
    var url = b.getAttribute("data-url"), title = b.getAttribute("data-title") || "Sandman Lyra";
    if (navigator.share) { navigator.share({ title: title, text: title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url);
    var old = b.querySelector("svg") ? b.childNodes : null;
    b.classList.add("copied");
    var prev = b.getAttribute("data-label") || "";
    b.setAttribute("aria-label", "Link copied");
    var span = b.querySelector(".copied-tag");
    if (!span) { span = document.createElement("span"); span.className = "copied-tag"; b.appendChild(span); }
    span.textContent = " Copied ✓";
    setTimeout(function () { if (span) span.textContent = ""; b.classList.remove("copied"); }, 1600);
  });

  /* ---------- deep-link ---------- */
  if (location.hash.length > 1) {
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView();
  }
})();
