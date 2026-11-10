# Agent Development & Operations Guide

## 1. Architectural Precedence

Local `.kiro/` steering files (if present) or the instructions in this document serve as authoritative reference.

---

## 2. Pre-Publish Verification Gates

Before staging or committing any changes, run and pass all of the following:

1. **Type Checking**: `tsc -b` with zero errors.
2. **Automated Tests**: `npm test` with 100% passing tests.
3. **Linting & Style**: `npm run lint` and `npx prettier --check .` with zero errors.
4. **Build**: `npm run build` — compiled output in `dist/` must be clean and complete.

> **Version Bump**: The `package.json` version **must** be bumped before opening a release PR. If the version already exists in the target registry, the publish workflow will skip publication silently.

Commits follow **Conventional Commits**: `feat(<scope>): ...`, `fix(<scope>): ...`, `chore(<scope>): ...`, `docs(<scope>): ...`, `test(<scope>): ...`.

---

## 3. Branching Strategy & Release Lifecycle (CalVer)

```
feature/*  ──(PR)──>  dev  ──(cut)──>  release/<calver>  ──(PR)──>  master
```

- `feature/*` — Working branches off `dev` (`feat/*`, `fix/*`, `chore/*`, `docs/*`).
- `dev` — Integration branch; CI runs here.
- `release/<calver>` — Staged release candidate cut from `dev`. Format: `YYYY.0M.0D` (append `.1`, `.2` for multiple same-day releases).
- `master` — Triggers npm publication on merge.

> **Rule**: Never commit directly to `dev` or `master`. All changes require a PR.

### 3.1 Single Consolidated Feature PR Rule (No Fragmented PRs)

> **Rule**: Opening multiple fragmented feature-to-`dev` PRs is strictly prohibited. Multiple related features, enhancements, bug fixes, or chores must be consolidated and merged into `dev` in a single combined PR.
>
> **Exception**: High-impact or breaking architectural migrations (e.g., major TypeScript 7 migration, breaking database engine overhauls, or breaking framework upgrades) may be opened as standalone dedicated PRs to isolate risk.

### Promotion Steps:

1. **Feature → dev**: `git checkout dev && git pull origin dev && git checkout -b feat/<name>` → implement & consolidate related features/fixes into a single PR → verify → `git push -u origin feat/<name>` → `gh pr create --base dev`.
2. **dev → release**: `git checkout dev && git pull origin dev && git checkout -b release/YYYY.0M.0D` → bump version in `package.json` → verify full test suite → `git push -u origin release/YYYY.0M.0D` → `gh pr create --base master --title "release: YYYY.0M.0D [dev -> master]"`.

---

## 4. PR Quality Gates & Seer Remediation Loop

1. **Never merge immediately** — wait for CI and Seer to complete.
2. **Poll**: `gh pr checks <pr-number>` and `gh pr view <pr-number> --json reviews,comments`.
3. **Zero open comments** — address every comment from humans, bots (Socket Security), and Seer. Fix the code, add tests, push, reply on the thread, then resolve it:
   ```bash
   gh api graphql -f query='mutation($threadId: ID!) {
     resolveReviewThread(input: { threadId: $threadId }) {
       thread { isResolved }
     }
   }' -F threadId="<thread_id>"
   ```
4. Verify Seer Code Review is green (`SUCCESS`) before proceeding.

---

## 5. HARD GATE: Explicit Merge Authorization

Even when all checks pass with zero open comments, **agents must never merge autonomously**.

Ask the user:

> _"PR #\<id\> has passed all CI checks and Seer code review with zero open comments. Do you approve merging into `<target-branch>`?"_

Only after explicit user confirmation:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

Rebase and merge commits are strictly prohibited.

---

## 6. Post-Merge Publication Monitoring

After merging to `master`:

1. Monitor the GitHub Actions `publish.yml` workflow: `gh run list --workflow=publish.yml --limit 1`.
2. Verify the package version is live in the target registry (see `.kiro/steering/deploy.md` for registry-specific commands).
3. If publication fails, follow the **Rollback Procedure** in `.kiro/steering/deploy.md` (never unpublish — publish a corrective patch version).

---

## 7. Agent Decision & Confirmation Protocol

### 7.1 Confirm Before Acting

When the next action is unclear, the agent **must stop and ask** before proceeding. Never guess.

Situations requiring explicit confirmation:

- Which branch to target when ambiguous.
- Whether to proceed with a breaking API change or version bump type.
- Whether a found issue is in scope for the current task.
- Modifying standardized configuration files (e.g., `tsconfig*.json`, `package.json` scripts/engines, `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `vite.config.*`).

> **Rule**: A short clarifying question is always preferable to an incorrect autonomous action.

### 7.2 No Guessing Root Causes

When investigating a bug or failure, **do not assume a cause without evidence**.

- Read the actual error output or failing test first.
- If evidence is not accessible, ask: _"Can you share the output of `<command>` so I can confirm the root cause?"_
- Only propose a fix after the cause is confirmed by observable output.

### 7.3 Standardized Configuration Protection Rule

All configuration files for this library have been standardized (including `"types": ["node"]` and `"lib": ["ES2024"]` in `tsconfig*.json`, `package.json` engines/scripts, prettier, and eslint configs).

- Agents **must not** modify, override, or revert standardized configuration files without explicit user permission.
- If a dependency update, build failure, or new tooling requirement appears to necessitate altering compiler options, `types`, `lib`, scripts, or build targets, the agent **must halt and request explicit approval** before modifying any configuration file.

---

## 8. Artifact & Documentation Persistence

All plans, analysis reports, architecture designs, and specifications generated by agents must be saved into documentation within this repository (in `docs/` or root-level markdown files).
