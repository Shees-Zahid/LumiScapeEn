#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────
# Fill in your Hostinger SSH credentials (hPanel → Advanced → SSH Access)
SSH_USER="${SSH_USER:-u984955358}"
SSH_HOST="${SSH_HOST:-212.85.28.190}"
SSH_PORT="${SSH_PORT:-65002}"
REMOTE_DIR="domains/lumiscapeen.businesssupporttech.com/public_html"
# ──────────────────────────────────────────────────────────────────

REMOTE="${SSH_USER}@${SSH_HOST}"
REMOTE_PATH="~/${REMOTE_DIR}"

echo "=== LumiScapeEn → Hostinger Deploy ==="
echo "Target: ${REMOTE}:${REMOTE_PATH} (port ${SSH_PORT})"
echo ""

# 1. Build frontend locally
echo "[1/4] Building frontend..."
npm run build

# 2. Upload project files (excludes node_modules, .env, .git)
echo "[2/4] Uploading files to server..."
scp -P "$SSH_PORT" -r \
  dist \
  backend \
  package.json \
  package-lock.json \
  .env.production \
  dummyData.js \
  "${REMOTE}:${REMOTE_PATH}/"

# 3. Install backend dependencies on server
echo "[3/4] Installing backend dependencies on server..."
ssh -p "$SSH_PORT" "$REMOTE" "export PATH=/opt/alt/alt-nodejs20/root/usr/bin:\$PATH && cd ${REMOTE_PATH}/backend && npm install --production"

# 4. Remind about .env
echo ""
echo "[4/4] Done uploading!"
echo ""
echo "=== NEXT STEPS ==="
echo "1. SSH into the server and create backend/.env if not done yet:"
echo "   ssh -p ${SSH_PORT} ${REMOTE}"
echo "   cd ${REMOTE_PATH}/backend"
echo "   nano .env   (paste values from backend/.env.example)"
echo ""
echo "2. In hPanel → Advanced → Node.js → Restart the application"
echo ""
echo "3. Visit https://lumiscapeen.businesssupporttech.com"
echo "   and   https://lumiscapeen.businesssupporttech.com/api/health"
