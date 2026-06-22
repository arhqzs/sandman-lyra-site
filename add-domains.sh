#!/usr/bin/env bash
# ============================================================
# Sandman Lyra — host .net (Studio) and .org (Contact) on the droplet.
# Each gets its own front door + its own HTTPS certificate.
# Leaves the live sandmanlyra.com config completely untouched.
# Run this AFTER pointing .net and .org DNS at this server.
# ============================================================
set -e
export DEBIAN_FRONTEND=noninteractive
EMAIL="twitchkosha@gmail.com"

echo ""
echo "########  ADD .net (Studio) + .org (Contact)  ########"
echo ""

echo "== [1/3] Writing the two server blocks =="
cat > /etc/nginx/sites-available/sandmanlyra-net << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name sandmanlyra.net;
    root /var/www/sandmanlyra;
    index studio.html;
    location / { try_files $uri $uri/ =404; }
    error_page 404 /404.html;
}
NGINX

cat > /etc/nginx/sites-available/sandmanlyra-org << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name sandmanlyra.org;
    root /var/www/sandmanlyra;
    index contact.html;
    location / { try_files $uri $uri/ =404; }
    error_page 404 /404.html;
}
NGINX

ln -sf /etc/nginx/sites-available/sandmanlyra-net /etc/nginx/sites-enabled/sandmanlyra-net
ln -sf /etc/nginx/sites-available/sandmanlyra-org /etc/nginx/sites-enabled/sandmanlyra-org

echo "== [2/3] Testing & reloading nginx =="
nginx -t
systemctl reload nginx

echo "== [3/3] Getting HTTPS for .net and .org =="
certbot --nginx --non-interactive --agree-tos -m "$EMAIL" --redirect \
  -d sandmanlyra.net -d sandmanlyra.org

echo ""
echo "== DONE!  ✦ =="
echo "  https://sandmanlyra.net  ->  Studio (admin)"
echo "  https://sandmanlyra.org  ->  Contact"
echo ""
