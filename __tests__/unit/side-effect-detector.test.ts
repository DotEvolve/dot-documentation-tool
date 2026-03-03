/**
 * Unit tests for SideEffectDetector - Error Detection
 *
 * Tests for Task 4.2: Implement error detection
 * Requirements: 2.4, 8.1, 8.2
 */

import { detectErrorHandling } from "../../src/analyzers/SideEffectDetector";
import { ErrorPatternType } from "../../src/types";
import { parse } from "@babel/parser";

describe("SideEffectDetector - Error Detection", () => {
  /**
   * Helper function to parse code and extract the first function node
   */
  function parseFunction(code: string): any {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    // Find the first function declaration, expression, or arrow function
    for (const node of ast.program.body) {
      if (node.type === "FunctionDeclaration") {
        return node;
      }
      if (node.type === "VariableDeclaration") {
        const init = node.declarations[0]?.init;
        if (
          init &&
          (init.type === "FunctionExpression" ||
            init.type === "ArrowFunctionExpression")
        ) {
          return init;
        }
      }
      if (
        node.type === "ExpressionStatement" &&
        node.expression.type === "FunctionExpression"
      ) {
        return node.expression;
      }
    }

    return null;
  }

  describe("Try-Catch Block Detection", () => {
    it("should detect basic try-catch block", () => {
      const code = `
        function test() {
          try {
            riskyOperation();
          } catch (error) {
            console.error(error);
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.TRY_CATCH);
      expect(patterns[0].description).toContain("Catches and handles errors");
    });

    it("should detect try-catch with typed error (TypeScript)", () => {
      const code = `
        function test() {
          try {
            riskyOperation();
          } catch (error: Error) {
            console.error(error);
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.TRY_CATCH);
      expect(patterns[0].errorType).toBe("Error");
      expect(patterns[0].description).toContain(
        "Catches and handles Error errors",
      );
    });

    it("should detect try-catch with instanceof check", () => {
      const code = `
        function test() {
          try {
            riskyOperation();
          } catch (error) {
            if (error instanceof ValidationError) {
              handleValidationError(error);
            }
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.TRY_CATCH);
      expect(patterns[0].errorType).toBe("ValidationError");
      expect(patterns[0].description).toContain("ValidationError");
    });

    it("should detect try-catch with finally block", () => {
      const code = `
        function test() {
          try {
            riskyOperation();
          } catch (error) {
            console.error(error);
          } finally {
            cleanup();
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns.length).toBeGreaterThanOrEqual(2);
      expect(
        patterns.some((p) => p.description.includes("finally block")),
      ).toBe(true);
    });

    it("should detect try-catch without error parameter", () => {
      const code = `
        function test() {
          try {
            riskyOperation();
          } catch {
            console.error('An error occurred');
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.TRY_CATCH);
      expect(patterns[0].description).toContain(
        "without accessing error object",
      );
    });

    it("should detect try-catch with union type (TypeScript)", () => {
      const code = `
        function test() {
          try {
            riskyOperation();
          } catch (error: Error | CustomError) {
            console.error(error);
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.TRY_CATCH);
      expect(patterns[0].errorType).toContain("Error");
      expect(patterns[0].errorType).toContain("CustomError");
    });
  });

  describe("Throw Statement Detection", () => {
    it("should detect throw with new Error", () => {
      const code = `
        function test() {
          throw new Error('Something went wrong');
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.THROW);
      expect(patterns[0].errorType).toBe("Error");
      expect(patterns[0].description).toContain("Throws Error");
      expect(patterns[0].description).toContain("Something went wrong");
    });

    it("should detect throw with custom error type", () => {
      const code = `
        function test() {
          throw new ValidationError('Invalid input');
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.THROW);
      expect(patterns[0].errorType).toBe("ValidationError");
      expect(patterns[0].description).toContain("ValidationError");
    });

    it("should detect throw with namespaced error", () => {
      const code = `
        function test() {
          throw new CustomErrors.ValidationError('Invalid input');
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.THROW);
      expect(patterns[0].errorType).toBe("CustomErrors.ValidationError");
    });

    it("should detect throw with string literal", () => {
      const code = `
        function test() {
          throw "Error message";
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.THROW);
      expect(patterns[0].description).toContain("Error message");
    });

    it("should detect re-throwing existing error", () => {
      const code = `
        function test() {
          try {
            riskyOperation();
          } catch (error) {
            console.error(error);
            throw error;
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns.length).toBeGreaterThanOrEqual(2);
      const throwPattern = patterns.find(
        (p) => p.type === ErrorPatternType.THROW,
      );
      expect(throwPattern).toBeDefined();
      expect(throwPattern?.errorType).toBe("existing error");
    });

    it("should detect throw with template literal message", () => {
      const code = `
        function test(value) {
          throw new Error(\`Invalid value: \${value}\`);
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.THROW);
      expect(patterns[0].errorType).toBe("Error");
      expect(patterns[0].description).toContain("Invalid value");
    });

    it("should detect multiple throw statements", () => {
      const code = `
        function test(value) {
          if (value < 0) {
            throw new Error('Value must be positive');
          }
          if (value > 100) {
            throw new Error('Value must be less than 100');
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(2);
      expect(patterns.every((p) => p.type === ErrorPatternType.THROW)).toBe(
        true,
      );
    });
  });

  describe("Express Error Middleware Detection", () => {
    it("should detect Express error middleware with 4 parameters", () => {
      const code = `
        function errorHandler(err, req, res, next) {
          console.error(err);
          res.status(500).json({ error: err.message });
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.ERROR_MIDDLEWARE);
      expect(patterns[0].description).toContain("Express error middleware");
      expect(patterns[0].description).toContain("4 parameters");
    });

    it('should detect Express error middleware with "error" parameter name', () => {
      const code = `
        function errorHandler(error, req, res, next) {
          console.error(error);
          res.status(500).json({ error: error.message });
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.ERROR_MIDDLEWARE);
    });

    it('should detect Express error middleware with "e" parameter name', () => {
      const code = `
        function errorHandler(e, req, res, next) {
          console.error(e);
          res.status(500).json({ error: e.message });
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.ERROR_MIDDLEWARE);
    });

    it("should not detect regular middleware with 3 parameters", () => {
      const code = `
        function regularMiddleware(req, res, next) {
          console.log('Regular middleware');
          next();
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(
        patterns.filter((p) => p.type === ErrorPatternType.ERROR_MIDDLEWARE),
      ).toHaveLength(0);
    });

    it("should not detect 4-parameter function without error-like first param", () => {
      const code = `
        function someFunction(a, b, c, d) {
          return a + b + c + d;
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(
        patterns.filter((p) => p.type === ErrorPatternType.ERROR_MIDDLEWARE),
      ).toHaveLength(0);
    });

    it("should detect arrow function error middleware", () => {
      const code = `
        const errorHandler = (err, req, res, next) => {
          console.error(err);
          res.status(500).json({ error: err.message });
        };
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.ERROR_MIDDLEWARE);
    });
  });

  describe("Error Handler Call Detection", () => {
    it("should detect .catch() on promises", () => {
      const code = `
        function test() {
          fetchData()
            .catch(error => {
              console.error(error);
            });
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.ERROR_HANDLER);
      expect(patterns[0].description).toContain(".catch()");
    });

    it("should detect error-first callback pattern", () => {
      const code = `
        function test() {
          fs.readFile('file.txt', (err, data) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log(data);
          });
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.ERROR_HANDLER);
      expect(patterns[0].description).toContain("error-first callback");
    });

    it('should detect error-first callback with "error" parameter', () => {
      const code = `
        function test() {
          someAsyncOperation((error, result) => {
            if (error) {
              handleError(error);
            }
          });
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe(ErrorPatternType.ERROR_HANDLER);
    });

    it("should detect multiple .catch() calls", () => {
      const code = `
        function test() {
          fetchData()
            .catch(error => console.error(error));
          
          fetchMoreData()
            .catch(error => console.error(error));
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(
        patterns.filter((p) => p.type === ErrorPatternType.ERROR_HANDLER),
      ).toHaveLength(2);
    });
  });

  describe("Complex Error Handling Scenarios", () => {
    it("should detect multiple error handling patterns in one function", () => {
      const code = `
        function complexFunction() {
          try {
            const data = fetchData();
            if (!data) {
              throw new Error('No data');
            }
          } catch (error) {
            console.error(error);
          }
          
          asyncOperation()
            .catch(err => console.error(err));
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns.length).toBeGreaterThanOrEqual(3);
      expect(patterns.some((p) => p.type === ErrorPatternType.TRY_CATCH)).toBe(
        true,
      );
      expect(patterns.some((p) => p.type === ErrorPatternType.THROW)).toBe(
        true,
      );
      expect(
        patterns.some((p) => p.type === ErrorPatternType.ERROR_HANDLER),
      ).toBe(true);
    });

    it("should detect nested try-catch blocks", () => {
      const code = `
        function test() {
          try {
            try {
              innerOperation();
            } catch (innerError) {
              console.error(innerError);
            }
          } catch (outerError) {
            console.error(outerError);
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(
        patterns.filter((p) => p.type === ErrorPatternType.TRY_CATCH).length,
      ).toBeGreaterThanOrEqual(2);
    });

    it("should handle function with no error handling", () => {
      const code = `
        function test() {
          const result = calculate(1, 2);
          return result;
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(0);
    });

    it("should handle empty function", () => {
      const code = `
        function test() {}
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns).toHaveLength(0);
    });

    it("should handle null node", () => {
      const patterns = detectErrorHandling(null);
      expect(patterns).toHaveLength(0);
    });

    it("should handle node without body", () => {
      const patterns = detectErrorHandling({
        type: "FunctionDeclaration",
        params: [],
      });
      expect(patterns).toHaveLength(0);
    });
  });

  describe("Real-world Error Handling Patterns", () => {
    it("should detect async/await with try-catch", () => {
      const code = `
        async function fetchUser(id) {
          try {
            const response = await fetch(\`/api/users/\${id}\`);
            return await response.json();
          } catch (error) {
            console.error('Failed to fetch user:', error);
            throw new Error('User fetch failed');
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns.length).toBeGreaterThanOrEqual(2);
      expect(patterns.some((p) => p.type === ErrorPatternType.TRY_CATCH)).toBe(
        true,
      );
      expect(patterns.some((p) => p.type === ErrorPatternType.THROW)).toBe(
        true,
      );
    });

    it("should detect error transformation pattern", () => {
      const code = `
        function processData(data) {
          try {
            return parse(data);
          } catch (error) {
            throw new ValidationError('Invalid data format', { cause: error });
          }
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(patterns.length).toBeGreaterThanOrEqual(2);
      const throwPattern = patterns.find(
        (p) => p.type === ErrorPatternType.THROW,
      );
      expect(throwPattern?.errorType).toBe("ValidationError");
    });

    it("should detect conditional error throwing", () => {
      const code = `
        function validateAge(age) {
          if (age < 0) {
            throw new Error('Age cannot be negative');
          }
          if (age > 150) {
            throw new Error('Age is unrealistic');
          }
          return true;
        }
      `;

      const funcNode = parseFunction(code);
      const patterns = detectErrorHandling(funcNode);

      expect(
        patterns.filter((p) => p.type === ErrorPatternType.THROW),
      ).toHaveLength(2);
    });
  });
});
