#!/usr/bin/env bash
# LegalOS team-member setup (macOS / Linux)
# Paste this one line into Terminal to set yourself up:
#   curl -fsSL https://mo.legenex.com/team-setup.sh | bash
#
# What it does:
#   1. Installs VS Code if you don't have it (via Homebrew on Mac).
#   2. Installs the Remote-SSH extension.
#   3. Adds an SSH host entry for our server.
#   4. Launches VS Code already connected to the server, with the project open.
#
# You'll be asked for the server password the first time VS Code connects.
# Get it from Morne via Signal / 1Password.

set -e

SERVER_IP="51.81.202.161"
PROJECT_PATH="/var/www/vhosts/legenex.com/mo.legenex.com"
HOST_ALIAS="legalos"

cyan()  { printf '\033[1;36m==> %s\033[0m\n' "$*"; }
ok()    { printf '\033[1;32m    %s\033[0m\n' "$*"; }
warn()  { printf '\033[1;33m    %s\033[0m\n' "$*"; }

echo ""
echo "LegalOS team setup"
echo "------------------"

OS="$(uname -s)"
case "$OS" in
  Darwin) ;;
  Linux)  ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Step 1: VS Code
cyan "Checking for VS Code..."
if ! command -v code >/dev/null 2>&1; then
  if [ "$OS" = "Darwin" ]; then
    if ! command -v brew >/dev/null 2>&1; then
      warn "Homebrew not found. Installing..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
    fi
    warn "Installing VS Code via Homebrew..."
    brew install --cask visual-studio-code
  else
    echo ""
    echo "Please install VS Code manually from https://code.visualstudio.com/"
    echo "Make sure the 'code' command is on PATH, then re-run this script."
    exit 1
  fi
  ok "VS Code installed."
else
  ok "Already installed."
fi

# Step 2: Remote-SSH extension
cyan "Installing Remote-SSH extension..."
code --install-extension ms-vscode-remote.remote-ssh --force >/dev/null 2>&1 || true
ok "Remote-SSH installed."

# Step 3: SSH config
cyan "Adding SSH host '$HOST_ALIAS' for $SERVER_IP..."
SSH_DIR="$HOME/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
SSH_CONFIG="$SSH_DIR/config"
touch "$SSH_CONFIG"
chmod 600 "$SSH_CONFIG"
if grep -qE "^Host[[:space:]]+$HOST_ALIAS\$" "$SSH_CONFIG"; then
  ok "Entry already exists."
else
  cat >> "$SSH_CONFIG" <<EOF

Host $HOST_ALIAS
    HostName $SERVER_IP
    User root
    Port 22
EOF
  ok "SSH config updated at $SSH_CONFIG"
fi

# Step 4: Launch VS Code, already connected, project open
cyan "Launching VS Code connected to the server..."
REMOTE_URI="vscode-remote://ssh-remote+$HOST_ALIAS$PROJECT_PATH"
code --folder-uri "$REMOTE_URI" >/dev/null 2>&1 &

echo ""
echo "Done."
echo ""
echo "VS Code is opening. When it asks for a password, paste the root password"
echo "Morne sent you. After it connects you're ready to edit."
echo ""
echo "Daily workflow:"
echo "  - Edit any file in the sidebar."
echo "  - Save (Cmd+S)."
echo "  - Watch https://mo.legenex.com update in ~2 seconds."
echo ""
echo "Read /var/www/vhosts/legenex.com/mo.legenex.com/ONBOARDING.md (in VS Code)"
echo "for daily-workflow details and what NOT to do."
