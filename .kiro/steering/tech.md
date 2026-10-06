---
inclusion: always
---

# Tech Stack

## Core

| Concern       | Library                                      | Version |
| ------------- | -------------------------------------------- | ------- |
| Runtime       | Node.js                                      | 24.x    |
| Language      | TypeScript                                   | 5.3.x   |
| CLI Framework | commander                                    | —       |
| AST Parsing   | @babel/parser, @babel/traverse, @babel/types | —       |

## Testing

| Concern                | Library    | Version |
| ---------------------- | ---------- | ------- |
| Runner                 | Jest       | 29.x    |
| TypeScript integration | ts-jest    | —       |
| Property-Based         | fast-check | —       |

- Unit tests live in `__tests__/unit/`, property tests in `__tests__/property/`, integration tests in `__tests__/integration/`.
- Property tests are named `*.property.test.ts` and must run a **minimum of 100 iterations** per property.
- Test files are always excluded from documentation generation — never process `*.test.ts`, `*.spec.ts`, `__tests__/**`, or `__mocks__/**`.

## Common Commands

```bash
npm run build         # Compile TypeScript and build the CLI binary
npm test              # Run all tests (unit + property + integration)
npm run test:unit     # Run unit tests only
npm run test:property # Run property-based tests only
npm run test:coverage # Generate test coverage report
```

## Key Constraints

- **Only `.ts` and `.js` files are processed** — skip all other file types during directory traversal.
- **Dry-run must be side-effect free** — when `--dry-run` is active, log what would be written but make zero file system writes.
- **Never overwrite existing JSDoc** — always call `detectExistingDocs()` before inserting; skip any element that already has a doc block.
- **Validate before inserting** — run `DocumentationValidator.validateSyntax()` on every generated JSDoc string; skip elements that fail and increment the warnings counter.
- **Glossary terms must be applied** — substitute raw terms using the `glossary` map from `.docrc.json` when generating descriptions (e.g. "Tenant" not "customer").
- **Stats are always printed** — every CLI command ends with `printStats()` reporting files processed, comments added, warnings, and errors.
