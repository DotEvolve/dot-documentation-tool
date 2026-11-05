# Deployment & Operations Playbook: dot-documentation-tool

## Tier: D (Shared Library & CLI)

### Package & Registries
- **Package Name**: `@dotevolve/documentation-tool`
- **Registries**: GitHub Packages (`npm.pkg.github.com`) and public npm registry (`registry.npmjs.org`) via Trusted Publishers (OIDC)
- **Triggers**: Automatic publication on push/merge to `master` (dist-tag: latest) and push to `release/**` (dist-tag: beta) via `.github/workflows/publish.yml`

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
