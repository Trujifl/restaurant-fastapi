#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

usage() { echo 'Uso: ./scripts/deploy.sh "Mensaje del commit"'; exit 0; }
[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && usage

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

git config user.name "Trujifl"
git config user.email "trujicrypto@gmail.com"

COMMIT_MSG="${1:-Actualización del proyecto}"

git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit -m "$COMMIT_MSG"
else
  echo "No hay cambios para commitear."
fi

git push -u origin main

ssh -t ubuntu@3.137.206.197 <<'SSHCMDS'
set -e
cd ~/restaurant-fastapi
git pull
sudo systemctl restart restaurant-api
echo -e "\n===== Estado del servicio ====="
sudo systemctl status restaurant-api --no-pager -l | sed -n '1,20p'
echo -e "\n===== Comprobando endpoint /api/health ====="
sleep 2
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/health || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ API está respondiendo correctamente (/api/health)${NC}"
else
  echo -e "${RED}❌ Error: API no respondió correctamente. Código HTTP: $HEALTH_RESPONSE${NC}"
fi
echo -e "\n===========================================\n"
SSHCMDS
