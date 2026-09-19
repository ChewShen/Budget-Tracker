# Version Bump Specification & Protocol

This document defines how version numbers are assigned, bumped, and maintained across this project.

---

## 1. Semantic Versioning (SemVer 2.0.0)

Version numbers follow the standard format:

$$\text{v}\mathbf{MAJOR}.\mathbf{MINOR}.\mathbf{PATCH}$$

Example: `v1.2.4`

| Level | When to Bump | Examples in this Project |
| :--- | :--- | :--- |
| **MAJOR** (`X.0.0`) | **Breaking changes** or fundamental architecture redesigns. | Database schema breaking migration requiring manual intervention; rewriting the auth layer; overhaul of the export/import format. |
| **MINOR** (`0.X.0`) | **New features** added in a backward-compatible manner. | Adding receipt OCR photo scanning; adding a new bank account type; introducing Telegram bot expense logging; adding a new chart view. |
| **PATCH** (`0.0.X`) | **Bug fixes**, minor formula adjustments, or UI polish. | Correcting the daily average leap-year day count; fixing mobile numpad button alignment; updating a CSS color; dependency security patches. |

---

## 2. Conventional Commits Standard

To make version bumping predictable and automatable, all Git commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Allowed Types:
* `feat`: A new user-facing feature $\to$ triggers **MINOR** bump.
* `fix`: A bug fix $\to$ triggers **PATCH** bump.
* `perf`: Performance optimization $\to$ triggers **PATCH** bump.
* `refactor`: Code change that neither fixes a bug nor adds a feature $\to$ no version bump (or patch if notable).
* `style`: Code style / formatting changes (whitespace, semi-colons) $\to$ no bump.
* `docs`: Documentation updates only (`README`, guides) $\to$ no bump.
* `test`: Adding or correcting tests $\to$ no bump.
* `chore`: Build scripts, dependencies, or tooling adjustments $\to$ no bump.

### Breaking Changes:
Append an exclamation mark (`!`) after the type/scope or add `BREAKING CHANGE:` in the footer to indicate a **MAJOR** version bump:
```
feat(database)!: drop legacy category table in favor of hierarchical tags
```

---

## 3. Version Bumping Procedure

### Step 1: Ensure Working Tree is Clean
```bash
git status
# Must be clean and on the 'main' or release branch
```

### Step 2: Run Tests & Build Check
```bash
npm run lint
npm run test
npm run build
```

### Step 3: Bump the Version
Use `npm version` which automatically updates `package.json`, `package-lock.json`, and generates a Git tag:

```bash
# For a bug fix (e.g. v0.1.0 -> v0.1.1)
npm version patch -m "chore(release): bump version to %s"

# For a new feature (e.g. v0.1.0 -> v0.2.0)
npm version minor -m "chore(release): bump version to %s"

# For breaking changes (e.g. v0.1.0 -> v1.0.0)
npm version major -m "chore(release): bump version to %s"
```

### Step 4: Update `docs/changelog.md`
1. Change the `## [Unreleased]` section header to the newly bumped version and today's date:
   ```markdown
   ## [0.2.0] - 2026-10-01
   ```
2. Create a fresh, empty `## [Unreleased]` block at the top.

### Step 5: Amend Commit and Re-tag
```bash
git add docs/changelog.md
git commit --amend --no-edit
git tag -f $(node -p "require('./package.json').version")
```

### Step 6: Push to Remote
```bash
git push origin main --follow-tags
```

---

## 4. Automated Version Bumping (Optional Tooling)

If you prefer one-command automation, the following tools can be added to `package.json`:

```json
{
  "scripts": {
    "release:patch": "standard-version --release-as patch",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major"
  }
}
```
* **Tool**: `standard-version` or `release-it`.
* **Action**: Automatically reads Git commit history, generates the `CHANGELOG.md` entry, bumps `package.json`, and creates the Git tag in a single command.
