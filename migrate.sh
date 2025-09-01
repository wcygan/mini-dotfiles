#!/usr/bin/env bash
set -eu

# ---- Prompt for input ----
read -rp "Enter your GitHub username: " GH_USER
read -rp "Enter your GitHub repo name: " GH_REPO

OLD="wcygan/mini-dotfiles"
NEW="${GH_USER}/${GH_REPO}"

echo "Replacing all occurrences of '${OLD}' with '${NEW}'..."

# ---- Replace references across the repo ----
# Exclude .git folder and the migration script itself
grep -rl "$OLD" . \
  --exclude-dir=".git" \
  --exclude="$(basename "$0")" \
  | xargs sed -i.bak "s|$OLD|$NEW|g"

# ---- Cleanup backup files ----
find . -name "*.bak" -delete

# ---- Self-destruct ----
echo "Migration complete. Removing migration script..."
rm -- "$0"

echo "✅ Done. All references updated and migration script removed."
