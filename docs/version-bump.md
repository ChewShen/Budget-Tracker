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

### Step 2: Run the Checks
```bash
npm run type-check
npm run lint
npm test
npm run build
```

### Step 3: Bump the Version (no tag yet)
Bump on the working branch (e.g. `chewshen`). `--no-git-tag-version` updates `package.json` and `package-lock.json` only; tagging happens in Step 6.

```bash
npm version patch --no-git-tag-version   # bug fix        (0.6.0 -> 0.6.1)
npm version minor --no-git-tag-version   # new feature    (0.6.0 -> 0.7.0)
npm version major --no-git-tag-version   # breaking change (0.6.0 -> 1.0.0)
```

### Step 4: Update `docs/changelog.md`
1. Add a `## [X.Y.Z] - YYYY-MM-DD` section below `## [Unreleased]`, grouped as Added / Changed / Fixed / Security.
2. Move anything shipped out of the Unreleased "Planned" list.

### Step 5: Commit and Push
```bash
git add package.json package-lock.json docs/changelog.md
git commit -m "chore(release): bump version to vX.Y.Z"
git push
```

### Step 6: Tag the Release
Tags are annotated and point at the released code. Pick one:

* **Normal release** (after the PR is merged through `dev` into `main`): tag the merge commit on `main`.
  ```bash
  git checkout main && git pull
  git tag -a vX.Y.Z -m "vX.Y.Z: <summary>"
  git push origin vX.Y.Z
  ```
* **Folded release** (several versions go out in one PR later): tag the `chore(release)` commit on the working branch now. It becomes part of `main` when the PR is merged.
  ```bash
  git tag -a vX.Y.Z <release-commit-sha> -m "vX.Y.Z: <summary>"
  git push origin vX.Y.Z
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
