# Contributing to Route-Sim Frontend

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages must follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (white-space, formatting, etc)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement (triggers patch version bump)
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Breaking Changes

To trigger a major version bump, include `BREAKING CHANGE:` in the footer or append `!` after the type:

```
feat!: drop support for Node 14

BREAKING CHANGE: Node 14 is no longer supported
```

### Examples

#### Feature
```
feat(hud): add agent inspector panel

Adds a new inspector panel that shows detailed agent information
when clicking on an agent in the 3D view.
```

#### Bug Fix
```
fix(engine): correct camera aspect ratio on resize

Previously the camera aspect ratio wasn't updating properly when
the window was resized, causing distortion.

Fixes #123
```

#### Documentation
```
docs: update installation instructions
```

#### Breaking Change
```
feat(sim)!: redesign state management

BREAKING CHANGE: SimStore API has been completely redesigned.
The old `getState()` method is now `getCurrentSnapshot()`.
```

## Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes with conventional commits
4. Push to your fork: `git push origin feat/my-feature`
5. Open a pull request

### PR Title Format

PR titles must also follow conventional commit format as they're used for squash merges:

```
feat(module): add new feature
```

## Automated Releases

This project uses [release-please](https://github.com/googleapis/release-please) for automated versioning and releases:

- When you merge PRs to `main`, release-please analyzes commit messages
- It automatically creates/updates a Release PR with:
  - Updated version in `package.json`
  - Generated CHANGELOG.md
  - Proper semantic version bump based on commit types
- When you merge the Release PR:
  - A GitHub release is created with the changelog
  - A git tag is created
  - Optional: Package is published to npm (if configured)

### Version Bumping

- `feat:` commits → minor version bump (0.x.0)
- `fix:` commits → patch version bump (0.0.x)
- `BREAKING CHANGE:` → major version bump (x.0.0)
- Other types → no version bump (included in changelog only)

## Code Quality

Before submitting:

1. Run tests: `bun test`
2. Run linter: `bun run lint` (if configured)
3. Ensure all commits follow conventional format
4. Update documentation if needed

## Questions?

Open an issue or reach out to the maintainers.

