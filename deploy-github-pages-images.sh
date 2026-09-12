#!/usr/bin/env bash
set -euo pipefail

# GitHub Pages deploy script for a static site.
#
# Usage:
#   ./deploy-github-pages.sh <site_dir> <repo_name> [public|private]
#
# Examples:
#   ./deploy-github-pages.sh ./cat-genetics-web-v2 cat-genetics-game public
#   ./deploy-github-pages.sh . my-static-site public
#
# Requirements:
#   - git
#   - gh (GitHub CLI) recommended for automatic repository creation and Pages setup
#
# Notes:
#   - GitHub Pages on GitHub Free requires a public repository.
#   - This script publishes from the "main" branch root directory.
#   - If the repository already exists, files are committed and pushed to it.

SITE_DIR="${1:-}"
REPO_NAME="${2:-}"
VISIBILITY="${3:-public}"

if [[ -z "$SITE_DIR" || -z "$REPO_NAME" ]]; then
  echo "Usage: $0 <site_dir> <repo_name> [public|private]"
  exit 1
fi

if [[ ! -d "$SITE_DIR" ]]; then
  echo "Error: directory not found: $SITE_DIR"
  exit 1
fi

if [[ "$VISIBILITY" != "public" && "$VISIBILITY" != "private" ]]; then
  echo "Error: visibility must be 'public' or 'private'"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is required."
  exit 1
fi

SITE_DIR="$(cd "$SITE_DIR" && pwd)"

echo "Site directory: $SITE_DIR"
echo "Repository:     $REPO_NAME"
echo "Visibility:     $VISIBILITY"

cd "$SITE_DIR"

IMAGE_PATH="images/Sabatora0843.png"

if [[ ! -f "$IMAGE_PATH" ]]; then
  echo "Error: image was not found: $SITE_DIR/$IMAGE_PATH"
  exit 1
fi

cat > index.html <<'EOF'
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sabatora0843.png</title>
  <style>
    html, body {
      margin: 0;
      min-height: 100%;
      background: #f5f5f5;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      display: grid;
      place-items: center;
      padding: 24px;
      box-sizing: border-box;
    }
    main {
      display: grid;
      gap: 20px;
      justify-items: center;
    }
    .preview {
      max-width: min(90vw, 1024px);
      max-height: 75vh;
      object-fit: contain;
      background-image:
        linear-gradient(45deg, #ddd 25%, transparent 25%),
        linear-gradient(-45deg, #ddd 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ddd 75%),
        linear-gradient(-45deg, transparent 75%, #ddd 75%);
      background-size: 24px 24px;
      background-position: 0 0, 0 12px, 12px -12px, -12px 0;
      box-shadow: 0 2px 12px rgba(0,0,0,.12);
    }
    a {
      display: inline-block;
      padding: 10px 16px;
      border: 1px solid #222;
      border-radius: 8px;
      color: #111;
      background: #fff;
      text-decoration: none;
    }
    a:hover {
      background: #eee;
    }
  </style>
</head>
<body>
  <main>
    <img class="preview" src="images/Sabatora0843.png" alt="Sabatora0843.png preview">
    <a href="images/Sabatora0843.png" download="Sabatora0843.png">Download PNG</a>
  </main>
</body>
</html>
EOF

# Initialize git repository if needed.
if [[ ! -d ".git" ]]; then
  echo "Initializing git repository..."
  git init
  git branch -M main
else
  current_branch="$(git branch --show-current || true)"
  if [[ "$current_branch" != "main" ]]; then
    git branch -M main
  fi
fi

# Add a .nojekyll file so GitHub Pages serves files as-is.
touch .nojekyll

git add .

if git diff --cached --quiet; then
  echo "No file changes to commit."
else
  git commit -m "Deploy site to GitHub Pages"
fi

if command -v gh >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub CLI is installed but not authenticated."
    echo "Run:"
    echo "  gh auth login"
    exit 1
  fi

  OWNER="$(gh api user --jq .login)"
  FULL_REPO="${OWNER}/${REPO_NAME}"

  if gh repo view "$FULL_REPO" >/dev/null 2>&1; then
    echo "Using existing GitHub repository: $FULL_REPO"

    if ! git remote get-url origin >/dev/null 2>&1; then
      git remote add origin "https://github.com/${FULL_REPO}.git"
    fi
  else
    echo "Creating GitHub repository: $FULL_REPO"
    gh repo create "$REPO_NAME" \
      "--${VISIBILITY}" \
      --source=. \
      --remote=origin
  fi

  echo "Pushing main branch..."
  git push -u origin main

  echo "Configuring GitHub Pages..."
  # GitHub Pages API: build from main branch / root.
  # Create if absent, otherwise update.
  if gh api "repos/${FULL_REPO}/pages" >/dev/null 2>&1; then
    gh api \
      --method PUT \
      -H "Accept: application/vnd.github+json" \
      "repos/${FULL_REPO}/pages" \
      -f "source[branch]=main" \
      -f "source[path]=/" \
      >/dev/null
  else
    gh api \
      --method POST \
      -H "Accept: application/vnd.github+json" \
      "repos/${FULL_REPO}/pages" \
      -f "source[branch]=main" \
      -f "source[path]=/" \
      >/dev/null
  fi

  echo
  echo "Deploy complete."
  echo "Repository:"
  echo "  https://github.com/${FULL_REPO}"
  echo
  echo "GitHub Pages:"
  echo "  https://${OWNER}.github.io/${REPO_NAME}/"
else
  echo
  echo "GitHub CLI (gh) was not found."
  echo "The local git repository is ready, but automatic GitHub repository creation"
  echo "and Pages configuration cannot be performed."
  echo
  echo "Install GitHub CLI on macOS:"
  echo "  brew install gh"
  echo "  gh auth login"
  echo
  echo "Then run this script again."
  exit 1
fi
