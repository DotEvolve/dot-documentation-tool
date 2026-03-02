# Documentation Tool

Automated JSDoc documentation generator for dot-cOS services.

## Overview

This tool analyzes JavaScript/TypeScript code and generates comprehensive JSDoc comments following the project's documentation standards. It supports multiple service types including API Gateway, Workflow Service, Rule Engine, Frontend applications, and Chrome extensions.

## Features

- **Automatic JSDoc Generation**: Analyzes code structure and generates complete JSDoc comments
- **Smart Documentation**: Creates meaningful descriptions based on function names and context
- **Service-Specific Handlers**: Specialized documentation for different service types
- **Validation**: Ensures generated documentation follows JSDoc standards
- **Conflict Detection**: Avoids overwriting existing documentation
- **CLI Interface**: Easy-to-use command-line tool
- **Configuration Support**: Customize behavior with `.docrc.json`

## Installation

```bash
npm install
npm run build
```

## Usage

### Document a Single File

```bash
node dist/cli.js file <path-to-file>
```

Example:
```bash
node dist/cli.js file src/utils/helper.ts
```

### Document a Directory

```bash
node dist/cli.js directory <path-to-directory>
```

Example:
```bash
node dist/cli.js directory src/
```

### Dry Run Mode

Preview changes without writing to files:

```bash
node dist/cli.js file src/utils/helper.ts --dry-run
```

### Validate Existing Documentation

Check existing JSDoc comments for syntax errors:

```bash
node dist/cli.js validate src/utils/helper.ts
```

## Configuration

Create a `.docrc.json` file in your project root:

```json
{
  "excludePatterns": ["node_modules", "dist", "build", "__tests__"],
  "style": {
    "lineLength": 80,
    "indentation": "  "
  },
  "glossary": {
    "Customer": "Tenant",
    "User": "Account"
  }
}
```

### Configuration Options

- **excludePatterns**: Array of directory/file patterns to exclude
- **style.lineLength**: Maximum line length for comments (default: 80)
- **style.indentation**: Indentation string (default: "  ")
- **glossary**: Map of incorrect terms to correct terms for terminology validation

## Project Structure

```
documentation-tool/
├── src/
│   ├── analyzers/       # Code analysis and AST parsing
│   ├── generators/      # JSDoc comment generation
│   ├── validators/      # Documentation quality validation
│   ├── handlers/        # Service-specific documentation handlers
│   ├── cli.ts          # Command-line interface
│   ├── DocumentationInserter.ts  # Insert docs into files
│   └── index.ts         # Main entry point
├── __tests__/
│   ├── unit/           # Unit tests for specific scenarios
│   ├── property/       # Property-based tests for universal properties
│   └── integration/    # Integration tests
├── dist/               # Compiled JavaScript output
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── jest.config.js      # Test configuration
```

## Development

```bash
# Build the project
npm run build

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npx tsc --noEmit
```

## Architecture

The tool consists of several key components:

### CodeAnalyzer
Parses JavaScript/TypeScript files using Babel and extracts code elements (functions, classes, routes, etc.)

### JSDocGenerator
Generates JSDoc comments from code elements with:
- Meaningful descriptions based on function names
- Parameter documentation with types
- Return type documentation
- Error/exception documentation

### DocumentationValidator
Validates JSDoc comments for:
- Syntax correctness
- Completeness (all params documented)
- Non-redundancy (meaningful descriptions)
- Terminology consistency

### DocumentationInserter
Inserts generated JSDoc comments into source files while:
- Preserving existing code structure
- Detecting and avoiding conflicts with existing docs
- Maintaining proper indentation

### Service-Specific Handlers
Specialized documentation for:
- **API Gateway**: Authentication middleware, proxy routing
- **Workflow Service**: Prisma models, business logic
- **Rule Engine**: RabbitMQ integration, webhooks
- **Frontend**: React components, hooks, routing
- **Extension**: Chrome APIs, message passing

## Testing Strategy

The project uses a dual testing approach:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs (minimum 100 iterations)

Both approaches are complementary and necessary for comprehensive coverage.

### Coverage Goals

- Line coverage: 80% minimum
- Branch coverage: 75% minimum
- Function coverage: 90% minimum

## Dependencies

- **@babel/parser**: Parse JavaScript/TypeScript code into AST
- **@babel/traverse**: Traverse and analyze AST nodes
- **commander**: CLI framework
- **fast-check**: Property-based testing library
- **jest**: Testing framework
- **typescript**: TypeScript compiler and type checking

## License

MIT
