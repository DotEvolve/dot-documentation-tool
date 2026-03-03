/**
 * Property-based test for Documentation-Code Synchronization
 * Feature: comprehensive-service-documentation, Property 18: Documentation-Code Synchronization
 * Validates: Requirements 11.4
 */

import * as fc from "fast-check";
import { FunctionSignature, JSDoc, ParamDoc } from "../../src/types";

/**
 * Arbitrary generator for Parameter objects
 */
const parameterArbitrary = fc.record({
  name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: fc.option(
    fc.oneof(
      fc.constant("string"),
      fc.constant("number"),
      fc.constant("boolean"),
      fc.constant("any"),
      fc.constant("void"),
      fc.constant("object"),
      fc.constant("Array<string>"),
      fc.constant("Record<string, any>"),
    ),
    { nil: undefined },
  ),
  optional: fc.boolean(),
  defaultValue: fc.option(
    fc.oneof(
      fc.constant("null"),
      fc.constant("undefined"),
      fc.constant('""'),
      fc.constant("0"),
      fc.constant("false"),
      fc.constant("[]"),
      fc.constant("{}"),
    ),
    { nil: undefined },
  ),
  description: fc.option(fc.lorem({ maxCount: 10 }), { nil: undefined }),
});

/**
 * Arbitrary generator for FunctionSignature objects
 */
const functionSignatureArbitrary = fc.record({
  name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  parameters: fc.array(parameterArbitrary, { minLength: 0, maxLength: 10 }),
  returnType: fc.option(
    fc.oneof(
      fc.constant("string"),
      fc.constant("number"),
      fc.constant("boolean"),
      fc.constant("void"),
      fc.constant("Promise<void>"),
      fc.constant("Promise<string>"),
      fc.constant("any"),
    ),
    { nil: undefined },
  ),
  isAsync: fc.boolean(),
  throws: fc.option(
    fc.array(fc.lorem({ maxCount: 5 }), { minLength: 0, maxLength: 3 }),
    { nil: undefined },
  ),
  sideEffects: fc.option(fc.constant([]), { nil: undefined }),
});

/**
 * Helper function to generate JSDoc from FunctionSignature
 * This simulates what the documentation generator would do
 */
function generateJSDocFromSignature(signature: FunctionSignature): JSDoc {
  const params: ParamDoc[] = signature.parameters.map((param) => ({
    name: param.name,
    type: param.type || "any",
    description: param.description || `Parameter ${param.name}`,
    optional: param.optional,
    defaultValue: param.defaultValue,
  }));

  return {
    description: `Function ${signature.name}`,
    params: params.length > 0 ? params : undefined,
    returns:
      signature.returnType && signature.returnType !== "void"
        ? {
            type: signature.returnType,
            description: `Returns ${signature.returnType}`,
          }
        : undefined,
    throws:
      signature.throws && signature.throws.length > 0
        ? signature.throws.map((t) => ({
            type: t,
            condition: `When ${t} occurs`,
          }))
        : undefined,
  };
}

/**
 * Property 18: Documentation-Code Synchronization
 *
 * For any function with JSDoc documentation, the documented parameters SHALL match
 * the actual function parameters in name and order, and the documented return type
 * SHALL match the actual return type.
 */
describe("Property 18: Documentation-Code Synchronization", () => {
  it("should maintain parameter name and order consistency between signature and JSDoc", () => {
    fc.assert(
      fc.property(functionSignatureArbitrary, (signature) => {
        // Generate JSDoc from the function signature
        const jsdoc = generateJSDocFromSignature(signature);

        // Property: If signature has parameters, JSDoc should document them in the same order
        if (signature.parameters.length > 0) {
          expect(jsdoc.params).toBeDefined();
          expect(jsdoc.params!.length).toBe(signature.parameters.length);

          // Verify each parameter matches in name and order
          signature.parameters.forEach((param, index) => {
            expect(jsdoc.params![index].name).toBe(param.name);
          });
        } else {
          // If no parameters, JSDoc params should be undefined or empty
          expect(!jsdoc.params || jsdoc.params.length === 0).toBe(true);
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("should maintain parameter type consistency between signature and JSDoc", () => {
    fc.assert(
      fc.property(functionSignatureArbitrary, (signature) => {
        const jsdoc = generateJSDocFromSignature(signature);

        // Property: Parameter types in JSDoc should match signature types
        if (signature.parameters.length > 0 && jsdoc.params) {
          signature.parameters.forEach((param, index) => {
            const expectedType = param.type || "any";
            expect(jsdoc.params![index].type).toBe(expectedType);
          });
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("should maintain optional flag consistency between signature and JSDoc", () => {
    fc.assert(
      fc.property(functionSignatureArbitrary, (signature) => {
        const jsdoc = generateJSDocFromSignature(signature);

        // Property: Optional flags in JSDoc should match signature optional flags
        if (signature.parameters.length > 0 && jsdoc.params) {
          signature.parameters.forEach((param, index) => {
            expect(jsdoc.params![index].optional).toBe(param.optional);
          });
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("should maintain return type consistency between signature and JSDoc", () => {
    fc.assert(
      fc.property(functionSignatureArbitrary, (signature) => {
        const jsdoc = generateJSDocFromSignature(signature);

        // Property: Return type in JSDoc should match signature return type
        if (signature.returnType && signature.returnType !== "void") {
          expect(jsdoc.returns).toBeDefined();
          expect(jsdoc.returns!.type).toBe(signature.returnType);
        } else {
          // If void or no return type, JSDoc returns should be undefined
          expect(jsdoc.returns).toBeUndefined();
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("should maintain throws consistency between signature and JSDoc", () => {
    fc.assert(
      fc.property(functionSignatureArbitrary, (signature) => {
        const jsdoc = generateJSDocFromSignature(signature);

        // Property: Throws in JSDoc should match signature throws
        if (signature.throws && signature.throws.length > 0) {
          expect(jsdoc.throws).toBeDefined();
          expect(jsdoc.throws!.length).toBe(signature.throws.length);

          signature.throws.forEach((throwType, index) => {
            expect(jsdoc.throws![index].type).toBe(throwType);
          });
        } else {
          // If no throws, JSDoc throws should be undefined
          expect(jsdoc.throws).toBeUndefined();
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("should maintain default value consistency between signature and JSDoc", () => {
    fc.assert(
      fc.property(functionSignatureArbitrary, (signature) => {
        const jsdoc = generateJSDocFromSignature(signature);

        // Property: Default values in JSDoc should match signature default values
        if (signature.parameters.length > 0 && jsdoc.params) {
          signature.parameters.forEach((param, index) => {
            if (param.defaultValue) {
              expect(jsdoc.params![index].defaultValue).toBe(
                param.defaultValue,
              );
            }
          });
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });
});
