#!/bin/bash
# Pubblica lo stato corrente di main sul branch rel (GitHub Pages),
# rimuovendo i file non necessari all'app pubblicata (docs/, README.md, CLAUDE.md).
set -euo pipefail

FILE_DA_ESCLUDERE=(docs README.md CLAUDE.md)

git rev-parse --abbrev-ref HEAD | grep -qx main && ORIG_BRANCH=main || ORIG_BRANCH=$(git rev-parse --abbrev-ref HEAD)

git checkout main
git checkout rel
git merge --no-ff --no-edit main
git rm -rf --ignore-unmatch "${FILE_DA_ESCLUDERE[@]}"
if ! git diff --cached --quiet; then
  git commit -m "Pulizia file non necessari alla pubblicazione"
fi
git push origin rel
git checkout "$ORIG_BRANCH"

echo "Pubblicato su rel e pushato."
