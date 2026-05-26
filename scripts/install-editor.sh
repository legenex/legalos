#!/usr/bin/env bash
# Install code-server (browser-based VS Code) on this server.
#
# Run ONCE as root on the Plesk server:
#   bash scripts/install-editor.sh
#
# After it finishes:
#   1. In Plesk, add a subdomain `editor.os.legenex.com` (or similar).
#      Document root doesn't matter — we override with a reverse proxy.
#   2. Set the subdomain's nginx additional directives (HTTP and HTTPS):
#        location / {
#          proxy_pass http://127.0.0.1:8080;
#          proxy_http_version 1.1;
#          proxy_set_header Host $host;
#          proxy_set_header Upgrade $http_upgrade;
#          proxy_set_header Connection upgrade;
#          proxy_set_header Accept-Encoding gzip;
#        }
#   3. Issue a Let's Encrypt cert for the subdomain via Plesk.
#   4. Send the teammate the URL + password printed at the end of this script.
#
# What this script does:
#   - Installs the code-server package via the official install script.
#   - Writes ~/.config/code-server/config.yaml with a strong password.
#   - Configures it to bind 127.0.0.1:8080 so only Plesk's nginx can reach it.
#   - Enables + starts the systemd service.
#   - Pre-opens the LegalOS project folder on every connection.
#   - Prints the generated password.

set -euo pipefail

PROJECT_PATH="/var/www/vhosts/legenex.com/mo.legenex.com"
CONFIG_DIR="$HOME/.config/code-server"
CONFIG_FILE="$CONFIG_DIR/config.yaml"
DEFAULT_FOLDER_FLAG_FILE="/etc/systemd/system/code-server@root.service.d/override.conf"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }

bold "==> Installing code-server (this is the official install script)"
if ! command -v code-server >/dev/null 2>&1; then
  curl -fsSL https://code-server.dev/install.sh | sh
  ok "code-server installed"
else
  ok "code-server already installed: $(code-server --version | head -n1)"
fi

bold "==> Generating config"
mkdir -p "$CONFIG_DIR"
if [ -f "$CONFIG_FILE" ] && grep -q '^password:' "$CONFIG_FILE"; then
  warn "Config already exists at $CONFIG_FILE — keeping existing password"
  PASSWORD="$(grep '^password:' "$CONFIG_FILE" | awk '{print $2}')"
else
  PASSWORD="$(openssl rand -base64 24 | tr -d '\n=' | tr '/+' '_-')"
  cat > "$CONFIG_FILE" <<EOF
bind-addr: 127.0.0.1:8080
auth: password
password: $PASSWORD
cert: false
EOF
  chmod 600 "$CONFIG_FILE"
  ok "Generated new password and wrote $CONFIG_FILE"
fi

bold "==> Forcing code-server to open the LegalOS project on launch"
mkdir -p "$(dirname "$DEFAULT_FOLDER_FLAG_FILE")"
cat > "$DEFAULT_FOLDER_FLAG_FILE" <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/code-server --config $CONFIG_FILE $PROJECT_PATH
EOF
systemctl daemon-reload
ok "Override installed: project will be open on every session"

bold "==> Enabling + starting code-server service"
systemctl enable --now code-server@root
sleep 2
if systemctl is-active --quiet code-server@root; then
  ok "code-server is running on 127.0.0.1:8080"
else
  warn "code-server didn't start — check 'journalctl -u code-server@root --no-pager | tail -n 40'"
  exit 1
fi

bold "==> Quick reachability check"
if curl -sSf -o /dev/null http://127.0.0.1:8080/; then
  ok "Localhost connection succeeded"
else
  warn "code-server didn't respond on 127.0.0.1:8080 — check service logs"
fi

echo ""
bold "================================================================="
bold "  code-server is running. Next steps in Plesk:"
bold "================================================================="
cat <<EOF

  1. Plesk -> Websites & Domains -> os.legenex.com -> Add Subdomain
     - Name: editor
     - Parent: os.legenex.com

  2. editor.os.legenex.com -> Apache & nginx Settings ->
     Additional nginx directives (paste in BOTH HTTP and HTTPS):

       location / {
         proxy_pass http://127.0.0.1:8080;
         proxy_http_version 1.1;
         proxy_set_header Host \$host;
         proxy_set_header Upgrade \$http_upgrade;
         proxy_set_header Connection upgrade;
         proxy_set_header Accept-Encoding gzip;
       }

  3. editor.os.legenex.com -> SSL/TLS Certificates ->
     Get free Let's Encrypt certificate for the subdomain.

  4. Send your teammate:
     - URL:      https://editor.os.legenex.com
     - Password: $PASSWORD

  They open the URL in any browser, paste the password, and they're
  editing the live project. Saves go live at https://os.legenex.com
  in ~2 seconds via the hot-reload pnpm dev that's already running.

  To change the password later:
     nano $CONFIG_FILE      # edit the 'password:' line
     systemctl restart code-server@root

  To see what code-server is doing:
     journalctl -u code-server@root -f

  To uninstall everything:
     systemctl disable --now code-server@root
     apt-get remove -y code-server
     rm -rf $CONFIG_DIR $DEFAULT_FOLDER_FLAG_FILE

EOF
