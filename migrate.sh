#!/usr/bin/env bash
set -eu

# ---- Prompt for input ----
read -rp "Enter your GitHub username: " GH_USER
read -rp "Enter your GitHub repo name: " GH_REPO

OLD_OWNER="wcygan"
OLD_REPO="mini-dotfiles"
OLD_COMBO="${OLD_OWNER}/${OLD_REPO}"
NEW_COMBO="${GH_USER}/${GH_REPO}"

echo "Replacing references..."
# Replace combo string (wcygan/mini-dotfiles)
grep -rl "$OLD_COMBO" . \
  --exclude-dir=".git" \
  --exclude="$(basename "$0")" \
  | xargs sed -i.bak "s|$OLD_COMBO|$NEW_COMBO|g"

# Replace owner only (wcygan → new user)
grep -rl "$OLD_OWNER" . \
  --exclude-dir=".git" \
  --exclude="$(basename "$0")" \
  | xargs sed -i.bak "s|$OLD_OWNER|$GH_USER|g"

# Replace repo name only (mini-dotfiles → new repo)
grep -rl "$OLD_REPO" . \
  --exclude-dir=".git" \
  --exclude="$(basename "$0")" \
  | xargs sed -i.bak "s|$OLD_REPO|$GH_REPO|g"

# ---- Cleanup backup files ----
find . -name "*.bak" -delete

# ---- Self-destruct ----
echo "Migration complete. Removing migration script..."
rm -- "$0"

echo "✅ Done. All references updated and migration script removed."
