/**
 * SideEffectDetector - Analyzes function bodies to identify side effects
 *
 * Detects operations that have effects beyond returning a value:
 * - Database operations (Prisma calls, SQL queries)
 * - External API calls (fetch, axios, http)
 * - File I/O operations (fs module calls)
 * - State mutations (assignments to external variables)
 */

import {
  SideEffect,
  SideEffectType,
  ErrorPattern,
  ErrorPatternType,
} from "../types";

/**
 * Detects side effects in a function's AST node
 *
 * Analyzes the function body to identify operations that modify state,
 * interact with external systems, or perform I/O operations.
 *
 * @param node - AST node representing a function (FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, ClassMethod)
 * @returns Array of detected side effects with descriptions
 */
export function detectSideEffects(node: any): SideEffect[] {
  const sideEffects: SideEffect[] = [];

  if (!node) {
    return sideEffects;
  }

  // Get the function body
  const body = node.body;
  if (!body) {
    return sideEffects;
  }

  // Traverse the function body to detect side effects
  traverseNode(body, sideEffects);

  return sideEffects;
}

/**
 * Recursively traverses an AST node to detect side effects
 *
 * @param node - AST node to traverse
 * @param sideEffects - Array to accumulate detected side effects
 */
function traverseNode(node: any, sideEffects: SideEffect[]): void {
  if (!node || typeof node !== "object") {
    return;
  }

  // Detect database operations
  detectDatabaseOperations(node, sideEffects);

  // Detect API calls
  detectAPICallOperations(node, sideEffects);

  // Detect file I/O operations
  detectFileIOOperations(node, sideEffects);

  // Detect state mutations
  detectStateMutations(node, sideEffects);

  // Recursively traverse child nodes
  for (const key in node) {
    if (key === "loc" || key === "range" || key === "start" || key === "end") {
      continue; // Skip location metadata
    }

    const child = node[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        traverseNode(item, sideEffects);
      }
    } else if (typeof child === "object" && child !== null) {
      traverseNode(child, sideEffects);
    }
  }
}

/**
 * Detects database operations in an AST node
 *
 * Identifies:
 * - Prisma client calls (prisma.model.create, prisma.model.update, etc.)
 * - SQL query execution patterns
 *
 * @param node - AST node to analyze
 * @param sideEffects - Array to accumulate detected side effects
 */
function detectDatabaseOperations(node: any, sideEffects: SideEffect[]): void {
  // Detect Prisma operations: prisma.model.operation()
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression"
  ) {
    const callee = node.callee;

    // Check for prisma.model.operation pattern
    if (callee.object?.type === "MemberExpression") {
      const objectName = callee.object.object?.name;
      const modelName = callee.object.property?.name;
      const operationName = callee.property?.name;

      // Common Prisma client variable names
      const prismaNames = ["prisma", "db", "client"];

      if (
        objectName &&
        prismaNames.includes(objectName.toLowerCase()) &&
        modelName &&
        operationName
      ) {
        // Prisma operations that modify data
        const mutatingOps = [
          "create",
          "createMany",
          "update",
          "updateMany",
          "upsert",
          "delete",
          "deleteMany",
        ];
        const readOps = [
          "findUnique",
          "findFirst",
          "findMany",
          "count",
          "aggregate",
        ];

        if (mutatingOps.includes(operationName)) {
          sideEffects.push({
            type: SideEffectType.DATABASE,
            description: `Modifies ${modelName} records using ${operationName}`,
          });
        } else if (readOps.includes(operationName)) {
          sideEffects.push({
            type: SideEffectType.DATABASE,
            description: `Queries ${modelName} records using ${operationName}`,
          });
        } else {
          // Generic Prisma operation
          sideEffects.push({
            type: SideEffectType.DATABASE,
            description: `Performs ${operationName} operation on ${modelName}`,
          });
        }
      }
    }

    // Check for direct SQL query execution patterns
    const methodName = callee.property?.name;
    if (methodName) {
      const sqlMethods = [
        "query",
        "execute",
        "raw",
        "$queryRaw",
        "$executeRaw",
      ];
      if (sqlMethods.includes(methodName)) {
        sideEffects.push({
          type: SideEffectType.DATABASE,
          description: `Executes raw SQL query using ${methodName}`,
        });
      }
    }
  }
}

/**
 * Detects external API calls in an AST node
 *
 * Identifies:
 * - fetch() calls
 * - axios requests (axios.get, axios.post, etc.)
 * - http/https module requests
 *
 * @param node - AST node to analyze
 * @param sideEffects - Array to accumulate detected side effects
 */
function detectAPICallOperations(node: any, sideEffects: SideEffect[]): void {
  if (node.type === "CallExpression") {
    const callee = node.callee;

    // Detect fetch() calls
    if (callee.type === "Identifier" && callee.name === "fetch") {
      const urlArg = node.arguments?.[0];
      let url = "external API";

      if (urlArg?.type === "StringLiteral") {
        url = urlArg.value;
      } else if (urlArg?.type === "TemplateLiteral" && urlArg.quasis?.[0]) {
        url = urlArg.quasis[0].value.raw || "external API";
      }

      sideEffects.push({
        type: SideEffectType.API_CALL,
        description: `Makes HTTP request to ${url} using fetch`,
      });
    }

    // Detect axios calls: axios.get(), axios.post(), axios(), etc.
    if (callee.type === "MemberExpression") {
      const objectName = callee.object?.name;
      const methodName = callee.property?.name;

      if (objectName === "axios") {
        const httpMethods = [
          "get",
          "post",
          "put",
          "patch",
          "delete",
          "head",
          "options",
          "request",
        ];

        if (methodName && httpMethods.includes(methodName)) {
          const urlArg = node.arguments?.[0];
          let url = "external API";

          if (urlArg?.type === "StringLiteral") {
            url = urlArg.value;
          } else if (urlArg?.type === "TemplateLiteral" && urlArg.quasis?.[0]) {
            url = urlArg.quasis[0].value.raw || "external API";
          }

          sideEffects.push({
            type: SideEffectType.API_CALL,
            description: `Makes ${methodName.toUpperCase()} request to ${url} using axios`,
          });
        }
      }

      // Detect http/https module requests
      const httpModules = ["http", "https"];
      if (objectName && httpModules.includes(objectName)) {
        const requestMethods = ["request", "get", "post"];

        if (methodName && requestMethods.includes(methodName)) {
          sideEffects.push({
            type: SideEffectType.API_CALL,
            description: `Makes HTTP request using ${objectName}.${methodName}`,
          });
        }
      }
    }

    // Detect axios() direct call
    if (callee.type === "Identifier" && callee.name === "axios") {
      sideEffects.push({
        type: SideEffectType.API_CALL,
        description: `Makes HTTP request using axios`,
      });
    }
  }

  // Detect await fetch or await axios patterns
  if (
    node.type === "AwaitExpression" &&
    node.argument?.type === "CallExpression"
  ) {
    detectAPICallOperations(node.argument, sideEffects);
  }
}

/**
 * Detects file I/O operations in an AST node
 *
 * Identifies:
 * - fs module operations (readFile, writeFile, etc.)
 * - fs/promises operations
 *
 * @param node - AST node to analyze
 * @param sideEffects - Array to accumulate detected side effects
 */
function detectFileIOOperations(node: any, sideEffects: SideEffect[]): void {
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression"
  ) {
    const callee = node.callee;
    const objectName = callee.object?.name;
    const methodName = callee.property?.name;

    // fs module operations
    if (objectName === "fs" && methodName) {
      const readOps = [
        "readFile",
        "readFileSync",
        "readdir",
        "readdirSync",
        "stat",
        "statSync",
        "access",
        "accessSync",
      ];
      const writeOps = [
        "writeFile",
        "writeFileSync",
        "appendFile",
        "appendFileSync",
        "mkdir",
        "mkdirSync",
        "rmdir",
        "rmdirSync",
        "unlink",
        "unlinkSync",
        "rename",
        "renameSync",
        "copyFile",
        "copyFileSync",
      ];

      if (readOps.includes(methodName)) {
        sideEffects.push({
          type: SideEffectType.FILE_IO,
          description: `Reads from file system using fs.${methodName}`,
        });
      } else if (writeOps.includes(methodName)) {
        sideEffects.push({
          type: SideEffectType.FILE_IO,
          description: `Writes to file system using fs.${methodName}`,
        });
      } else {
        // Generic fs operation
        sideEffects.push({
          type: SideEffectType.FILE_IO,
          description: `Performs file system operation using fs.${methodName}`,
        });
      }
    }

    // fs.promises operations (nested member expression)
    if (callee.object?.type === "MemberExpression") {
      const nestedObjectName = callee.object.object?.name;
      const nestedPropertyName = callee.object.property?.name;

      if (
        nestedObjectName === "fs" &&
        nestedPropertyName === "promises" &&
        methodName
      ) {
        const readOps = ["readFile", "readdir", "stat", "access"];
        const writeOps = [
          "writeFile",
          "appendFile",
          "mkdir",
          "rmdir",
          "unlink",
          "rename",
          "copyFile",
        ];

        if (readOps.includes(methodName)) {
          sideEffects.push({
            type: SideEffectType.FILE_IO,
            description: `Reads from file system using fs.promises.${methodName}`,
          });
        } else if (writeOps.includes(methodName)) {
          sideEffects.push({
            type: SideEffectType.FILE_IO,
            description: `Writes to file system using fs.promises.${methodName}`,
          });
        } else {
          sideEffects.push({
            type: SideEffectType.FILE_IO,
            description: `Performs file system operation using fs.promises.${methodName}`,
          });
        }
      }
    }
  }
}

/**
 * Detects state mutations in an AST node
 *
 * Identifies:
 * - Assignments to variables declared outside the function scope
 * - Mutations to object properties
 * - Array mutations (push, pop, splice, etc.)
 *
 * @param node - AST node to analyze
 * @param sideEffects - Array to accumulate detected side effects
 */
function detectStateMutations(node: any, sideEffects: SideEffect[]): void {
  // Detect assignment expressions
  if (node.type === "AssignmentExpression") {
    const left = node.left;

    // Assignment to member expression (object.property = value)
    if (left.type === "MemberExpression") {
      const objectName = left.object?.name;
      const propertyName = left.property?.name || left.property?.value;

      if (objectName && propertyName) {
        sideEffects.push({
          type: SideEffectType.STATE_MUTATION,
          description: `Mutates ${objectName}.${propertyName}`,
        });
      } else if (objectName) {
        sideEffects.push({
          type: SideEffectType.STATE_MUTATION,
          description: `Mutates property of ${objectName}`,
        });
      }
    }
    // Assignment to identifier (variable = value)
    else if (left.type === "Identifier") {
      // Note: This could be a local variable or external variable
      // Without scope analysis, we'll flag it as potential state mutation
      sideEffects.push({
        type: SideEffectType.STATE_MUTATION,
        description: `Assigns value to ${left.name}`,
      });
    }
  }

  // Detect array mutation methods
  if (
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression"
  ) {
    const callee = node.callee;
    const methodName = callee.property?.name;
    const objectName = callee.object?.name;

    const mutatingArrayMethods = [
      "push",
      "pop",
      "shift",
      "unshift",
      "splice",
      "sort",
      "reverse",
      "fill",
      "copyWithin",
    ];

    if (methodName && mutatingArrayMethods.includes(methodName)) {
      if (objectName) {
        sideEffects.push({
          type: SideEffectType.STATE_MUTATION,
          description: `Mutates array ${objectName} using ${methodName}`,
        });
      } else {
        sideEffects.push({
          type: SideEffectType.STATE_MUTATION,
          description: `Mutates array using ${methodName}`,
        });
      }
    }
  }

  // Detect update expressions (++, --)
  if (node.type === "UpdateExpression") {
    const argument = node.argument;

    if (argument.type === "Identifier") {
      sideEffects.push({
        type: SideEffectType.STATE_MUTATION,
        description: `Modifies ${argument.name} using ${node.operator}`,
      });
    } else if (argument.type === "MemberExpression") {
      const objectName = argument.object?.name;
      const propertyName = argument.property?.name || argument.property?.value;

      if (objectName && propertyName) {
        sideEffects.push({
          type: SideEffectType.STATE_MUTATION,
          description: `Modifies ${objectName}.${propertyName} using ${node.operator}`,
        });
      }
    }
  }
}

/**
 * Detects error handling patterns in a function's AST node
 *
 * Analyzes the function body to identify:
 * - Try-catch blocks and error handlers
 * - Thrown errors and error types
 * - Express error middleware patterns (4-parameter functions)
 *
 * @param node - AST node representing a function (FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, ClassMethod)
 * @returns Array of detected error handling patterns with descriptions
 */
export function detectErrorHandling(node: any): ErrorPattern[] {
  const errorPatterns: ErrorPattern[] = [];

  if (!node) {
    return errorPatterns;
  }

  // Check if this is an Express error middleware (4 parameters with first being error)
  if (node.params && node.params.length === 4) {
    const firstParam = node.params[0];
    const paramName = firstParam.name?.toLowerCase() || "";

    // Common error parameter names
    if (paramName === "err" || paramName === "error" || paramName === "e") {
      errorPatterns.push({
        type: ErrorPatternType.ERROR_MIDDLEWARE,
        description:
          "Express error middleware with 4 parameters (err, req, res, next)",
      });
    }
  }

  // Get the function body
  const body = node.body;
  if (!body) {
    return errorPatterns;
  }

  // Traverse the function body to detect error patterns
  traverseForErrors(body, errorPatterns);

  return errorPatterns;
}

/**
 * Recursively traverses an AST node to detect error handling patterns
 *
 * @param node - AST node to traverse
 * @param errorPatterns - Array to accumulate detected error patterns
 */
function traverseForErrors(node: any, errorPatterns: ErrorPattern[]): void {
  if (!node || typeof node !== "object") {
    return;
  }

  // Detect try-catch blocks
  if (node.type === "TryStatement") {
    detectTryCatchBlock(node, errorPatterns);
  }

  // Detect throw statements
  if (node.type === "ThrowStatement") {
    detectThrowStatement(node, errorPatterns);
  }

  // Detect error handler patterns (functions that handle errors)
  if (node.type === "CallExpression") {
    detectErrorHandlerCall(node, errorPatterns);
  }

  // Recursively traverse child nodes
  for (const key in node) {
    if (key === "loc" || key === "range" || key === "start" || key === "end") {
      continue; // Skip location metadata
    }

    const child = node[key];

    if (Array.isArray(child)) {
      for (const item of child) {
        traverseForErrors(item, errorPatterns);
      }
    } else if (typeof child === "object" && child !== null) {
      traverseForErrors(child, errorPatterns);
    }
  }
}

/**
 * Detects try-catch blocks and extracts error handling information
 *
 * @param node - TryStatement AST node
 * @param errorPatterns - Array to accumulate detected error patterns
 */
function detectTryCatchBlock(node: any, errorPatterns: ErrorPattern[]): void {
  const handler = node.handler;

  if (handler && handler.param) {
    const errorParam = handler.param;
    let errorType: string | undefined;
    let errorName = "error";

    // Get error parameter name
    if (errorParam.type === "Identifier") {
      errorName = errorParam.name;
    }

    // Check for typed catch clause (TypeScript)
    if (errorParam.typeAnnotation) {
      const typeAnnotation = errorParam.typeAnnotation.typeAnnotation;
      if (typeAnnotation) {
        if (
          typeAnnotation.type === "TSTypeReference" &&
          typeAnnotation.typeName
        ) {
          errorType = typeAnnotation.typeName.name;
        } else if (typeAnnotation.type === "TSUnionType") {
          // Handle union types like Error | CustomError
          const types = typeAnnotation.types
            .map((t: any) => t.typeName?.name || t.type)
            .filter(Boolean);
          errorType = types.join(" | ");
        }
      }
    }

    // Check for error type checks in the catch block (instanceof checks)
    if (!errorType) {
      errorType = detectErrorTypeInCatchBlock(handler.body, errorName);
    }

    const description = errorType
      ? `Catches and handles ${errorType} errors`
      : `Catches and handles errors`;

    errorPatterns.push({
      type: ErrorPatternType.TRY_CATCH,
      errorType,
      description,
    });
  } else {
    // Catch block without parameter (catch { ... })
    errorPatterns.push({
      type: ErrorPatternType.TRY_CATCH,
      description: "Catches and handles errors without accessing error object",
    });
  }

  // Check for finally block
  if (node.finalizer) {
    errorPatterns.push({
      type: ErrorPatternType.TRY_CATCH,
      description: "Includes finally block for cleanup operations",
    });
  }
}

/**
 * Detects error type checks in a catch block (instanceof checks)
 *
 * @param catchBody - Body of the catch block
 * @param errorName - Name of the error parameter
 * @returns Detected error type or undefined
 */
function detectErrorTypeInCatchBlock(
  catchBody: any,
  errorName: string,
): string | undefined {
  if (!catchBody || !catchBody.body) {
    return undefined;
  }

  // Look for instanceof checks in the catch block
  for (const statement of catchBody.body) {
    if (statement.type === "IfStatement") {
      const test = statement.test;

      // Check for: error instanceof ErrorType
      if (test.type === "BinaryExpression" && test.operator === "instanceof") {
        const left = test.left;
        const right = test.right;

        if (
          left.type === "Identifier" &&
          left.name === errorName &&
          right.type === "Identifier"
        ) {
          return right.name;
        }
      }
    }
  }

  return undefined;
}

/**
 * Detects throw statements and extracts error type information
 *
 * @param node - ThrowStatement AST node
 * @param errorPatterns - Array to accumulate detected error patterns
 */
function detectThrowStatement(node: any, errorPatterns: ErrorPattern[]): void {
  const argument = node.argument;

  if (!argument) {
    errorPatterns.push({
      type: ErrorPatternType.THROW,
      description: "Throws an error",
    });
    return;
  }

  let errorType: string | undefined;
  let errorMessage: string | undefined;

  // Detect: throw new ErrorType(message)
  if (argument.type === "NewExpression" && argument.callee) {
    if (argument.callee.type === "Identifier") {
      errorType = argument.callee.name;
    } else if (argument.callee.type === "MemberExpression") {
      // Handle: throw new CustomErrors.ValidationError()
      const object = argument.callee.object?.name;
      const property = argument.callee.property?.name;
      errorType = object && property ? `${object}.${property}` : property;
    }

    // Extract error message if it's a string literal
    if (argument.arguments && argument.arguments.length > 0) {
      const firstArg = argument.arguments[0];
      if (firstArg.type === "StringLiteral") {
        errorMessage = firstArg.value;
      } else if (
        firstArg.type === "TemplateLiteral" &&
        firstArg.quasis &&
        firstArg.quasis.length > 0
      ) {
        errorMessage = firstArg.quasis[0].value.raw;
      }
    }
  }
  // Detect: throw error (re-throwing)
  else if (argument.type === "Identifier") {
    errorType = "existing error";
  }
  // Detect: throw "error message" (string literal)
  else if (argument.type === "StringLiteral") {
    errorMessage = argument.value;
  }

  const description = errorType
    ? `Throws ${errorType}${errorMessage ? `: "${errorMessage}"` : ""}`
    : errorMessage
      ? `Throws error: "${errorMessage}"`
      : "Throws an error";

  errorPatterns.push({
    type: ErrorPatternType.THROW,
    errorType,
    description,
  });
}

/**
 * Detects error handler function calls (e.g., .catch(), error callbacks)
 *
 * @param node - CallExpression AST node
 * @param errorPatterns - Array to accumulate detected error patterns
 */
function detectErrorHandlerCall(
  node: any,
  errorPatterns: ErrorPattern[],
): void {
  const callee = node.callee;

  // Detect .catch() calls on promises
  if (callee.type === "MemberExpression" && callee.property?.name === "catch") {
    const handler = node.arguments?.[0];

    if (handler) {
      errorPatterns.push({
        type: ErrorPatternType.ERROR_HANDLER,
        description: "Handles promise rejection with .catch()",
      });
    }
    return; // Don't check for error-first callback if it's a .catch()
  }

  // Detect error-first callback pattern (callback with error as first parameter)
  // Only for regular function calls, not .catch()
  if (callee.type === "Identifier" || callee.type === "MemberExpression") {
    const callbackArg = node.arguments?.find(
      (arg: any) =>
        arg.type === "FunctionExpression" ||
        arg.type === "ArrowFunctionExpression",
    );

    if (callbackArg && callbackArg.params && callbackArg.params.length > 0) {
      const firstParam = callbackArg.params[0];
      const paramName = firstParam.name?.toLowerCase() || "";

      // Common error parameter names in callbacks
      if (paramName === "err" || paramName === "error" || paramName === "e") {
        errorPatterns.push({
          type: ErrorPatternType.ERROR_HANDLER,
          description: "Uses error-first callback pattern",
        });
      }
    }
  }
}
