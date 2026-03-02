# Contributing to Documentation Tool

Thank you for your interest in contributing to the Documentation Tool! This guide will help you extend and improve the tool.

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Project Architecture

### Core Components

#### CodeAnalyzer (`src/analyzers/CodeAnalyzer.ts`)
- Parses JavaScript/TypeScript files using Babel
- Extracts code elements (functions, classes, routes)
- Returns array of `CodeElement` objects

#### JSDocGenerator (`src/generators/JSDocGenerator.ts`)
- Generates JSDoc comments from `CodeElement` objects
- Creates descriptions, parameter docs, return docs
- Exports `generateJSDoc()` and `formatJSDoc()` functions

#### DocumentationValidator (`src/validators/DocumentationValidator.ts`)
- Validates JSDoc syntax and completeness
- Checks for redundancy and terminology consistency
- Returns validation errors and warnings

#### DocumentationInserter (`src/DocumentationInserter.ts`)
- Inserts JSDoc comments into source files
- Detects existing documentation to avoid conflicts
- Preserves code structure and indentation

## Adding New Service Handlers

To add support for a new service type:

1. Create a new handler file in `src/handlers/`:

```typescript
// src/handlers/MyServiceHandler.ts
import { CodeElement, JSDoc } from '../types';

export function generateMyServiceDoc(element: CodeElement): JSDoc {
  // Check for service-specific patterns
  if (isMyServicePattern(element)) {
    return {
      description: 'Service-specific description',
      // ... other JSDoc fields
    };
  }
  
  // Fall back to default generation
  return generateJSDoc(element);
}

function isMyServicePattern(element: CodeElement): boolean {
  // Detect service-specific code patterns
  return element.context.imports?.includes('my-service-lib');
}
```

2. Export the handler from `src/handlers/index.ts`:

```typescript
export * from './MyServiceHandler';
```

3. Add unit tests in `__tests__/unit/service-handlers.test.ts`

## Extending the Analyzer

To add support for new code patterns:

1. Update `CodeAnalyzer.ts` to detect the pattern:

```typescript
private extractCodeElements(ast: t.File): CodeElement[] {
  const elements: CodeElement[] = [];
  
  traverse(ast, {
    // Add new visitor for your pattern
    MyPattern(path) {
      elements.push({
        type: CodeElementType.MY_TYPE,
        name: path.node.name,
        // ... other fields
      });
    }
  });
  
  return elements;
}
```

2. Update `types.ts` if needed to add new `CodeElementType`

3. Add tests in `__tests__/unit/code-analyzer.test.ts`

## Testing Requirements

### Unit Tests

- Test specific examples and edge cases
- Use descriptive test names
- Cover error conditions
- Place in `__tests__/unit/`

Example:
```typescript
describe('MyFeature', () => {
  it('should handle empty input', () => {
    const result = myFunction('');
    expect(result).toBe('default');
  });
});
```

### Property-Based Tests

- Test universal properties across all inputs
- Minimum 100 iterations per property
- Reference design document property
- Place in `__tests__/property/`

Example:
```typescript
import * as fc from 'fast-check';

describe('Property X: Description', () => {
  it('should maintain property across all inputs', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const result = myFunction(input);
          expect(result).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage

Maintain minimum coverage:
- Line coverage: 80%
- Branch coverage: 75%
- Function coverage: 90%

Run coverage: `npm run test:coverage`

## Code Style

- Use TypeScript strict mode
- Follow existing code formatting
- Add JSDoc comments to all exported functions
- Use meaningful variable names
- Keep functions focused and small

## Submitting Changes

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Ensure type checking passes: `npx tsc --noEmit`
6. Update documentation if needed
7. Submit a pull request

## Common Tasks

### Adding a New Generator

1. Create generator file in `src/generators/`
2. Export generation function
3. Add unit tests
4. Update README with new capability

### Adding Validation Rules

1. Update `DocumentationValidator.ts`
2. Add validation method
3. Add tests for valid and invalid cases
4. Update error messages to be helpful

### Improving Documentation Quality

1. Update description generation logic in `JSDocGenerator.ts`
2. Add more context-aware patterns
3. Test with real-world code examples
4. Validate against design document properties

## Questions?

If you have questions or need help, please open an issue on GitHub.
