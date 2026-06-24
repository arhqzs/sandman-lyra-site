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
systemctl restart sandman-studio

echo "== [4/4] Checking the engine =="
sleep 2
curl -fsS http://127.0.0.1:3000/api/health || echo "(engine not responding — check: systemctl status sandman-studio)"
echo ""
echo ""
echo "== DONE!  ✦ =="
echo "The Studio now has a 'Where should this go?' picker."
echo "Pick a section → Publish → it appears on that section's page."
