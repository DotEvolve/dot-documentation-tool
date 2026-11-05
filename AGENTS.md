# Agent Development & Operations Guide

## 1. Architectural Precedence

For public repositories, internal `.kiro/` specifications and steering files are excluded from version control to maintain confidentiality. Any local untracked `.kiro/` files (if present in local dev environments) or the instructions in this document serve as authoritative reference.

---

## 2. Pre-Commit Quality & Local Verification Gates

Before staging or committing any changes, the agent must run and pass the following checks locally:

1. **Type Checking**: `npx tsc --noEmit` (or `tsc -b`) with zero TypeScript errors.
2. **Automated Test Suite**: `npm test` with 100% passing tests.
3. **Linting & Code Style**: `npm run lint` and `npx prettier --check .` with zero errors.

Commits must follow the **Conventional Commits** standard:
`feat(<scope>): ...`, `fix(<scope>): ...`, `chore(<scope>): ...`, `docs(<scope>): ...`, `test(<scope>): ...`.

---

## 3. Branching Strategy & Release Lifecycle (CalVer)

Strict branch flow:
`feature/*` ──(PR)──> `dev` ──(cut branch)──> `release/<calver>` ──(PR)──> `master`

- **`feature/*`**: Active working branches branched from `dev` (`feat/*`, `fix/*`, `chore/*`, `docs/*`).
- **`dev`**: Continuous integration branch deployed to development/preview environments.
- **`release/<calver>`**: Staged release candidate branch cut from `dev`.
- **`master`**: Production branch deployed to production environments.

> **Absolute Rule**: Never commit directly to `dev` or `master`. All updates to `dev` and `master` require a Pull Request. Creating and pushing a `release/<calver>` branch directly from `dev` is the authorized method for staging release candidates; any subsequent fixes to that release branch must be merged via PR.

### The Promotion Lifecycle:

1. **Feature Phase (`feature/*` -> `dev`)**:
   - Branch off `dev`: `git checkout dev && git pull origin dev && git checkout -b feat/<name>`.
   - Implement, verify locally, commit, and push: `git push -u origin feat/<name>`.
   - Open PR targeting `dev`: `gh pr create --base dev --head feat/<name> ...`.
2. **Release Candidate Phase (`dev` -> `release/<calver>`)**:
   - Pull updated `dev`: `git checkout dev && git pull origin dev`.
   - Branch using CalVer format `YYYY.0M.0D`: `git checkout -b release/YYYY.0M.0D` (append `.1`, `.2` for multiple daily releases).
   - Verify full test suite passes on the release branch.
   - Push release branch to origin: `git push -u origin release/YYYY.0M.0D`.
   - Open PR targeting `master`: `gh pr create --base master --head release/YYYY.0M.0D --title "release: YYYY.0M.0D [dev -> master]" ...`.

---

## 4. PR Quality Gates & Seer Remediation Loop

When any Pull Request is opened:

1. **Do Not Merge Immediately**: Allow automated checks and AI reviewers to complete.
2. **Continuous Polling**:
   - Poll checks: `gh pr checks <pr-number>`
   - Poll review threads: `gh pr view <pr-number> --json reviews,comments`
3. **Automated Review & Seer Remediation**:
   - **Zero Open Comments**: All comments from human reviewers, bots (e.g. Socket Security), and Seer must be addressed.
   - For every flagged issue: apply the fix, add automated tests, push updates, and reply on the review thread.
   - **Thread Resolution**: Use the GitHub GraphQL API to mark the thread resolved:
     ```bash
     gh api graphql -f query='mutation($threadId: ID!) {
       resolveReviewThread(input: { threadId: $threadId }) {
         thread { isResolved }
       }
     }' -F threadId="<thread_id>"
     ```
   - Verify Seer Code Review check is green (`SUCCESS`).

---

## 5. HARD GATE: Explicit Merge Authorization

Even when all CI checks and Seer reviews pass with zero open comments:

- **Agents MUST NEVER merge a PR autonomously.**
- The agent must halt and ask the user for explicit approval:
  > _"PR #<id> has passed all CI checks and Seer code review with zero open comments. Do you approve merging this PR into `<target-branch>`?"_
- Only when the user responds with explicit confirmation may the agent run the merge command.

### Merge Strategy:

Always merge using **Squash Merge**:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

Rebase and merge commits are strictly prohibited.

---

## 6. Post-Merge Deployment Monitoring & Playbook

After merging into `dev` or `master`:

1. The agent must monitor the post-merge GitHub Actions deployment workflow (`publish.yml`).

### Package & Registries

- **Package Name**: `@dotevolve/documentation-tool`
- **Registries**: GitHub Packages (`npm.pkg.github.com`) and public npm registry (`registry.npmjs.org`) via Trusted Publishers (OIDC)
- **Triggers**: Automatic publication on push/merge to `master` (dist-tag: `latest`) and push to `release/**` (dist-tag: `beta`) via `.github/workflows/publish.yml`

### Pre-Publish Verification

```bash
npx prettier --check .
npm run lint
npm test
npm run build
```

### Version Bump Requirement

The `package.json` version must be bumped prior to opening the release PR. If the version already exists in the target registry, `publish.yml` will skip publication.

### Post-Merge Validation

1. Monitor GitHub Actions `publish.yml` run: `gh run list --workflow=publish.yml --limit 1`
2. Verify package versions:
   - `npm view @dotevolve/documentation-tool version --registry=https://npm.pkg.github.com`
   - `npm view @dotevolve/documentation-tool version --registry=https://registry.npmjs.org`

### Rollback Procedure

1. Never unpublish packages from registries.
2. Publish corrective patch version: revert offending code, increment patch version, and promote to `master`.

---

## 7. Multi-Repository Platform Deployment Order

When a task spans multiple repositories, execution and deployment must strictly follow this dependency chain:

1. **`libs`**: `dot-core`, `dot-error-utils`, `dot-ui-kit`, `doc-forge`, `dot-documentation-tool`
2. **`infra`**: `dot-infra`
3. **`backend`**: `dot-portal-api`, `floorix-api`, `govnix-api`, `perfxcel-api`, `govnix-workflow-service`, `nagram-api`
4. **`front-end`**: `dot-portal`, `floorix-admin`, `floorix-app`, `govnix-admin`, `govnix-app`, `govnix-mca-extension`, `perfxcel-admin`, `perfxcel-app`, `nagram-admin`, `nagram-app`
5. **`marketing-websites`**: `dotevolve.net`, `floorix.net`, `govnix.net`, `dot-docs`
