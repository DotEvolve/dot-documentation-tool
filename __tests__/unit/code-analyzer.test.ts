/**
 * Unit tests for CodeAnalyzer
 */

import { CodeAnalyzer } from "../../src/analyzers/CodeAnalyzer";
import { CodeElementType, HTTPMethod } from "../../src/types";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("CodeAnalyzer", () => {
  let analyzer: CodeAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    analyzer = new CodeAnalyzer();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-analyzer-test-"));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("analyzeFile", () => {
    it("should parse a simple JavaScript file with a function", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        function greet(name) {
          return 'Hello, ' + name;
        }
      `,
      );

      const elements = analyzer.analyzeFile(testFile);

      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe(CodeElementType.FUNCTION);
      expect(elements[0].name).toBe("greet");
      expect(elements[0].filePath).toBe(testFile);
      expect(elements[0].lineNumber).toBeGreaterThan(0);
    });

    it("should parse a TypeScript file with a function", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function add(a: number, b: number): number {
          return a + b;
        }
      `,
      );

      const elements = analyzer.analyzeFile(testFile);

      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe(CodeElementType.FUNCTION);
      expect(elements[0].name).toBe("add");
    });

    it("should parse arrow functions", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        const multiply = (a, b) => a * b;
      `,
      );

      const elements = analyzer.analyzeFile(testFile);

      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe(CodeElementType.FUNCTION);
      expect(elements[0].name).toBe("multiply");
    });

    it("should parse class declarations", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        class Calculator {
          add(a, b) {
            return a + b;
          }
          
          subtract(a, b) {
            return a - b;
          }
        }
      `,
      );

      const elements = analyzer.analyzeFile(testFile);

      expect(elements.length).toBeGreaterThanOrEqual(1);

      const classElement = elements.find(
        (e) => e.type === CodeElementType.CLASS,
      );
      expect(classElement).toBeDefined();
      expect(classElement?.name).toBe("Calculator");

      const methods = elements.filter((e) => e.type === CodeElementType.METHOD);
      expect(methods.length).toBe(2);
      expect(methods.map((m) => m.name)).toContain("Calculator.add");
      expect(methods.map((m) => m.name)).toContain("Calculator.subtract");
    });

    it("should parse exported functions", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        export function exportedFunc() {
          return 'exported';
        }
      `,
      );

      const elements = analyzer.analyzeFile(testFile);

      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe(CodeElementType.FUNCTION);
      expect(elements[0].name).toBe("exportedFunc");
      expect(elements[0].context.exported).toBe(true);
    });

    it("should handle multiple top-level declarations", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        function func1() {}
        const func2 = () => {};
        class MyClass {}
      `,
      );

      const elements = analyzer.analyzeFile(testFile);

      expect(elements.length).toBe(3);
      expect(elements.map((e) => e.name)).toContain("func1");
      expect(elements.map((e) => e.name)).toContain("func2");
      expect(elements.map((e) => e.name)).toContain("MyClass");
    });

    it("should throw error for unsupported file extensions", () => {
      const testFile = path.join(tempDir, "test.txt");
      fs.writeFileSync(testFile, "some content");

      expect(() => analyzer.analyzeFile(testFile)).toThrow(
        "Unsupported file extension",
      );
    });

    it("should throw error for non-existent files", () => {
      const testFile = path.join(tempDir, "nonexistent.js");

      expect(() => analyzer.analyzeFile(testFile)).toThrow(
        "Failed to read file",
      );
    });

    it("should throw error for files with syntax errors", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(testFile, "function broken( { this is invalid syntax");

      expect(() => analyzer.analyzeFile(testFile)).toThrow(
        "Failed to parse file",
      );
    });

    it("should capture import context", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        import fs from 'fs';
        import path from 'path';
        
        function useImports() {
          return fs.readFileSync('test.txt');
        }
      `,
      );

      const elements = analyzer.analyzeFile(testFile);

      expect(elements).toHaveLength(1);
      expect(elements[0].context.imports).toContain("fs");
      expect(elements[0].context.imports).toContain("path");
    });
  });

  describe("extractFunctionSignature", () => {
    it("should extract signature from a regular function declaration", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function greet(name: string): string {
          return 'Hello, ' + name;
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.name).toBe("greet");
      expect(signature.parameters).toHaveLength(1);
      expect(signature.parameters[0].name).toBe("name");
      expect(signature.parameters[0].type).toBe("string");
      expect(signature.parameters[0].optional).toBe(false);
      expect(signature.returnType).toBe("string");
      expect(signature.isAsync).toBe(false);
      expect(signature.isGenerator).toBe(false);
    });

    it("should extract signature from an arrow function", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        const add = (a: number, b: number): number => a + b;
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const varDecl = ast.program.body.find(
        (n: any) => n.type === "VariableDeclaration",
      );
      const arrowFunc = varDecl.declarations[0].init;

      const signature = analyzer.extractFunctionSignature(arrowFunc);

      expect(signature.parameters).toHaveLength(2);
      expect(signature.parameters[0].name).toBe("a");
      expect(signature.parameters[0].type).toBe("number");
      expect(signature.parameters[1].name).toBe("b");
      expect(signature.parameters[1].type).toBe("number");
      expect(signature.returnType).toBe("number");
      expect(signature.isAsync).toBe(false);
    });

    it("should detect async functions", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        async function fetchData(url: string): Promise<any> {
          return await fetch(url);
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.name).toBe("fetchData");
      expect(signature.isAsync).toBe(true);
      expect(signature.parameters).toHaveLength(1);
      expect(signature.parameters[0].name).toBe("url");
      expect(signature.parameters[0].type).toBe("string");
    });

    it("should detect generator functions", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        function* generateNumbers() {
          yield 1;
          yield 2;
          yield 3;
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.name).toBe("generateNumbers");
      expect(signature.isGenerator).toBe(true);
      expect(signature.isAsync).toBe(false);
    });

    it("should handle optional parameters", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function greet(name: string, title?: string): string {
          return title ? title + ' ' + name : name;
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(2);
      expect(signature.parameters[0].optional).toBe(false);
      expect(signature.parameters[1].name).toBe("title");
      expect(signature.parameters[1].optional).toBe(true);
      expect(signature.parameters[1].type).toBe("string");
    });

    it("should handle parameters with default values", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function multiply(a: number, b: number = 2): number {
          return a * b;
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(2);
      expect(signature.parameters[1].name).toBe("b");
      expect(signature.parameters[1].type).toBe("number");
      expect(signature.parameters[1].defaultValue).toBe("2");
    });

    it("should handle rest parameters", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function sum(...numbers: number[]): number {
          return numbers.reduce((a, b) => a + b, 0);
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(1);
      expect(signature.parameters[0].name).toBe("...numbers");
      expect(signature.parameters[0].type).toBe("number[]");
    });

    it("should handle destructured object parameters", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function greet({ name, age }: { name: string; age: number }): string {
          return \`\${name} is \${age} years old\`;
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(1);
      expect(signature.parameters[0].name).toBe("{destructured}");
      expect(signature.parameters[0].type).toBeDefined();
    });

    it("should handle destructured array parameters", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function getFirst([first, ...rest]: number[]): number {
          return first;
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(1);
      expect(signature.parameters[0].name).toBe("[destructured]");
    });

    it("should handle functions with no parameters", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function getCurrentTime(): Date {
          return new Date();
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.name).toBe("getCurrentTime");
      expect(signature.parameters).toHaveLength(0);
      expect(signature.returnType).toBe("Date");
    });

    it("should handle function expressions", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        const divide = function(a: number, b: number): number {
          return a / b;
        };
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const varDecl = ast.program.body.find(
        (n: any) => n.type === "VariableDeclaration",
      );
      const funcExpr = varDecl.declarations[0].init;

      const signature = analyzer.extractFunctionSignature(funcExpr);

      expect(signature.parameters).toHaveLength(2);
      expect(signature.parameters[0].name).toBe("a");
      expect(signature.parameters[0].type).toBe("number");
      expect(signature.returnType).toBe("number");
    });

    it("should extract various default value types", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function test(
          str: string = "default",
          num: number = 42,
          bool: boolean = true,
          nil: any = null,
          arr: any[] = [],
          obj: any = {}
        ): void {}
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(6);
      expect(signature.parameters[0].defaultValue).toBe('"default"');
      expect(signature.parameters[1].defaultValue).toBe("42");
      expect(signature.parameters[2].defaultValue).toBe("true");
      expect(signature.parameters[3].defaultValue).toBe("null");
      expect(signature.parameters[4].defaultValue).toBe("[]");
      expect(signature.parameters[5].defaultValue).toBe("{}");
    });

    it("should handle complex TypeScript types", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function process(
          items: string[],
          callback: Function,
          options: object
        ): void {}
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(3);
      expect(signature.parameters[0].type).toBe("string[]");
      expect(signature.parameters[1].type).toBe("Function");
      expect(signature.parameters[2].type).toBe("object");
      expect(signature.returnType).toBe("void");
    });

    it("should handle union types", () => {
      const testFile = path.join(tempDir, "test.ts");
      fs.writeFileSync(
        testFile,
        `
        function getValue(input: string | number): string | number {
          return input;
        }
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".ts");
      const funcNode = ast.program.body.find(
        (n: any) => n.type === "FunctionDeclaration",
      );

      const signature = analyzer.extractFunctionSignature(funcNode);

      expect(signature.parameters).toHaveLength(1);
      expect(signature.parameters[0].type).toBe("string | number");
      expect(signature.returnType).toBe("string | number");
    });
  });

  describe("identifyAPIRoute", () => {
    it("should detect app.get() route", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.get('/users', (req, res) => {
          res.json({ users: [] });
        });
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.method).toBe(HTTPMethod.GET);
      expect(routeInfo?.path).toBe("/users");
      expect(routeInfo?.middleware).toHaveLength(1);
      expect(routeInfo?.middleware[0]).toBe("(inline handler)");
      expect(routeInfo?.requiresAuth).toBe(false);
    });

    it("should detect app.post() route", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.post('/users', createUser);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.method).toBe(HTTPMethod.POST);
      expect(routeInfo?.path).toBe("/users");
      expect(routeInfo?.middleware).toHaveLength(1);
      expect(routeInfo?.middleware[0]).toBe("createUser");
    });

    it("should detect router.put() route", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        router.put('/users/:id', updateUser);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.method).toBe(HTTPMethod.PUT);
      expect(routeInfo?.path).toBe("/users/:id");
      expect(routeInfo?.middleware).toHaveLength(1);
      expect(routeInfo?.middleware[0]).toBe("updateUser");
    });

    it("should detect router.delete() route", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        router.delete('/users/:id', deleteUser);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.method).toBe(HTTPMethod.DELETE);
      expect(routeInfo?.path).toBe("/users/:id");
    });

    it("should detect app.patch() route", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.patch('/users/:id', patchUser);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.method).toBe(HTTPMethod.PATCH);
      expect(routeInfo?.path).toBe("/users/:id");
    });

    it("should detect routes with multiple middleware", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.get('/protected', authenticate, authorize, getProtectedData);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.middleware).toHaveLength(3);
      expect(routeInfo?.middleware).toContain("authenticate");
      expect(routeInfo?.middleware).toContain("authorize");
      expect(routeInfo?.middleware).toContain("getProtectedData");
    });

    it("should detect authentication middleware", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.get('/profile', authenticate, getProfile);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.requiresAuth).toBe(true);
    });

    it("should detect authentication middleware with different naming patterns", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.get('/admin', isAuthenticated, adminHandler);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.requiresAuth).toBe(true);
    });

    it("should detect protected routes", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.get('/secret', protectedRoute, getSecret);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.requiresAuth).toBe(true);
    });

    it("should return null for non-route expressions", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        const x = 5;
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const varDecl = ast.program.body.find(
        (n: any) => n.type === "VariableDeclaration",
      );

      const routeInfo = analyzer.identifyAPIRoute(varDecl);

      expect(routeInfo).toBeNull();
    });

    it("should return null for non-app/router objects", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        server.get('/test', handler);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).toBeNull();
    });

    it("should return null for unsupported HTTP methods", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.options('/test', handler);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).toBeNull();
    });

    it("should handle routes with array of middleware", () => {
      const testFile = path.join(tempDir, "test.js");
      fs.writeFileSync(
        testFile,
        `
        app.get('/api', [authenticate, rateLimit], handler);
      `,
      );

      const content = fs.readFileSync(testFile, "utf-8");
      const ast = (analyzer as any).parseFile(content, ".js");
      const exprStmt = ast.program.body.find(
        (n: any) => n.type === "ExpressionStatement",
      );

      const routeInfo = analyzer.identifyAPIRoute(exprStmt);

      expect(routeInfo).not.toBeNull();
      expect(routeInfo?.middleware).toContain("authenticate");
      expect(routeInfo?.middleware).toContain("rateLimit");
      expect(routeInfo?.middleware).toContain("handler");
      expect(routeInfo?.requiresAuth).toBe(true);
    });
  });
});
