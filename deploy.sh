#!/usr/bin/env bash
# ============================================================
# Sandman Lyra — droplet deploy (pulls the site from GitHub).
# Reliable: does not depend on the owner's computer.
# Run again any time to update the live site to the latest.
# HTTPS is a separate step, after the domain points here.
# ============================================================
set -e
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

REPO_TARBALL="https://codeload.github.com/arhqzs/sandman-lyra-site/tar.gz/refs/heads/main"
WEBROOT="/var/www/sandmanlyra"
IP="167.71.50.28"

echo ""
echo "########  SANDMAN LYRA — DEPLOY  ########"
echo ""

echo "== [1/4] Ensuring web server, firewall & certbot =="
apt-get update -y
apt-get install -y nginx ufw certbot python3-certbot-nginx unattended-upgrades
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

echo "== [2/4] Downloading the site from GitHub =="
rm -rf /tmp/sl && mkdir -p /tmp/sl
curl -fsSL "$REPO_TARBALL" -o /tmp/sl/site.tar.gz
tar xzf /tmp/sl/site.tar.gz -C /tmp/sl
SRC="$(find /tmp/sl -maxdepth 1 -type d -name 'sandman-lyra-site-*' | head -1)"
mkdir -p "$WEBROOT"
rm -rf "${WEBROOT:?}/"*
cp -r "$SRC"/* "$WEBROOT"/
rm -f "$WEBROOT/deploy.sh" "$WEBROOT/README.md"
chown -R www-data:www-data "$WEBROOT"
rm -rf /tmp/sl

echo "== [3/4] Configuring the web server =="
cat > /etc/nginx/sites-available/sandmanlyra << 'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/sandmanlyra;
    index index.html;
    server_name sandmanlyra.com www.sandmanlyra.com _;
    location / { try_files $uri $uri/ =404; }
    error_page 404 /404.html;
}
NGINX
ln -sf /etc/nginx/sites-available/sandmanlyra /etc/nginx/sites-enabled/sandmanlyra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo ""
echo "== [4/4] DONE!  ✦ =="
echo "Your site is live on the server."
echo "Open this to see it:  http://$IP"
echo ""
