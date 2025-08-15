#!/usr/bin/env bash
set -euo pipefail

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
sudo systemctl status restaurant-api --no-pager -l | sed -n '1,20p'
SSHCMDS
