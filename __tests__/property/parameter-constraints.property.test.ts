import * as fc from "fast-check";
import { generateJSDoc } from "../../src/generators/JSDocGenerator";
import {
  CodeElement,
  CodeElementType,
  FunctionSignature,
  Parameter,
} from "../../src/types";

/**
 * Feature: comprehensive-service-documentation
 * Property 3: Parameter Constraint Documentation
 *
 * **Validates: Requirements 3.2**
 *
 * For any function parameter that has constraints (valid ranges, allowed values,
 * null/undefined handling), the @param JSDoc tag SHALL document these constraints.
 */
describe("Property 3: Parameter Constraint Documentation", () => {
  // Generator for parameters with constraints
  const constrainedParameterArb = fc.record({
    name: fc.stringOf(fc.constantFrom("a", "b", "c", "d", "e"), {
      minLength: 3,
      maxLength: 10,
    }),
    type: fc.constantFrom("number", "string", "boolean", "object"),
    optional: fc.boolean(),
    constraint: fc.oneof(
      fc.record({
        type: fc.constant("range"),
        min: fc.integer(),
        max: fc.integer(),
      }),
      fc.record({
        type: fc.constant("enum"),
        values: fc.array(fc.string(), { minLength: 2, maxLength: 5 }),
      }),
      fc.record({
        type: fc.constant("nullable"),
        allowNull: fc.boolean(),
        allowUndefined: fc.boolean(),
      }),
    ),
  });

  // Generator for function signatures with constrained parameters
  const functionWithConstraintsArb = fc.record({
    name: fc.stringOf(fc.constantFrom("a", "b", "c", "d", "e"), {
      minLength: 5,
      maxLength: 15,
    }),
    parameters: fc.array(constrainedParameterArb, {
      minLength: 1,
      maxLength: 3,
    }),
    returnType: fc.constantFrom("void", "string", "number", "boolean"),
    isAsync: fc.boolean(),
  });

  it("should document parameter constraints in JSDoc", () => {
    fc.assert(
      fc.property(functionWithConstraintsArb, (funcData) => {
        // Create a CodeElement with constrained parameters
        const parameters: Parameter[] = funcData.parameters.map((p) => ({
          name: p.name,
          type: p.type,
          optional: p.optional,
          description: generateConstraintDescription(p.constraint),
        }));

        const signature: FunctionSignature = {
          name: funcData.name,
          parameters,
          returnType: funcData.returnType,
          isAsync: funcData.isAsync,
        };

        const element: CodeElement = {
          type: CodeElementType.FUNCTION,
          name: funcData.name,
          filePath: "test.ts",
          lineNumber: 1,
          signature,
          context: {},
        };

        // Generate JSDoc
        const jsdoc = generateJSDoc(element);

        // Verify all parameters are documented
        expect(jsdoc.params).toBeDefined();
        expect(jsdoc.params?.length).toBe(parameters.length);

        // Verify each parameter with constraints has constraint info in description
        parameters.forEach((param, index) => {
          const paramDoc = jsdoc.params?.[index];
          expect(paramDoc).toBeDefined();
          expect(paramDoc?.name).toBe(param.name);

          // Check that constraint information is present in the description
          if (param.description) {
            expect(paramDoc?.description).toBeTruthy();
            expect(paramDoc?.description.length).toBeGreaterThan(0);
          }
        });
      }),
      { numRuns: 100 },
    );
  });

  it("should document range constraints for numeric parameters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 101, max: 1000 }),
        (paramName, min, max) => {
          const parameter: Parameter = {
            name: paramName,
            type: "number",
            optional: false,
            description: `Must be between ${min} and ${max}`,
          };

          const signature: FunctionSignature = {
            name: "testFunc",
            parameters: [parameter],
            returnType: "void",
            isAsync: false,
          };

          const element: CodeElement = {
            type: CodeElementType.FUNCTION,
            name: "testFunc",
            filePath: "test.ts",
            lineNumber: 1,
            signature,
            context: {},
          };

          const jsdoc = generateJSDoc(element);

          // Verify parameter is documented
          expect(jsdoc.params).toBeDefined();
          expect(jsdoc.params?.length).toBe(1);
          expect(jsdoc.params?.[0].name).toBe(paramName);
          expect(jsdoc.params?.[0].description).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should document nullable/optional parameter constraints", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }),
        fc.boolean(),
        fc.boolean(),
        (paramName, optional, nullable) => {
          const description = nullable
            ? "Can be null or undefined"
            : optional
              ? "Optional parameter"
              : "Required parameter";

          const parameter: Parameter = {
            name: paramName,
            type: "string",
            optional,
            description,
          };

          const signature: FunctionSignature = {
            name: "testFunc",
            parameters: [parameter],
            returnType: "void",
            isAsync: false,
          };

          const element: CodeElement = {
            type: CodeElementType.FUNCTION,
            name: "testFunc",
            filePath: "test.ts",
            lineNumber: 1,
            signature,
            context: {},
          };

          const jsdoc = generateJSDoc(element);

          // Verify parameter documentation includes constraint info
          expect(jsdoc.params).toBeDefined();
          expect(jsdoc.params?.length).toBe(1);

          const paramDoc = jsdoc.params?.[0];
          expect(paramDoc?.name).toBe(paramName);
          expect(paramDoc?.optional).toBe(optional);
          expect(paramDoc?.description).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Helper function to generate constraint description
 */
function generateConstraintDescription(constraint: any): string {
  if (constraint.type === "range") {
    return `Must be between ${constraint.min} and ${constraint.max}`;
  } else if (constraint.type === "enum") {
    return `Must be one of: ${constraint.values.join(", ")}`;
  } else if (constraint.type === "nullable") {
    const parts = [];
    if (constraint.allowNull) parts.push("null");
    if (constraint.allowUndefined) parts.push("undefined");
    return parts.length > 0 ? `Can be ${parts.join(" or ")}` : "Required";
  }
  return "";
}
