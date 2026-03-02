/**
 * Property-based test for Function Documentation Completeness
 * Feature: comprehensive-service-documentation, Property 1: Function Documentation Completeness
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import * as fc from 'fast-check';
import { CodeElementType, SideEffectType } from '../../src/types';
import { generateJSDoc } from '../../src/generators/JSDocGenerator';

/**
 * Arbitrary generator for Parameter objects
 */
const parameterArbitrary = fc.record({
  name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: fc.option(fc.oneof(
    fc.constant('string'),
    fc.constant('number'),
    fc.constant('boolean'),
    fc.constant('any'),
    fc.constant('object'),
    fc.constant('Array<string>'),
    fc.constant('Record<string, any>'),
    fc.constant('Promise<void>'),
    fc.constant('Function')
  ), { nil: undefined }),
  optional: fc.boolean(),
  defaultValue: fc.option(fc.oneof(
    fc.constant('null'),
    fc.constant('undefined'),
    fc.constant('""'),
    fc.constant('0'),
    fc.constant('false'),
    fc.constant('[]'),
    fc.constant('{}')
  ), { nil: undefined }),
  description: fc.option(fc.lorem({ maxCount: 10 }), { nil: undefined })
});

/**
 * Arbitrary generator for SideEffect objects
 */
const sideEffectArbitrary = fc.record({
  type: fc.oneof(
    fc.constant(SideEffectType.DATABASE),
    fc.constant(SideEffectType.API_CALL),
    fc.constant(SideEffectType.FILE_IO),
    fc.constant(SideEffectType.STATE_MUTATION)
  ),
  description: fc.lorem({ maxCount: 10 })
});

/**
 * Arbitrary generator for FunctionSignature objects
 */
const functionSignatureArbitrary = fc.record({
  name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  parameters: fc.array(parameterArbitrary, { minLength: 0, maxLength: 8 }),
  returnType: fc.option(fc.oneof(
    fc.constant('string'),
    fc.constant('number'),
    fc.constant('boolean'),
    fc.constant('void'),
    fc.constant('Promise<void>'),
    fc.constant('Promise<string>'),
    fc.constant('Promise<number>'),
    fc.constant('any'),
    fc.constant('object')
  ), { nil: undefined }),
  isAsync: fc.boolean(),
  isGenerator: fc.option(fc.boolean(), { nil: undefined }),
  throws: fc.option(fc.array(fc.oneof(
    fc.constant('Error'),
    fc.constant('ValidationError'),
    fc.constant('NotFoundError'),
    fc.constant('UnauthorizedError'),
    fc.constant('TypeError')
  ), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  sideEffects: fc.option(fc.array(sideEffectArbitrary, { minLength: 0, maxLength: 3 }), { nil: undefined })
});

/**
 * Arbitrary generator for CodeElement objects with function signatures
 */
const codeElementArbitrary = fc.record({
  type: fc.constant(CodeElementType.FUNCTION),
  name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  filePath: fc.constant('/test/file.ts'),
  lineNumber: fc.integer({ min: 1, max: 1000 }),
  signature: functionSignatureArbitrary,
  context: fc.constant({})
});

/**
 * Property 1: Function Documentation Completeness
 * 
 * For any function or method in the codebase, the function SHALL have a JSDoc comment 
 * that includes a description, documents all parameters with types and purposes, 
 * documents the return type if non-void, and documents all thrown errors.
 */
describe('Property 1: Function Documentation Completeness', () => {
  it('should generate JSDoc with a description for any function', () => {
    fc.assert(
      fc.property(codeElementArbitrary, (element) => {
        // Generate JSDoc from the code element
        const jsdoc = generateJSDoc(element);

        // Property: JSDoc must have a non-empty description
        expect(jsdoc.description).toBeDefined();
        expect(jsdoc.description.length).toBeGreaterThan(0);
        expect(typeof jsdoc.description).toBe('string');

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should document all parameters with types and descriptions', () => {
    fc.assert(
      fc.property(codeElementArbitrary, (element) => {
        const jsdoc = generateJSDoc(element);

        // Property: If function has parameters, all must be documented
        if (element.signature!.parameters.length > 0) {
          expect(jsdoc.params).toBeDefined();
          expect(jsdoc.params!.length).toBe(element.signature!.parameters.length);

          // Each parameter must have name, type, and description
          jsdoc.params!.forEach((paramDoc, index) => {
            const originalParam = element.signature!.parameters[index];
            
            // Name must match
            expect(paramDoc.name).toBe(originalParam.name);
            
            // Type must be present
            expect(paramDoc.type).toBeDefined();
            expect(paramDoc.type.length).toBeGreaterThan(0);
            
            // Description must be present and non-empty
            expect(paramDoc.description).toBeDefined();
            expect(paramDoc.description.length).toBeGreaterThan(0);
          });
        } else {
          // If no parameters, params should be undefined or empty
          expect(!jsdoc.params || jsdoc.params.length === 0).toBe(true);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should document return type if non-void', () => {
    fc.assert(
      fc.property(codeElementArbitrary, (element) => {
        const jsdoc = generateJSDoc(element);
        const returnType = element.signature!.returnType;

        // Property: Non-void return types must be documented
        if (returnType && returnType !== 'void') {
          expect(jsdoc.returns).toBeDefined();
          expect(jsdoc.returns!.type).toBeDefined();
          expect(jsdoc.returns!.type.length).toBeGreaterThan(0);
          expect(jsdoc.returns!.description).toBeDefined();
          expect(jsdoc.returns!.description.length).toBeGreaterThan(0);
        } else {
          // Void or no return type should not have @returns
          expect(jsdoc.returns).toBeUndefined();
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should document all thrown errors', () => {
    fc.assert(
      fc.property(codeElementArbitrary, (element) => {
        const jsdoc = generateJSDoc(element);
        const throws = element.signature!.throws;
        const sideEffects = element.signature!.sideEffects;

        // Property: If function throws errors, they must be documented
        const hasExplicitThrows = throws && throws.length > 0;
        
        // Only certain side effects generate throws documentation
        const errorGeneratingSideEffects = sideEffects?.filter(se => 
          se.type === SideEffectType.DATABASE || 
          se.type === SideEffectType.API_CALL || 
          se.type === SideEffectType.FILE_IO
        ) || [];
        const hasSideEffectErrors = errorGeneratingSideEffects.length > 0;

        if (hasExplicitThrows || hasSideEffectErrors) {
          expect(jsdoc.throws).toBeDefined();
          expect(jsdoc.throws!.length).toBeGreaterThan(0);

          // Each throw must have type and condition
          jsdoc.throws!.forEach(throwDoc => {
            expect(throwDoc.type).toBeDefined();
            expect(throwDoc.type.length).toBeGreaterThan(0);
            expect(throwDoc.condition).toBeDefined();
            expect(throwDoc.condition.length).toBeGreaterThan(0);
          });

          // If explicit throws exist, they should all be documented
          if (hasExplicitThrows) {
            throws!.forEach(errorType => {
              const documented = jsdoc.throws!.some(doc => doc.type === errorType);
              expect(documented).toBe(true);
            });
          }
        } else {
          // If no throws or error-generating side effects, throws documentation is optional
          // (it may still exist due to other heuristics, so we don't enforce undefined)
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain completeness for functions with all elements', () => {
    fc.assert(
      fc.property(codeElementArbitrary, (element) => {
        const jsdoc = generateJSDoc(element);

        // Property: Complete documentation includes all required elements
        // 1. Description is always required
        expect(jsdoc.description).toBeDefined();
        expect(jsdoc.description.length).toBeGreaterThan(0);

        // 2. Parameters are documented if they exist
        if (element.signature!.parameters.length > 0) {
          expect(jsdoc.params).toBeDefined();
          expect(jsdoc.params!.length).toBe(element.signature!.parameters.length);
        }

        // 3. Return type is documented if non-void
        if (element.signature!.returnType && element.signature!.returnType !== 'void') {
          expect(jsdoc.returns).toBeDefined();
        }

        // 4. Errors are documented if function throws or has error-generating side effects
        const hasThrows = element.signature!.throws && element.signature!.throws.length > 0;
        const errorGeneratingSideEffects = element.signature!.sideEffects?.filter(se => 
          se.type === SideEffectType.DATABASE || 
          se.type === SideEffectType.API_CALL || 
          se.type === SideEffectType.FILE_IO
        ) || [];
        const hasSideEffects = errorGeneratingSideEffects.length > 0;
        
        if (hasThrows || hasSideEffects) {
          expect(jsdoc.throws).toBeDefined();
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases: no parameters, void return, no throws', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constant(CodeElementType.FUNCTION),
          name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
          filePath: fc.constant('/test/file.ts'),
          lineNumber: fc.integer({ min: 1, max: 1000 }),
          signature: fc.record({
            name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
            parameters: fc.constant([]),
            returnType: fc.constant('void'),
            isAsync: fc.boolean(),
            throws: fc.constant([]),
            sideEffects: fc.constant([])
          }),
          context: fc.constant({})
        }),
        (element) => {
          const jsdoc = generateJSDoc(element);

          // Even minimal functions must have a description
          expect(jsdoc.description).toBeDefined();
          expect(jsdoc.description.length).toBeGreaterThan(0);

          // No parameters means no @param tags
          expect(!jsdoc.params || jsdoc.params.length === 0).toBe(true);

          // Void return means no @returns tag
          expect(jsdoc.returns).toBeUndefined();

          // No throws or side effects means no @throws tags (or empty)
          expect(!jsdoc.throws || jsdoc.throws.length === 0).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle optional parameters correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constant(CodeElementType.FUNCTION),
          name: fc.constant('testFunction'),
          filePath: fc.constant('/test/file.ts'),
          lineNumber: fc.constant(1),
          signature: fc.record({
            name: fc.constant('testFunction'),
            parameters: fc.array(
              fc.record({
                name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
                type: fc.constant('string'),
                optional: fc.constant(true),
                defaultValue: fc.option(fc.constant('""'), { nil: undefined })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            returnType: fc.constant('void'),
            isAsync: fc.boolean()
          }),
          context: fc.constant({})
        }),
        (element) => {
          const jsdoc = generateJSDoc(element);

          // All optional parameters must be documented with optional flag
          expect(jsdoc.params).toBeDefined();
          jsdoc.params!.forEach(paramDoc => {
            expect(paramDoc.optional).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle async functions with Promise return types', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constant(CodeElementType.FUNCTION),
          name: fc.constant('asyncFunction'),
          filePath: fc.constant('/test/file.ts'),
          lineNumber: fc.constant(1),
          signature: fc.record({
            name: fc.constant('asyncFunction'),
            parameters: fc.constant([]),
            returnType: fc.oneof(
              fc.constant('Promise<string>'),
              fc.constant('Promise<number>'),
              fc.constant('Promise<void>'),
              fc.constant('Promise<any>')
            ),
            isAsync: fc.constant(true)
          }),
          context: fc.constant({})
        }),
        (element) => {
          const jsdoc = generateJSDoc(element);

          // Async functions with non-void Promise should have @returns
          if (element.signature!.returnType !== 'Promise<void>') {
            expect(jsdoc.returns).toBeDefined();
            expect(jsdoc.returns!.type).toBe(element.signature!.returnType);
            expect(jsdoc.returns!.description).toContain('Promise');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
