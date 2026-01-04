---
title: "GitHub Actions CI/CD"
summary: "Automated semantic versioning, conventional commit validation, and release management using GitHub Actions with release-please and commitlint."
source_paths:
  - ".github/workflows/release.yml"
  - ".github/workflows/commit-lint.yml"
  - ".github/release-please-config.json"
  - ".github/.release-please-manifest.json"
  - ".commitlintrc.json"
  - "CONTRIBUTING.md"
last_updated: "2025-01-04"
owner: "Mateusz Nędzi"
tags: ["ci", "cd", "automation", "versioning", "semver"]
links:
  parent: "../../SUMMARY.md"
  siblings: ["vite.md", "tsconfig.md"]
---

# GitHub Actions CI/CD

> **Purpose:** This module implements automated semantic versioning and release management through GitHub Actions. It enforces conventional commit standards, automatically determines version bumps based on commit messages, generates changelogs, and creates GitHub releases without manual intervention. This ensures consistent versioning practices and complete traceability of changes throughout the project lifecycle.

## Context & Motivation

Manual version management is error-prone and time-consuming. Developers may forget to bump versions, write incomplete changelogs, or use inconsistent versioning schemes. For a thesis project like VISTA, maintaining a clean commit history and automated releases demonstrates professional software engineering practices.

### Requirements

- Enforce [Conventional Commits](https://www.conventionalcommits.org/) specification across all contributions
- Automatically determine semantic version bumps (major, minor, patch) from commit messages
- Generate comprehensive changelogs from structured commit history
- Create GitHub releases with proper tagging
- Prevent merging of PRs with non-compliant commit messages
- Support breaking change detection and documentation

### Constraints

- Must work with Bun runtime (not npm/yarn)
- Must integrate with existing package.json versioning
- Zero manual intervention required for standard releases
- Must not block development workflow unnecessarily

### Dependencies

- **GitHub Actions**: CI/CD platform
- **release-please**: Google's automated release management tool (v4)
- **commitlint**: Conventional commit message linter
- **@commitlint/config-conventional**: Standard conventional commit rules

## Responsibilities & Boundaries

### In-Scope

- Validate commit message format on pull requests
- Validate PR title format (used for squash merges)
- Automatically create Release PRs with version bumps and changelogs
- Create GitHub releases and tags when Release PR is merged
- Trigger builds on successful releases
- Maintain changelog file (CHANGELOG.md)
- Update package.json version field

### Out-of-Scope

- npm package publishing (currently disabled, but infrastructure prepared)
- Docker image building/publishing (handled separately)
- Deployment to production environments
- Code quality checks (linting, testing)
- Security scanning

## Architecture & Design

### Workflow 1: Release Management (`.github/workflows/release.yml`)

**Trigger:** Push to `main` branch

**Flow:**

1. Run `release-please` action
2. Analyze all commits since last release
3. Determine semantic version bump based on commit types:
   - `feat:` → minor bump (0.x.0)
   - `fix:`, `perf:` → patch bump (0.0.x)
   - `BREAKING CHANGE:` or `feat!:` → major bump (x.0.0)
4. Create or update a Release PR containing:
   - Updated `package.json` version
   - Generated/updated `CHANGELOG.md`
   - Git tag preparation
5. When Release PR is merged:
   - Create GitHub release
   - Create git tag
   - Checkout code
   - Install dependencies with Bun
   - Build production bundle

**Configuration:**

```yaml
release-type: node  # Uses package.json for versioning
package-name: route-sim-frontend
bump-minor-pre-major: true  # Allow 0.x.y versions
bump-patch-for-minor-pre-major: true
```

### Workflow 2: Commit Linting (`.github/workflows/commit-lint.yml`)

**Trigger:** Pull request opened, synchronized, reopened, or edited

**Flow:**

1. Checkout repository with full history (`fetch-depth: 0`)
2. Install commitlint dependencies
3. Validate PR title against conventional commit format
4. Validate all commits in PR against conventional commit format
5. Fail if any commit or PR title is non-compliant

**Validation Rules:** Defined in `.commitlintrc.json`

### Configuration Files

#### `.commitlintrc.json`

Defines commit message validation rules:

- **Allowed types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **Subject rules**: No uppercase start, no trailing period, max 100 chars
- **Body rules**: Leading blank line, max 100 chars per line
- **Footer rules**: Leading blank line, max 100 chars per line

#### `.github/release-please-config.json`

Configures release-please behavior:

- Package configuration (name, type)
- Version bump strategy
- Changelog section mapping (commit types → changelog sections)
- Shows/hides specific commit types in changelog

#### `.github/.release-please-manifest.json`

Tracks current version (starts at `0.0.0`). Updated automatically by release-please.

## Algorithms & Complexity

### Version Determination Algorithm

```typescript
// Pseudo-code representation of release-please logic
function determineNextVersion(commits: Commit[], currentVersion: Version): Version {
  let bump: 'major' | 'minor' | 'patch' | null = null;

  for (const commit of commits) {
    if (commit.hasBreakingChange()) {
      bump = 'major';
      break; // Major takes precedence
    }
    if (commit.type === 'feat' && bump !== 'major') {
      bump = 'minor';
    }
    if ((commit.type === 'fix' || commit.type === 'perf') && !bump) {
      bump = 'patch';
    }
  }

  return bump ? currentVersion.bump(bump) : currentVersion;
}
```

**Complexity:** O(n) where n = number of commits since last release

### Changelog Generation

Groups commits by type, then chronologically within each type. Each commit becomes an entry with:
- Type badge
- Scope (if present)
- Description
- Link to commit SHA
- Link to associated PR/issue (if referenced)

**Complexity:** O(n log n) due to sorting within groups

## Public API / Usage

### For Developers

#### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Examples:**

```bash
# Feature (minor bump)
git commit -m "feat(hud): add agent inspector panel"

# Bug fix (patch bump)
git commit -m "fix(engine): correct camera aspect ratio on resize"

# Breaking change (major bump)
git commit -m "feat(sim)!: redesign state management

BREAKING CHANGE: SimStore API has been completely redesigned."

# Documentation (no version bump)
git commit -m "docs: update installation instructions"
```

#### PR Title Format

PR titles must follow the same format as they're used for squash merges:

```
feat(module): add new feature
```

### For Maintainers

#### Release Process

1. Merge PRs to `main` with conventional commits
2. Release-please automatically creates/updates a Release PR
3. Review the Release PR:
   - Check version bump is correct
   - Review generated changelog
   - Verify all commits are included
4. Merge the Release PR
5. GitHub release is created automatically
6. Build artifacts are generated

#### Manual Version Override

If needed, edit `.github/.release-please-manifest.json`:

```json
{
  ".": "1.2.3"
}
```

Commit and push to `main`. Next release will use this as base version.

## Implementation Notes

### Design Trade-offs

1. **release-please vs semantic-release**
   - Chose release-please for clearer PR-based workflow
   - Easier to review changes before release
   - Better suited for monorepos (future-proof)

2. **Commitlint on PR vs pre-commit hooks**
   - CI-based validation ensures no bypass
   - Works for all contributors without local setup
   - Doesn't interrupt local development flow

3. **Bun vs npm**
   - Used Bun for consistency with project
   - Requires explicit `bun` commands in workflows
   - Faster dependency installation

### Third-Party Libraries

- **release-please** (v4): Google-maintained, active development, supports multiple ecosystems
- **commitlint**: De facto standard for conventional commit validation
- **@commitlint/config-conventional**: Standard ruleset, widely adopted

### Debug Mode

Enable verbose logging by adding to workflow:

```yaml
- name: Validate commits
  run: |
    bunx commitlint --from ${{ github.event.pull_request.base.sha }} \
                     --to ${{ github.event.pull_request.head.sha }} \
                     --verbose \
                     --config .commitlintrc.json
```

## Tests

### Testing Strategy

1. **Unit tests**: Not applicable (workflow configuration)
2. **Integration tests**: Manual testing in feature branches
3. **Validation**: GitHub Actions workflow syntax validation

### Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| PR with `feat:` commits | Commit lint passes, release-please proposes minor bump |
| PR with `fix:` commits | Commit lint passes, release-please proposes patch bump |
| PR with `feat!:` commit | Commit lint passes, release-please proposes major bump |
| PR with non-conventional commit | Commit lint fails, PR cannot merge |
| Multiple PRs merged | Release PR includes all commits, correct version bump |
| Manual version edit | Next release uses edited version as base |

## Performance

### Workflow Performance

- **Commit lint**: ~30-60s per PR
  - Checkout: ~5s
  - Bun setup: ~10s
  - Dependency install: ~10s
  - Validation: ~5s per commit

- **Release creation**: ~20-40s per merge to main
  - release-please analysis: ~10s
  - PR creation/update: ~10s

- **Release publish**: ~2-5 minutes
  - Build step dominates (Vite bundling)

### Optimization Opportunities

- Cache Bun dependencies between runs
- Use action caching for commitlint dependencies
- Parallelize validation steps

## Security & Reliability

### Permissions

Workflows use minimal required permissions:

```yaml
permissions:
  contents: write       # Create releases and tags
  pull-requests: write  # Create/update Release PR
```

### Error Handling

- **Commit lint failures**: Block PR merge, provide clear error messages with examples
- **Release-please failures**: Retry on transient errors, alert maintainers on persistent issues
- **Build failures**: Do not create release if build fails

### Logging & Observability

- All workflow runs logged in GitHub Actions UI
- Commit lint provides detailed validation errors
- Release PR description contains full changelog preview

### Reliability Measures

- Idempotent operations: Running release-please multiple times is safe
- Atomic releases: Version bump, tag, and release happen together
- Rollback capability: Can manually delete tags/releases and re-run

## References

### Related Modules

- [package.json](config/package.md) - Version field managed by release-please
- [vite.config.ts](config/vite.md) - Build process triggered on release
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Developer guide for conventional commits

### External Documentation

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [release-please Documentation](https://github.com/googleapis/release-please)
- [commitlint Documentation](https://commitlint.js.org/)
- [Semantic Versioning](https://semver.org/)

### Standards & Specifications

- **Conventional Commits v1.0.0**: Commit message format
- **Semantic Versioning v2.0.0**: Version numbering scheme
- **Keep a Changelog**: Changelog format guidelines

