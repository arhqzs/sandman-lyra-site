#!/usr/bin/env bash
# ============================================================
# Sandman Lyra — install the Studio publishing engine.
# After this, logging into sandmanlyra.net and hitting Publish
# puts the post straight onto the Live feed at sandmanlyra.com.
# Safe: backs up the .net config and restores it if anything fails.
# Run AFTER the Studio login (lock-studio.sh) is in place.
# ============================================================
set -e
export DEBIAN_FRONTEND=noninteractive
APP=/opt/sandman-studio
WEBROOT=/var/www/sandmanlyra
RAW=https://raw.githubusercontent.com/arhqzs/sandman-lyra-site/main
BK=/root/nginx-sandman-backup

echo ""
echo "########  INSTALL THE STUDIO PUBLISHING ENGINE  ########"
echo ""

echo "== [1/6] Installing Node.js =="
apt-get update -y
apt-get install -y nodejs npm

echo "== [2/6] Fetching the publishing engine =="
mkdir -p "$APP"
curl -fsSL "$RAW/studio-backend/server.js" -o "$APP/server.js"
curl -fsSL "$RAW/studio-backend/package.json" -o "$APP/package.json"
( cd "$APP" && npm install --omit=dev --no-audit --no-fund )

echo "== [3/6] Seeding the feed data (only if missing) =="
mkdir -p "$WEBROOT/assets/data" "$WEBROOT/assets/images/live"
if [ ! -f "$WEBROOT/assets/data/posts.json" ]; then
  curl -fsSL "$RAW/assets/data/posts.json" -o "$WEBROOT/assets/data/posts.json"
fi
chown -R www-data:www-data "$WEBROOT/assets/data" "$WEBROOT/assets/images"

echo "== [4/6] Creating the background service =="
cat > /etc/systemd/system/sandman-studio.service << 'UNIT'
[Unit]
Description=Sandman Lyra Studio publishing engine
After=network.target

[Service]
Environment=WEBROOT=/var/www/sandmanlyra
Environment=PORT=3000
WorkingDirectory=/opt/sandman-studio
ExecStart=/usr/bin/node /opt/sandman-studio/server.js
Restart=always
RestartSec=3
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable sandman-studio >/dev/null 2>&1 || true
systemctl restart sandman-studio

echo "== [5/6] Connecting the Studio form to the engine (nginx) =="
mkdir -p "$BK"; cp -f /etc/nginx/sites-available/sandmanlyra-net "$BK"/sandmanlyra-net.pre-engine 2>/dev/null || true
cat > /etc/nginx/sites-available/sandmanlyra-net << 'NGINX'
server { listen 80; listen [::]:80; server_name sandmanlyra.net;
  return 301 https://$host$request_uri; }
server {
  listen 443 ssl; listen [::]:443 ssl;
  server_name sandmanlyra.net;
  ssl_certificate /etc/letsencrypt/live/sandmanlyra.net/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sandmanlyra.net/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  root /var/www/sandmanlyra;
  index studio.html;
  client_max_body_size 80m;

  location /api/ {
    include snippets/studio-auth.conf;
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 120s;
  }
  location / {
    include snippets/studio-auth.conf;
    try_files $uri $uri/ =404;
  }
  error_page 404 /404.html;
}
NGINX

if nginx -t; then
  systemctl reload nginx
else
  echo "!! nginx test FAILED — restoring previous .net config (site stays up)."
  cp -f "$BK"/sandmanlyra-net.pre-engine /etc/nginx/sites-available/sandmanlyra-net 2>/dev/null || true
  nginx -t && systemctl reload nginx
  echo "Restored. Send the error above to Claude."
  exit 1
fi

echo "== [6/6] Checking the engine =="
sleep 2
if curl -fsS http://127.0.0.1:3000/api/health; then
  echo ""
  echo ""
  echo "== DONE!  ✦ =="
  echo "Log in at https://sandmanlyra.net → write/upload → Publish."
  echo "Posts appear automatically on https://sandmanlyra.com/live.html"
else
  echo ""
  echo "Engine not responding yet. Check: systemctl status sandman-studio"
fi
