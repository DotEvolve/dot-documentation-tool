---
inclusion: always
---

# Product: DotEvolve Documentation Tool (`@dotevolve/documentation-tool`)

A Node.js CLI tool that performs static AST analysis on JavaScript and TypeScript source files to automatically generate and insert JSDoc comments. It is consumed by internal developers and CI/CD pipelines across the DotEvolve ecosystem.

## CLI Commands

The tool is invoked via the `doc-tool` binary (entry point: `src/cli.ts`). Three commands are available:

| Command                     | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `doc-tool file <path>`      | Generate JSDoc for a single file                                    |
| `doc-tool directory <path>` | Recursively generate JSDoc for all `.ts`/`.js` files in a directory |
| `doc-tool validate <path>`  | Validate syntax and completeness of existing JSDoc in a file        |

All commands accept `--dry-run` (preview without writing) and `--config <path>` (custom `.docrc.json` path).

## Configuration

Runtime behaviour is controlled by `.docrc.json` in the working directory. Key fields:

- `glossary` — term normalization map (e.g. `"customer" → "Tenant"`). Apply these substitutions when generating descriptions.
- `exclude` — glob patterns for files to skip (test files, `node_modules`, `dist`, `__tests__` are excluded by default).

## Architecture

```
src/
├── cli.ts                    # Commander CLI — orchestrates the pipeline
├── index.ts                  # Public API re-exports (analyzers, generators, validators, handlers)
├── types.ts                  # Shared TypeScript types (CodeElement, Documentation, etc.)
├── DocumentationInserter.ts  # Reads files, detects existing docs, inserts new JSDoc safely
├── analyzers/                # AST parsing via @babel/parser + @babel/traverse
├── generators/               # JSDoc string generation and formatting
├── validators/               # Syntax and completeness validation of JSDoc blocks
└── handlers/                 # Service-specific documentation logic
    ├── APIGatewayHandler.ts
    ├── WorkflowServiceHandler.ts
    ├── RuleEngineHandler.ts
    ├── FrontendHandler.ts
    └── ExtensionHandler.ts
```

### Key Modules

- **`CodeAnalyzer`** (`analyzers/`) — parses a file with Babel and returns an array of undocumented `CodeElement` objects (functions, classes, methods, etc.) with their line numbers and signatures.
- **`generateJSDoc` / `formatJSDoc`** (`generators/`) — converts a `CodeElement` into a formatted JSDoc string. Apply glossary substitutions here.
- **`DocumentationValidator`** (`validators/`) — validates a JSDoc string for syntax errors and missing required tags.
- **`DocumentationInserter`** (`DocumentationInserter.ts`) — the only module that writes to disk. It detects existing docs via `detectExistingDocs()` and inserts new ones at the correct line without overwriting manual documentation.
- **Service Handlers** (`handlers/`) — extend generation logic for specific DotEvolve services. Each handler knows the conventions of its target service (e.g. Express route patterns for `APIGatewayHandler`, QStash job patterns for `WorkflowServiceHandler`).

## Key Conventions

- **Never overwrite existing JSDoc.** `DocumentationInserter` must always call `detectExistingDocs()` before inserting. If a block already exists at the target line, skip it.
- **Glossary terms must be applied.** When generating descriptions, replace raw terms using the `glossary` map from `.docrc.json` (e.g. write "Tenant" not "customer").
- **Validation before insertion.** Always run `DocumentationValidator.validateSyntax()` on generated JSDoc before passing it to `DocumentationInserter`. Skip elements that produce validation errors and increment the warnings counter.
- **Dry-run must be side-effect free.** When `--dry-run` is set, log what would be written but make zero file system writes.
- **Test files are always excluded.** Patterns matching `*.test.ts`, `*.spec.ts`, `__tests__/**`, and `__mocks__/**` must never be processed.
- **Only `.ts` and `.js` files are processed.** Ignore all other file types during directory traversal.
- **Stats are always printed.** Every CLI command ends with `printStats()` showing files processed, comments added, warnings, and errors.

## Testing Approach

- Unit tests in `__tests__/unit/` — cover specific examples and edge cases per module.
- Property-based tests in `__tests__/property/` — use `fast-check` with a minimum of 100 iterations per property to verify invariants (e.g. generated JSDoc is always syntactically valid, inserter never corrupts existing content).
- Integration tests in `__tests__/integration/` — run the full pipeline against fixture files.
- Test files are excluded from documentation generation (see `.docrc.json`).

## Users

- Internal DotEvolve developers (local development)
- CI/CD pipelines (documentation coverage validation)
