#!/bin/bash
# semantic-release.sh - Automated semantic versioning and changelog generation
set -e

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No changes will be made"
fi

# Determine version bump from commit messages
echo "📋 Analyzing commit messages..."
COMMITS=$(git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD")..HEAD)
BUMP="patch"

if echo "$COMMITS" | grep -q "BREAKING CHANGE"; then
  BUMP="major"
  echo "💥 Breaking changes detected - major version bump"
elif echo "$COMMITS" | grep -qE "(feat|feature):"; then
  BUMP="minor"
  echo "✨ New features detected - minor version bump"
else
  echo "🐛 Bug fixes only - patch version bump"
fi

# Get current version
OLD_VERSION=$(bun pm pkg get version | tr -d '"')
echo "📦 Current version: v$OLD_VERSION"

if [[ "$DRY_RUN" == "true" ]]; then
    echo "🎭 Would bump $BUMP version: v$OLD_VERSION → v$(echo $OLD_VERSION | awk -F. '{if ("'"$BUMP"'" == "major") {$1+=1; $2=0; $3=0} else if ("'"$BUMP"'" == "minor") {$2+=1; $3=0} else {$3+=1}} {print $1"."$2"."$3}')"

    echo "📝 Would generate changelog with commits:"
    echo "$COMMITS" | head -5
    echo "..."

    echo "✅ Dry run complete - no changes made"
    exit 0
fi

# Bump version
echo "🚀 Bumping $BUMP version..."
bun pm version "$BUMP" -m "chore(release): v%s"

# Get new version
NEW_VERSION=$(bun pm pkg get version | tr -d '"')

# Generate changelog
echo "📝 Generating changelog..."
echo "## v$NEW_VERSION ($(date +%Y-%m-%d))" > CHANGELOG.md
echo "" >> CHANGELOG.md
echo "### Changes" >> CHANGELOG.md
echo "$COMMITS" | sed 's/^/- /' >> CHANGELOG.md
echo "" >> CHANGELOG.md

# Append existing changelog if it exists
if [[ -f CHANGELOG.md.bak ]]; then
    cat CHANGELOG.md.bak >> CHANGELOG.md
fi

echo "✅ Released v$OLD_VERSION → v$NEW_VERSION"
echo "📋 Changelog updated in CHANGELOG.md"