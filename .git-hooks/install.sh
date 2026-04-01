#!/bin/sh
# .git-hooks/install.sh
#
# Symlinks the tracked hooks in .git-hooks/ into .git/hooks/ so git picks them up.
# Run once after cloning: sh .git-hooks/install.sh
#
# Why symlinks: .git/hooks/ is not tracked by git. Storing hooks in .git-hooks/
# keeps them in the repo and version-controlled. The symlink is the bridge.

set -e

# Resolve repo root (one level up from this script's directory)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_SRC="$REPO_ROOT/.git-hooks"
HOOKS_DST="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOKS_DST" ]; then
  echo "Error: $HOOKS_DST does not exist. Are you in a git repository?" >&2
  exit 1
fi

# Install commit-msg hook
ln -sf "$HOOKS_SRC/commit-msg" "$HOOKS_DST/commit-msg"
chmod +x "$HOOKS_SRC/commit-msg"
echo "Installed: .git/hooks/commit-msg -> .git-hooks/commit-msg"

echo "Done. Git hooks are active."
