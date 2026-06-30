#!/usr/bin/env bash
# ============================================================
# Sandman Lyra — update to the section-aware Studio.
# Adds the "Where should this go?" picker and makes each
# section page show its own posts. Safe to re-run.
# ============================================================
set -e
RAW=https://raw.githubusercontent.com/arhqzs/sandman-lyra-site/main
WEBROOT=/var/www/sandmanlyra

echo ""
echo "########  UPDATE: SECTION-AWARE STUDIO  ########"
echo ""

echo "== [1/4] Migrating any existing posts to the new format =="
if [ -f "$WEBROOT/assets/data/live.json" ] && [ ! -f "$WEBROOT/assets/data/posts.json" ]; then
  node -e 'const fs=require("fs");const d="/var/www/sandmanlyra/assets/data";let a=[];try{a=JSON.parse(fs.readFileSync(d+"/live.json","utf8"))}catch(e){}a.forEach(function(x){if(!x.section)x.section="live";});fs.writeFileSync(d+"/posts.json",JSON.stringify(a,null,2));console.log("  migrated "+a.length+" existing posts");' || true
else
  echo "  (nothing to migrate)"
fi

echo "== [2/4] Updating site content =="
curl -fsSL "$RAW/deploy.sh" -o /tmp/sl-deploy.sh && sed -i 's/\r$//' /tmp/sl-deploy.sh && bash /tmp/sl-deploy.sh

echo "== [3/4] Updating the publishing engine =="
curl -fsSL "$RAW/studio-backend/server.js" -o /opt/sandman-studio/server.js
( cd /opt/sandman-studio && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1 || true )

echo "== Seeding the first prediction (only if none exist yet) =="
node <<'NODE' || true
const fs = require("fs");
const f = "/var/www/sandmanlyra/assets/data/posts.json";
let a = []; try { a = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) {}
if (!a.some(function (p) { return p.section === "predictions"; })) {
  a.unshift({
    id: "2026-06-29-predictions-brazil-japan", date: "2026-06-29", section: "predictions", type: "text",
    title: "Brazil to find a way through",
    caption: "The oracle got a bit confused yesterday and had to take a long sleep…\n\nNot exactly sure which timeline we are on right now, so this is just a small bet.\n\nBrazil are bad this year, but that is also why we are getting a good price. Japan are organized and dangerous, and I expect a lot of sharp money to come in on Japan before kickoff.\n\nStill, I think Brazil find a way through. FIFA definitely prefer Brazil in the next round, and these playoff games usually get tight. My read is a narrow Brazil win — most likely 2-1.\n\nAlso, if Brazil go ahead, we may want to look at live betting the unders. If they get the lead, I expect them to slow the game down, protect the result, and make Japan work very hard to open them up.",
    location: "", categories: ["World Cup", "Betting"],
    event: "Brazil vs Japan", competition: "World Cup 2026 · Playoff",
    pick: "Brazil to win — most likely 2–1", stake: 0.5, status: "pending"
  });
  fs.writeFileSync(f, JSON.stringify(a, null, 2));
  console.log("  seeded the Brazil vs Japan prediction");
} else { console.log("  predictions already present — leaving them untouched"); }
NODE

systemctl restart sandman-studio

echo "== [4/4] Checking the engine =="
sleep 2
curl -fsS http://127.0.0.1:3000/api/health || echo "(engine not responding — check: systemctl status sandman-studio)"
echo ""
echo ""
echo "== DONE!  ✦ =="
echo "New: a Predictions section with a track record + ROI ledger."
echo "In the Studio, pick 'Predictions', fill in the pick / odds / stake,"
echo "and set the result later to update the win rate and ROI automatically."
echo "See it at:  https://sandmanlyra.com/predictions.html"
