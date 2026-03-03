/**
 * Unit tests for JSDoc Generator
 *
 * Tests the generation and formatting of JSDoc comments
 */

import {
  generateJSDoc,
  formatJSDoc,
} from "../../src/generators/JSDocGenerator";
import { JSDoc, CodeElement, CodeElementType } from "../../src/types";

describe("formatJSDoc", () => {
  it("should format a simple JSDoc with only description", () => {
    const jsdoc: JSDoc = {
      description: "This is a simple function",
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toBe("/**\n" + " * This is a simple function\n" + " */");
  });

  it("should format a JSDoc with multi-line description", () => {
    const jsdoc: JSDoc = {
      description:
        "This is a function\nthat spans multiple lines\nof description",
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * This is a function");
    expect(formatted).toContain(" * that spans multiple lines");
    expect(formatted).toContain(" * of description");
  });

  it("should format a JSDoc with parameters", () => {
    const jsdoc: JSDoc = {
      description: "Adds two numbers",
      params: [
        { name: "a", type: "number", description: "First number" },
        { name: "b", type: "number", description: "Second number" },
      ],
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * Adds two numbers");
    expect(formatted).toContain(" *");
    expect(formatted).toContain(" * @param {number} a - First number");
    expect(formatted).toContain(" * @param {number} b - Second number");
  });

  it("should format optional parameters with brackets", () => {
    const jsdoc: JSDoc = {
      description: "Creates a user",
      params: [
        { name: "name", type: "string", description: "User name" },
        {
          name: "age",
          type: "number",
          description: "User age",
          optional: true,
        },
      ],
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * @param {string} name - User name");
    expect(formatted).toContain(" * @param {number} [age] - User age");
  });

  it("should format optional parameters with default values", () => {
    const jsdoc: JSDoc = {
      description: "Greets a user",
      params: [
        { name: "name", type: "string", description: "User name" },
        {
          name: "greeting",
          type: "string",
          description: "Greeting message",
          optional: true,
          defaultValue: '"Hello"',
        },
      ],
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * @param {string} name - User name");
    expect(formatted).toContain(
      ' * @param {string} [greeting="Hello"] - Greeting message',
    );
  });

  it("should format a JSDoc with return value", () => {
    const jsdoc: JSDoc = {
      description: "Calculates sum",
      params: [
        { name: "a", type: "number", description: "First number" },
        { name: "b", type: "number", description: "Second number" },
      ],
      returns: {
        type: "number",
        description: "The sum of a and b",
      },
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * @param {number} a - First number");
    expect(formatted).toContain(" * @param {number} b - Second number");
    expect(formatted).toContain(" * @returns {number} The sum of a and b");
  });

  it("should format a JSDoc with throws documentation", () => {
    const jsdoc: JSDoc = {
      description: "Divides two numbers",
      params: [
        { name: "a", type: "number", description: "Numerator" },
        { name: "b", type: "number", description: "Denominator" },
      ],
      returns: {
        type: "number",
        description: "The quotient",
      },
      throws: [{ type: "Error", condition: "If denominator is zero" }],
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * @throws {Error} If denominator is zero");
  });

  it("should format a JSDoc with multiple throws", () => {
    const jsdoc: JSDoc = {
      description: "Processes user data",
      throws: [
        { type: "ValidationError", condition: "If input validation fails" },
        { type: "DatabaseError", condition: "If database operation fails" },
      ],
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(
      " * @throws {ValidationError} If input validation fails",
    );
    expect(formatted).toContain(
      " * @throws {DatabaseError} If database operation fails",
    );
  });

  it("should format a JSDoc with example", () => {
    const jsdoc: JSDoc = {
      description: "Adds two numbers",
      params: [
        { name: "a", type: "number", description: "First number" },
        { name: "b", type: "number", description: "Second number" },
      ],
      returns: {
        type: "number",
        description: "The sum",
      },
      example: "add(2, 3) // returns 5",
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * @example");
    expect(formatted).toContain(" * add(2, 3) // returns 5");
  });

  it("should format a JSDoc with multi-line example", () => {
    const jsdoc: JSDoc = {
      description: "Creates a user",
      example: 'const user = createUser({\n  name: "John",\n  age: 30\n});',
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * @example");
    expect(formatted).toContain(" * const user = createUser({");
    expect(formatted).toContain(' *   name: "John",');
    expect(formatted).toContain(" *   age: 30");
    expect(formatted).toContain(" * });");
  });

  it("should format a JSDoc with custom tags", () => {
    const jsdoc: JSDoc = {
      description: "A deprecated function",
      tags: {
        deprecated: "Use newFunction instead",
        since: "1.0.0",
      },
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain(" * @deprecated Use newFunction instead");
    expect(formatted).toContain(" * @since 1.0.0");
  });

  it("should format a complete JSDoc with all elements", () => {
    const jsdoc: JSDoc = {
      description: "Processes user data and saves to database",
      params: [
        { name: "userId", type: "string", description: "The user identifier" },
        { name: "data", type: "object", description: "User data to process" },
        {
          name: "options",
          type: "object",
          description: "Processing options",
          optional: true,
          defaultValue: "{}",
        },
      ],
      returns: {
        type: "Promise<User>",
        description: "Promise that resolves to the updated user",
      },
      throws: [
        { type: "ValidationError", condition: "If input validation fails" },
        { type: "DatabaseError", condition: "If database operation fails" },
      ],
      example: 'const user = await processUser("123", { name: "John" });',
      tags: {
        async: "",
        since: "2.0.0",
      },
    };

    const formatted = formatJSDoc(jsdoc);

    // Check structure
    expect(formatted).toMatch(/^\/\*\*/);
    expect(formatted).toMatch(/\*\/$/);

    // Check all elements are present
    expect(formatted).toContain("Processes user data and saves to database");
    expect(formatted).toContain("@param {string} userId");
    expect(formatted).toContain("@param {object} data");
    expect(formatted).toContain("@param {object} [options={}]");
    expect(formatted).toContain("@returns {Promise<User>}");
    expect(formatted).toContain("@throws {ValidationError}");
    expect(formatted).toContain("@throws {DatabaseError}");
    expect(formatted).toContain("@example");
    expect(formatted).toContain("@async");
    expect(formatted).toContain("@since 2.0.0");
  });

  it("should add blank line between description and tags", () => {
    const jsdoc: JSDoc = {
      description: "A function",
      params: [{ name: "x", type: "number", description: "A number" }],
    };

    const formatted = formatJSDoc(jsdoc);
    const lines = formatted.split("\n");

    // Find the description line and the first param line
    const descIndex = lines.findIndex((line) => line.includes("A function"));
    const paramIndex = lines.findIndex((line) => line.includes("@param"));

    // There should be a blank line (just " *") between them
    expect(lines[descIndex + 1]).toBe(" *");
    expect(paramIndex).toBe(descIndex + 2);
  });

  it("should handle empty description", () => {
    const jsdoc: JSDoc = {
      description: "",
      params: [{ name: "x", type: "number", description: "A number" }],
    };

    const formatted = formatJSDoc(jsdoc);

    expect(formatted).toContain("/**");
    expect(formatted).toContain("@param {number} x");
    expect(formatted).toContain("*/");
  });

  it("should properly indent all lines", () => {
    const jsdoc: JSDoc = {
      description: "Test function",
      params: [{ name: "x", type: "number", description: "A number" }],
    };

    const formatted = formatJSDoc(jsdoc);
    const lines = formatted.split("\n");

    // First line should be /**
    expect(lines[0]).toBe("/**");

    // Middle lines should start with " * "
    for (let i = 1; i < lines.length - 1; i++) {
      expect(lines[i]).toMatch(/^ \*/);
    }

    // Last line should be " */"
    expect(lines[lines.length - 1]).toBe(" */");
  });
});

describe("generateJSDoc", () => {
  it("should generate JSDoc for a simple function", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "getUserById",
      filePath: "test.ts",
      lineNumber: 1,
      signature: {
        name: "getUserById",
        parameters: [{ name: "id", type: "string", optional: false }],
        returnType: "User",
        isAsync: false,
      },
      context: {},
    };

    const jsdoc = generateJSDoc(element);

    expect(jsdoc.description).toBeTruthy();
    expect(jsdoc.params).toHaveLength(1);
    expect(jsdoc.params![0].name).toBe("id");
    expect(jsdoc.returns).toBeTruthy();
    expect(jsdoc.returns!.type).toBe("User");
  });

  it("should not generate returns for void functions", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "logMessage",
      filePath: "test.ts",
      lineNumber: 1,
      signature: {
        name: "logMessage",
        parameters: [{ name: "message", type: "string", optional: false }],
        returnType: "void",
        isAsync: false,
      },
      context: {},
    };

    const jsdoc = generateJSDoc(element);

    expect(jsdoc.returns).toBeUndefined();
  });

  it("should generate throws documentation for functions with side effects", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "saveUser",
      filePath: "test.ts",
      lineNumber: 1,
      signature: {
        name: "saveUser",
        parameters: [{ name: "user", type: "User", optional: false }],
        returnType: "Promise<void>",
        isAsync: true,
        sideEffects: [
          { type: "database" as any, description: "Saves user to database" },
        ],
      },
      context: {},
    };

    const jsdoc = generateJSDoc(element);

    expect(jsdoc.throws).toBeTruthy();
    expect(jsdoc.throws!.length).toBeGreaterThan(0);
    expect(jsdoc.throws![0].condition).toContain("database");
  });
});
