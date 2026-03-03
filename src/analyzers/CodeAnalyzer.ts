/**
 * CodeAnalyzer - Parses source files and identifies code elements
 *
 * Uses @babel/parser to create an AST and extract top-level declarations
 * that need documentation. Handles both JavaScript and TypeScript files.
 */

import * as parser from "@babel/parser";
import * as fs from "fs";
import * as path from "path";
import {
  CodeElement,
  CodeElementType,
  CodeContext,
  FunctionSignature,
  Parameter,
  RouteInfo,
  HTTPMethod,
} from "../types";

/**
 * Main code analyzer class for parsing source files
 */
export class CodeAnalyzer {
  /**
   * Analyzes a source file and extracts code elements that need documentation
   *
   * @param filePath - Path to the JavaScript or TypeScript file to analyze
   * @returns Array of code elements found in the file
   * @throws Error if file cannot be read or parsed
   */
  analyzeFile(filePath: string): CodeElement[] {
    // Validate file extension
    const ext = path.extname(filePath);
    if (![".js", ".ts", ".jsx", ".tsx"].includes(ext)) {
      throw new Error(
        `Unsupported file extension: ${ext}. Only .js, .ts, .jsx, and .tsx files are supported.`,
      );
    }

    // Read file content
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }

    // Parse file into AST
    let ast;
    try {
      ast = this.parseFile(content, ext);
    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error}`);
    }

    // Extract code elements from AST
    const elements = this.extractCodeElements(ast, filePath);

    return elements;
  }

  /**
   * Parses file content into an Abstract Syntax Tree
   *
   * @param content - Source code content
   * @param extension - File extension to determine parser plugins
   * @returns Parsed AST
   */
  private parseFile(content: string, extension: string): any {
    const isTypeScript = extension === ".ts" || extension === ".tsx";
    const isJSX = extension === ".jsx" || extension === ".tsx";

    const plugins: parser.ParserPlugin[] = [];

    if (isTypeScript) {
      plugins.push("typescript");
    }

    if (isJSX) {
      plugins.push("jsx");
    }

    return parser.parse(content, {
      sourceType: "module",
      plugins: plugins,
      // Allow various modern JavaScript features
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
      allowSuperOutsideMethod: true,
      allowUndeclaredExports: true,
    });
  }

  /**
   * Extracts code elements from the AST
   *
   * @param ast - Parsed Abstract Syntax Tree
   * @param filePath - Path to the source file
   * @returns Array of code elements found in the AST
   */
  private extractCodeElements(ast: any, filePath: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const context: CodeContext = {
      imports: [],
      exports: [],
      dependencies: [],
    };

    // Walk through top-level declarations in the program
    if (ast.program && ast.program.body) {
      for (const node of ast.program.body) {
        // Extract imports for context
        if (node.type === "ImportDeclaration") {
          context.imports?.push(node.source.value);
        }

        // Function declarations
        if (node.type === "FunctionDeclaration" && node.id) {
          const signature = this.extractFunctionSignature(node);
          elements.push({
            type: CodeElementType.FUNCTION,
            name: node.id.name,
            filePath: filePath,
            lineNumber: node.loc?.start.line || 0,
            signature: signature,
            context: { ...context },
          });
        }

        // Class declarations
        if (node.type === "ClassDeclaration" && node.id) {
          elements.push({
            type: CodeElementType.CLASS,
            name: node.id.name,
            filePath: filePath,
            lineNumber: node.loc?.start.line || 0,
            context: { ...context },
          });

          // Extract methods from class
          if (node.body && node.body.body) {
            for (const member of node.body.body) {
              if (member.type === "ClassMethod" && member.key) {
                const methodName = member.key.name || member.key.value;
                const signature = this.extractFunctionSignature(member);
                elements.push({
                  type: CodeElementType.METHOD,
                  name: `${node.id.name}.${methodName}`,
                  filePath: filePath,
                  lineNumber: member.loc?.start.line || 0,
                  signature: signature,
                  context: { ...context, className: node.id.name },
                });
              }
            }
          }
        }

        // Variable declarations with function expressions or arrow functions
        if (node.type === "VariableDeclaration") {
          for (const declaration of node.declarations) {
            if (declaration.id && declaration.id.type === "Identifier") {
              const init = declaration.init;

              // Arrow functions or function expressions
              if (
                init &&
                (init.type === "ArrowFunctionExpression" ||
                  init.type === "FunctionExpression")
              ) {
                const signature = this.extractFunctionSignature(init);
                elements.push({
                  type: CodeElementType.FUNCTION,
                  name: declaration.id.name,
                  filePath: filePath,
                  lineNumber: node.loc?.start.line || 0,
                  signature: signature,
                  context: { ...context },
                });
              }
            }
          }
        }

        // Export declarations
        if (
          node.type === "ExportNamedDeclaration" ||
          node.type === "ExportDefaultDeclaration"
        ) {
          if (node.declaration) {
            // Handle exported function declarations
            if (
              node.declaration.type === "FunctionDeclaration" &&
              node.declaration.id
            ) {
              const signature = this.extractFunctionSignature(node.declaration);
              elements.push({
                type: CodeElementType.FUNCTION,
                name: node.declaration.id.name,
                filePath: filePath,
                lineNumber: node.declaration.loc?.start.line || 0,
                signature: signature,
                context: { ...context, exported: true },
              });
            }

            // Handle exported class declarations
            if (
              node.declaration.type === "ClassDeclaration" &&
              node.declaration.id
            ) {
              elements.push({
                type: CodeElementType.CLASS,
                name: node.declaration.id.name,
                filePath: filePath,
                lineNumber: node.declaration.loc?.start.line || 0,
                context: { ...context, exported: true },
              });
            }
          }
        }
      }
    }

    return elements;
  }
  /**
   * Extracts function signature details from an AST node
   *
   * Handles function declarations, function expressions, arrow functions,
   * async functions, and generator functions. Extracts parameter information
   * including types, default values, and optional flags.
   *
   * @param node - AST node representing a function
   * @returns Function signature with name, parameters, return type, and flags
   */
  extractFunctionSignature(node: any): FunctionSignature {
    // Determine function name
    let name = "anonymous";
    if (node.id && node.id.name) {
      name = node.id.name;
    } else if (node.key && node.key.name) {
      // For class methods
      name = node.key.name;
    }

    // Check if async or generator
    const isAsync = node.async === true;
    const isGenerator = node.generator === true;

    // Extract parameters
    const parameters: Parameter[] = [];
    if (node.params) {
      for (const param of node.params) {
        parameters.push(this.extractParameter(param));
      }
    }

    // Extract return type (TypeScript)
    let returnType: string | undefined;
    if (node.returnType) {
      returnType = this.extractTypeAnnotation(node.returnType);
    }

    return {
      name,
      parameters,
      returnType,
      isAsync,
      isGenerator,
    };
  }

  /**
   * Extracts parameter information from an AST parameter node
   *
   * @param param - AST node representing a function parameter
   * @returns Parameter object with name, type, optional flag, and default value
   */
  /**
   * Extracts parameter information from an AST parameter node
   *
   * @param param - AST node representing a function parameter
   * @returns Parameter object with name, type, optional flag, and default value
   */
  private extractParameter(param: any): Parameter {
    let name = "unknown";
    let type: string | undefined;
    let optional = false;
    let defaultValue: string | undefined;

    // Handle different parameter patterns
    if (param.type === "Identifier") {
      name = param.name;

      // Check for type annotation (TypeScript)
      if (param.typeAnnotation) {
        type = this.extractTypeAnnotation(param.typeAnnotation);
      }

      // Check if optional (TypeScript)
      optional = param.optional === true;
    } else if (param.type === "AssignmentPattern") {
      // Parameter with default value
      if (param.left.type === "Identifier") {
        name = param.left.name;

        if (param.left.typeAnnotation) {
          type = this.extractTypeAnnotation(param.left.typeAnnotation);
        }

        optional = param.left.optional === true;
      }

      // Extract default value
      defaultValue = this.extractDefaultValue(param.right);
    } else if (param.type === "RestElement") {
      // Rest parameter (...args)
      if (param.argument.type === "Identifier") {
        name = `...${param.argument.name}`;

        // Extract type from the argument's type annotation
        if (param.argument.typeAnnotation) {
          type = this.extractTypeAnnotation(param.argument.typeAnnotation);
        } else if (param.typeAnnotation) {
          type = this.extractTypeAnnotation(param.typeAnnotation);
        }
      }
    } else if (param.type === "ObjectPattern") {
      // Destructured object parameter
      name = "{destructured}";

      if (param.typeAnnotation) {
        type = this.extractTypeAnnotation(param.typeAnnotation);
      }
    } else if (param.type === "ArrayPattern") {
      // Destructured array parameter
      name = "[destructured]";

      if (param.typeAnnotation) {
        type = this.extractTypeAnnotation(param.typeAnnotation);
      }
    }

    return {
      name,
      type,
      optional,
      defaultValue,
    };
  }

  /**
   * Extracts type information from a TypeScript type annotation node
   *
   * @param typeAnnotation - AST node representing a type annotation
   * @returns String representation of the type
   */
  /**
   * Extracts type information from a TypeScript type annotation node
   *
   * @param typeAnnotation - AST node representing a type annotation
   * @returns String representation of the type
   */
  private extractTypeAnnotation(typeAnnotation: any): string {
    if (!typeAnnotation) {
      return "any";
    }

    // Handle TSTypeAnnotation wrapper
    const typeNode = typeAnnotation.typeAnnotation || typeAnnotation;

    switch (typeNode.type) {
      case "TSStringKeyword":
        return "string";
      case "TSNumberKeyword":
        return "number";
      case "TSBooleanKeyword":
        return "boolean";
      case "TSAnyKeyword":
        return "any";
      case "TSVoidKeyword":
        return "void";
      case "TSNullKeyword":
        return "null";
      case "TSUndefinedKeyword":
        return "undefined";
      case "TSUnknownKeyword":
        return "unknown";
      case "TSNeverKeyword":
        return "never";
      case "TSObjectKeyword":
        return "object";
      case "TSArrayType":
        return `${this.extractTypeAnnotation(typeNode.elementType)}[]`;
      case "TSTypeReference":
        if (typeNode.typeName && typeNode.typeName.name) {
          return typeNode.typeName.name;
        }
        return "unknown";
      case "TSUnionType":
        if (typeNode.types) {
          return typeNode.types
            .map((t: any) => this.extractTypeAnnotation(t))
            .join(" | ");
        }
        return "unknown";
      case "TSIntersectionType":
        if (typeNode.types) {
          return typeNode.types
            .map((t: any) => this.extractTypeAnnotation(t))
            .join(" & ");
        }
        return "unknown";
      case "TSFunctionType":
        return "Function";
      case "TSTypeLiteral":
        return "object";
      default:
        return "any";
    }
  }

  /**
   * Extracts the default value from an AST node
   *
   * @param node - AST node representing a default value
   * @returns String representation of the default value
   */
  private extractDefaultValue(node: any): string {
    if (!node) {
      return "undefined";
    }

    switch (node.type) {
      case "StringLiteral":
        return `"${node.value}"`;
      case "NumericLiteral":
        return String(node.value);
      case "BooleanLiteral":
        return String(node.value);
      case "NullLiteral":
        return "null";
      case "Identifier":
        return node.name;
      case "ArrayExpression":
        return "[]";
      case "ObjectExpression":
        return "{}";
      case "UnaryExpression":
        if (node.operator === "-" && node.argument.type === "NumericLiteral") {
          return `-${node.argument.value}`;
        }
        return "undefined";
      default:
        return "undefined";
    }
  }

  /**
   * Identifies Express.js API route definitions from an AST node
   *
   * Detects patterns like:
   * - app.get('/path', handler)
   * - app.post('/path', middleware, handler)
   * - router.use('/path', middleware)
   * - router.METHOD('/path', ...)
   *
   * @param node - AST node to analyze for route patterns
   * @returns RouteInfo object if node is a route, null otherwise
   */
  identifyAPIRoute(node: any): RouteInfo | null {
    // Check if this is an expression statement containing a call expression
    let callExpression = node;

    if (node.type === "ExpressionStatement" && node.expression) {
      callExpression = node.expression;
    }

    if (callExpression.type !== "CallExpression") {
      return null;
    }

    // Check if the callee is a member expression (e.g., app.get, router.post)
    const callee = callExpression.callee;
    if (callee.type !== "MemberExpression") {
      return null;
    }

    // Extract the object name (app, router, etc.)
    const objectName = callee.object?.name;
    if (!objectName || !["app", "router"].includes(objectName)) {
      return null;
    }

    // Extract the method name (get, post, put, patch, delete, use, all)
    const methodName = callee.property?.name;
    if (!methodName) {
      return null;
    }

    // Map method names to HTTP methods
    const httpMethodMap: Record<string, HTTPMethod | null> = {
      get: HTTPMethod.GET,
      post: HTTPMethod.POST,
      put: HTTPMethod.PUT,
      patch: HTTPMethod.PATCH,
      delete: HTTPMethod.DELETE,
    };

    const httpMethod = httpMethodMap[methodName.toLowerCase()];
    if (!httpMethod) {
      return null;
    }

    // Extract arguments: first should be path, rest are middleware/handlers
    const args = callExpression.arguments;
    if (!args || args.length === 0) {
      return null;
    }

    // Extract path (first argument)
    let path = "/";
    const firstArg = args[0];
    if (firstArg.type === "StringLiteral") {
      path = firstArg.value;
    } else if (
      firstArg.type === "TemplateLiteral" &&
      firstArg.quasis.length === 1
    ) {
      path = firstArg.quasis[0].value.raw;
    }

    // Extract middleware names from remaining arguments
    const middleware: string[] = [];
    let requiresAuth = false;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];

      // Identifier (named function or middleware)
      if (arg.type === "Identifier") {
        middleware.push(arg.name);

        // Check for authentication middleware patterns
        const name = arg.name.toLowerCase();
        if (
          name.includes("auth") ||
          name.includes("authenticate") ||
          name.includes("protected")
        ) {
          requiresAuth = true;
        }
      }
      // Arrow function or function expression (inline handler)
      else if (
        arg.type === "ArrowFunctionExpression" ||
        arg.type === "FunctionExpression"
      ) {
        middleware.push("(inline handler)");
      }
      // Array of middleware
      else if (arg.type === "ArrayExpression" && arg.elements) {
        for (const element of arg.elements) {
          if (element && element.type === "Identifier") {
            middleware.push(element.name);

            const name = element.name.toLowerCase();
            if (
              name.includes("auth") ||
              name.includes("authenticate") ||
              name.includes("protected")
            ) {
              requiresAuth = true;
            }
          }
        }
      }
    }

    // Build RouteInfo object
    const routeInfo: RouteInfo = {
      method: httpMethod,
      path: path,
      middleware: middleware,
      requiresAuth: requiresAuth,
      responses: [], // Will be populated by further analysis or documentation generation
    };

    return routeInfo;
  }
}
