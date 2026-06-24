#!/usr/bin/env bash
# ============================================================
# Sandman Lyra — lock the Studio behind a username + password.
# Uses nginx HTTP Basic Auth. The password is typed here on the
# server (never stored in this script or anywhere public).
# Safe: backs up the working config and restores it if the new
# one fails, so the live site can't break.
# ============================================================
set -e
export DEBIAN_FRONTEND=noninteractive
HT="/etc/nginx/.sandman_studio"
BK="/root/nginx-sandman-backup"

echo ""
echo "########  LOCK THE STUDIO BEHIND A LOGIN  ########"
echo ""
echo "== Installing the password tool =="
apt-get update -y >/dev/null 2>&1 || true
apt-get install -y apache2-utils >/dev/null

echo ""
echo "Set your Studio login (these stay on YOUR server — not shared with anyone):"
read -rp "  Choose a USERNAME: " SLUSER
echo "  Now a PASSWORD (you'll type it twice; it won't show on screen):"
htpasswd -c "$HT" "$SLUSER"
chmod 640 "$HT"; chown root:www-data "$HT"

echo ""
echo "== Writing the login rule + web server config =="
mkdir -p /etc/nginx/snippets
cat > /etc/nginx/snippets/studio-auth.conf << 'SNIP'
auth_basic "Sandman Lyra Studio - private";
auth_basic_user_file /etc/nginx/.sandman_studio;
SNIP

mkdir -p "$BK"
cp -f /etc/nginx/sites-available/sandmanlyra "$BK"/sandmanlyra 2>/dev/null || true
cp -f /etc/nginx/sites-available/sandmanlyra-net "$BK"/sandmanlyra-net 2>/dev/null || true
cp -f /etc/nginx/sites-available/sandmanlyra-org "$BK"/sandmanlyra-org 2>/dev/null || true

# --- sandmanlyra.com (+ www, default) : main site; /studio.html locked ---
cat > /etc/nginx/sites-available/sandmanlyra << 'NGINX'
server { listen 80 default_server; listen [::]:80 default_server;
  server_name sandmanlyra.com www.sandmanlyra.com _;
  return 301 https://$host$request_uri; }
server {
  listen 443 ssl default_server; listen [::]:443 ssl default_server;
  server_name sandmanlyra.com www.sandmanlyra.com _;
  ssl_certificate /etc/letsencrypt/live/sandmanlyra.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sandmanlyra.com/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  root /var/www/sandmanlyra; index index.html;
  location = /studio.html { include snippets/studio-auth.conf; try_files $uri =404; }
  location / { try_files $uri $uri/ =404; }
  error_page 404 /404.html;
}
NGINX

# --- sandmanlyra.net : the Studio; ENTIRE site behind login ---
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
  root /var/www/sandmanlyra; index studio.html;
  location / { include snippets/studio-auth.conf; try_files $uri $uri/ =404; }
  error_page 404 /404.html;
}
NGINX

# --- sandmanlyra.org : Contact; /studio.html locked ---
cat > /etc/nginx/sites-available/sandmanlyra-org << 'NGINX'
server { listen 80; listen [::]:80; server_name sandmanlyra.org;
  return 301 https://$host$request_uri; }
server {
  listen 443 ssl; listen [::]:443 ssl;
  server_name sandmanlyra.org;
  ssl_certificate /etc/letsencrypt/live/sandmanlyra.net/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sandmanlyra.net/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  root /var/www/sandmanlyra; index contact.html;
  location = /studio.html { include snippets/studio-auth.conf; try_files $uri =404; }
  location / { try_files $uri $uri/ =404; }
  error_page 404 /404.html;
}
NGINX

ln -sf /etc/nginx/sites-available/sandmanlyra /etc/nginx/sites-enabled/sandmanlyra
ln -sf /etc/nginx/sites-available/sandmanlyra-net /etc/nginx/sites-enabled/sandmanlyra-net
ln -sf /etc/nginx/sites-available/sandmanlyra-org /etc/nginx/sites-enabled/sandmanlyra-org
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "== Testing the new configuration =="
if nginx -t; then
  systemctl reload nginx
  echo ""
  echo "== DONE!  the Studio is now locked.  =="
  echo "  https://sandmanlyra.net  now asks for a username + password."
  echo "  Username you chose: $SLUSER"
  echo "  (Your .com and .org are unaffected.)"
else
  echo ""
  echo "!! Config test FAILED — restoring the previous working setup (site stays up)."
  cp -f "$BK"/sandmanlyra /etc/nginx/sites-available/sandmanlyra 2>/dev/null || true
  cp -f "$BK"/sandmanlyra-net /etc/nginx/sites-available/sandmanlyra-net 2>/dev/null || true
  cp -f "$BK"/sandmanlyra-org /etc/nginx/sites-available/sandmanlyra-org 2>/dev/null || true
  nginx -t && systemctl reload nginx
  echo "Restored. Copy the error above and send it to Claude."
  exit 1
fi
