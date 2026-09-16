---
inclusion: always
---

# Project Structure

```
src/
├── cli.ts                    # Commander CLI entry point — orchestrates the full pipeline
├── index.ts                  # Public API re-exports (analyzers, generators, validators, handlers)
├── types.ts                  # Shared TypeScript types: CodeElement, Documentation, etc.
├── DocumentationInserter.ts  # The only module that writes to disk — detects and inserts JSDoc safely
├── analyzers/                # AST parsing via @babel/parser + @babel/traverse
├── generators/               # JSDoc string generation and formatting
├── validators/               # Syntax and completeness validation of JSDoc blocks
└── handlers/                 # Service-specific documentation logic
    ├── APIGatewayHandler.ts
    ├── WorkflowServiceHandler.ts
    ├── RuleEngineHandler.ts
    ├── FrontendHandler.ts
    └── ExtensionHandler.ts
__tests__/
├── unit/                     # Per-module examples and edge cases
├── property/                 # fast-check property tests (min 100 iterations each)
└── integration/              # Full pipeline tests against fixture files
```

## Module Responsibilities

- **`CodeAnalyzer`** (`analyzers/`) — parses a source file and returns undocumented `CodeElement` objects (functions, classes, methods) with line numbers and signatures. Never writes to disk.
- **`generateJSDoc` / `formatJSDoc`** (`generators/`) — converts a `CodeElement` into a formatted JSDoc string. Apply glossary substitutions from `.docrc.json` here.
- **`DocumentationValidator`** (`validators/`) — validates a JSDoc string for syntax errors and missing required tags. Always run before insertion.
- **`DocumentationInserter`** — calls `detectExistingDocs()` before every insert. If a JSDoc block already exists at the target line, skip it. This is the only module allowed to write files.
- **Service Handlers** (`handlers/`) — extend generation logic for specific DotEvolve services (e.g. Express route patterns for `APIGatewayHandler`, QStash job patterns for `WorkflowServiceHandler`).

## Key Conventions

- **Never overwrite existing JSDoc.** `DocumentationInserter` must call `detectExistingDocs()` before every insert and skip any element that already has a doc block.
- **Validate before inserting.** Always run `DocumentationValidator.validateSyntax()` on generated JSDoc. Skip elements that fail validation and increment the warnings counter.
- **Apply glossary terms.** Replace raw terms using the `glossary` map from `.docrc.json` when generating descriptions (e.g. "Tenant" not "customer").
- **Dry-run is side-effect free.** When `--dry-run` is active, log what would be written but make zero file system writes.
- **Test files are always excluded.** Never process files matching `*.test.ts`, `*.spec.ts`, `__tests__/**`, or `__mocks__/**`.
- **Only `.ts` and `.js` files are processed.** Skip all other file types during directory traversal.
- **Always print stats.** Every CLI command ends with `printStats()` — files processed, comments added, warnings, errors.
- **`cli.ts` orchestrates; modules stay focused.** The CLI wires together analyzers → generators → validators → inserter. Individual modules must not call each other outside this pipeline order.

## Testing Approach

- Unit tests (`__tests__/unit/`) cover specific examples and edge cases per module.
- Property tests (`__tests__/property/`) use `fast-check` with a minimum of 100 iterations per property to verify invariants (e.g. generated JSDoc is always syntactically valid; inserter never corrupts existing content).
- Integration tests (`__tests__/integration/`) run the full pipeline against fixture files.
- Test files are excluded from documentation generation via `.docrc.json`.
