# Version Management Guide

This guide explains the pre-release versioning workflow for the Windsurf project using Bun's package manager.

## Pre-Release Version Cycle

### Starting a Pre-Release Cycle

```bash
# Start alpha pre-release cycle
bun run version:alpha
# 1.0.0 → 1.0.1-alpha.0

# Promote alpha to beta
bun run version:beta
# 1.0.1-alpha.0 → 1.0.1-beta.0

# Promote beta to release candidate
bun run version:rc
# 1.0.1-beta.0 → 1.0.1-rc.0

# Promote release candidate to stable release
bun run version:patch
# 1.0.1-rc.0 → 1.0.1
```

### Version Types

- **alpha**: Early testing phase, unstable features
- **beta**: Feature-complete, stability testing
- **rc** (release candidate): Final testing before release
- **nightly**: Continuous integration builds

### Standard Version Bumps

```bash
# Patch version (1.0.0 → 1.0.1)
bun run version:patch

# Minor version (1.0.0 → 1.1.0)
bun run version:minor

# Major version (1.0.0 → 2.0.0)
bun run version:major
```

## Version Format

Versions follow [Semantic Versioning](https://semver.org/) with pre-release identifiers:

```
<major>.<minor>.<patch>[-<pre-release>][+<build>]
```

Examples:
- `1.0.0` - Stable release
- `1.0.1-alpha.0` - First alpha pre-release
- `1.0.1-beta.2` - Second beta pre-release
- `1.0.1-rc.1` - First release candidate
- `1.1.0-nightly.20231201` - Nightly build

## Workflow Recommendations

### Feature Development
1. Start with alpha releases for new features
2. Move to beta when feature is complete
3. Use RC for final stabilization
4. Release stable version

### Hotfixes
- Use patch versions for bug fixes
- Skip pre-release cycle for critical fixes

### Nightly Builds
- Use nightly pre-releases for CI/CD
- Include build metadata (date/timestamp)

## Publishing

After versioning, publish to your registry:

```bash
# Publish pre-release
bun publish --tag alpha  # for alpha versions
bun publish --tag beta   # for beta versions
bun publish --tag rc     # for release candidates

# Publish stable release
bun publish
```

## Best Practices

1. **Test thoroughly** before promoting pre-releases
2. **Document breaking changes** in major versions
3. **Use descriptive commit messages** for version bumps
4. **Tag releases** in git for traceability
5. **Communicate** pre-release status to users

## Automated Semantic Release

The project includes an automated semantic release system with both local scripts and CI/CD integration.

### Local Usage

```bash
# Perform automated release
bun run release

# Preview what would happen (dry run)
bun run release:preview
```

### CI/CD Integration

The project includes a GitHub Actions workflow (`.github/workflows/semantic-release.yml`) that:

- **Automatically triggers** on pushes to main/master
- **Analyzes commits** to determine version bump type
- **Updates version** and generates changelog
- **Creates git tags** and GitHub releases
- **Manual trigger** available via GitHub UI

#### Workflow Features

- **Smart version bumping** based on conventional commits
- **Automated changelog** generation
- **Git tag creation** for each release
- **GitHub release** with release notes
- **Test validation** before release

#### Manual Release

You can also trigger releases manually via GitHub Actions:

1. Go to **Actions** tab in GitHub
2. Select **Semantic Release** workflow
3. Click **Run workflow**
4. Choose release type: `auto`, `patch`, `minor`, or `major`

### How It Works

The script analyzes commits since the last tag and determines the version bump:

- **MAJOR**: Commits containing `BREAKING CHANGE`
- **MINOR**: Commits with `feat:` or `feature:` prefixes
- **PATCH**: All other commits (bug fixes, docs, etc.)

### Generated Files

- **CHANGELOG.md**: Automatically updated with new version and commit history
- **package.json**: Version field updated
- Git tag created automatically

### Commit Message Conventions

Follow conventional commit format for automatic version bumping:

```bash
# Features (triggers minor version bump)
feat: add new dashboard feature
feat(api): add user authentication endpoints

# Bug fixes (triggers patch version bump)
fix: resolve memory leak in websocket handler
fix(ui): correct button alignment in mobile view

# Documentation
docs: update API documentation
docs(readme): add installation instructions

# Breaking changes (triggers major version bump)
feat!: remove deprecated endpoints
BREAKING CHANGE: migrate to new authentication system

# Other types
chore: update dependencies
refactor: simplify error handling logic
test: add unit tests for user service
ci: update GitHub Actions workflow
```

#### Commit Types

- **feat**: New features (minor bump)
- **fix**: Bug fixes (patch bump)
- **BREAKING CHANGE**: Breaking changes (major bump)
- **docs**: Documentation changes
- **chore**: Maintenance tasks
- **refactor**: Code restructuring
- **test**: Testing related changes
- **ci**: CI/CD changes

#### Best Practices

1. **Use imperative mood**: "add feature" not "added feature"
2. **Be descriptive**: Explain what and why, not just what
3. **Reference issues**: Include issue numbers when applicable
4. **Scope optional**: Use `(scope)` for related changes
5. **Breaking changes**: Clearly document breaking changes

### Manual Override

For manual control, use the individual version scripts:

```bash
bun run version:patch   # Manual patch release
bun run version:minor   # Manual minor release
bun run version:major   # Manual major release
```

## Current Version

Check current version:
```bash
bun pm ls | grep windsurf
```

The version is automatically managed in `package.json` and updated across the project.</content>
<parameter name="filePath">VERSIONING.md