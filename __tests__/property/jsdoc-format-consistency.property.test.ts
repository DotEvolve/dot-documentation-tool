/**
 * Property-based test for JSDoc Format Consistency
 * Feature: comprehensive-service-documentation, Property 16: JSDoc Format Consistency
 * Validates: Requirements 11.1
 */

import * as fc from 'fast-check';
import { JSDoc } from '../../src/types';
import { formatJSDoc } from '../../src/generators/JSDocGenerator';

/**
 * Arbitrary generator for ParamDoc objects
 */
const paramDocArbitrary = fc.record({
  name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: fc.oneof(
    fc.constant('string'),
    fc.constant('number'),
    fc.constant('boolean'),
    fc.constant('any'),
    fc.constant('void'),
    fc.constant('object'),
    fc.constant('Array<string>'),
    fc.constant('Record<string, any>'),
    fc.constant('Promise<void>'),
    fc.constant('Function')
  ),
  description: fc.lorem({ maxCount: 15 }),
  optional: fc.option(fc.boolean(), { nil: undefined }),
  defaultValue: fc.option(fc.oneof(
    fc.constant('null'),
    fc.constant('undefined'),
    fc.constant('""'),
    fc.constant('0'),
    fc.constant('false'),
    fc.constant('[]'),
    fc.constant('{}')
  ), { nil: undefined })
});

/**
 * Arbitrary generator for ReturnDoc objects
 */
const returnDocArbitrary = fc.record({
  type: fc.oneof(
    fc.constant('string'),
    fc.constant('number'),
    fc.constant('boolean'),
    fc.constant('any'),
    fc.constant('object'),
    fc.constant('Array<string>'),
    fc.constant('Promise<string>'),
    fc.constant('Promise<number>'),
    fc.constant('Promise<void>')
  ),
  description: fc.lorem({ maxCount: 15 })
});

/**
 * Arbitrary generator for ThrowsDoc objects
 */
const throwsDocArbitrary = fc.record({
  type: fc.oneof(
    fc.constant('Error'),
    fc.constant('ValidationError'),
    fc.constant('NotFoundError'),
    fc.constant('UnauthorizedError'),
    fc.constant('TypeError'),
    fc.constant('RangeError')
  ),
  condition: fc.lorem({ maxCount: 10 })
});

/**
 * Arbitrary generator for JSDoc objects
 */
const jsdocArbitrary = fc.record({
  description: fc.lorem({ maxCount: 20 }),
  params: fc.option(fc.array(paramDocArbitrary, { minLength: 0, maxLength: 8 }), { nil: undefined }),
  returns: fc.option(returnDocArbitrary, { nil: undefined }),
  throws: fc.option(fc.array(throwsDocArbitrary, { minLength: 0, maxLength: 5 }), { nil: undefined }),
  example: fc.option(fc.lorem({ maxCount: 10 }), { nil: undefined }),
  tags: fc.option(fc.dictionary(
    fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]*$/),
    fc.lorem({ maxCount: 5 })
  ), { nil: undefined })
});

/**
 * Validates that a string is valid JSDoc syntax
 * 
 * @param {string} jsdocString - The JSDoc comment string to validate
 * @returns {boolean} True if valid JSDoc syntax, false otherwise
 */
function isValidJSDocSyntax(jsdocString: string): boolean {
  // Check basic structure
  if (!jsdocString.startsWith('/**')) return false;
  if (!jsdocString.endsWith('*/')) return false;
  
  const lines = jsdocString.split('\n');
  
  // First line must be /**
  if (lines[0].trim() !== '/**') return false;
  
  // Last line must be */
  if (lines[lines.length - 1].trim() !== '*/') return false;
  
  // All middle lines must start with * (after trimming leading whitespace)
  for (let i = 1; i < lines.length - 1; i++) {
    const trimmed = lines[i].trimStart();
    if (!trimmed.startsWith('*')) return false;
  }
  
  return true;
}

/**
 * Validates that JSDoc tags are properly formatted
 * 
 * @param {string} jsdocString - The JSDoc comment string to validate
 * @returns {boolean} True if tags are properly formatted, false otherwise
 */
function hasValidTagFormat(jsdocString: string): boolean {
  const lines = jsdocString.split('\n');
  
  // Extract tag lines (lines that contain @)
  const tagLines = lines.filter(line => line.includes('@'));
  
  for (const line of tagLines) {
    const trimmed = line.trim();
    
    // Tag line must start with * @
    if (!trimmed.match(/^\*\s+@/)) return false;
    
    // Extract the tag name
    const tagMatch = trimmed.match(/^\*\s+@([a-zA-Z]+)/);
    if (!tagMatch) return false;
    
    const tagName = tagMatch[1];
    
    // Validate specific tag formats
    if (tagName === 'param') {
      // @param must have format: @param {type} name - description
      // or @param {type} [name] - description for optional
      // or @param {type} name=default - description for default values
      // or @param {type} [name=default] - description for optional with default
      if (!trimmed.match(/^\*\s+@param\s+\{[^}]+\}\s+(\[)?[a-zA-Z_][a-zA-Z0-9_=\[\]"{}]*(\])?\s*(-\s+.+)?$/)) {
        return false;
      }
    } else if (tagName === 'returns') {
      // @returns must have format: @returns {type} description
      if (!trimmed.match(/^\*\s+@returns\s+\{[^}]+\}\s+.+$/)) {
        return false;
      }
    } else if (tagName === 'throws') {
      // @throws must have format: @throws {type} condition
      if (!trimmed.match(/^\*\s+@throws\s+\{[^}]+\}\s+.+$/)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Validates that JSDoc has consistent indentation
 * 
 * @param {string} jsdocString - The JSDoc comment string to validate
 * @returns {boolean} True if indentation is consistent, false otherwise
 */
function hasConsistentIndentation(jsdocString: string): boolean {
  const lines = jsdocString.split('\n');
  
  // All lines except first and last should have consistent * alignment
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    
    // Find the position of the first *
    const starIndex = line.indexOf('*');
    
    // Star should be at position 0 or 1 (allowing for one space of indentation)
    if (starIndex < 0 || starIndex > 1) return false;
    
    // After the *, there should be exactly one space before content (if content exists)
    const afterStar = line.substring(starIndex + 1);
    if (afterStar.length > 0 && !afterStar.startsWith(' ')) return false;
  }
  
  return true;
}

/**
 * Property 16: JSDoc Format Consistency
 * 
 * For any function, method, class, or interface documentation, the documentation 
 * SHALL use valid JSDoc syntax with proper tags (@param, @returns, @throws, etc.).
 */
describe('Property 16: JSDoc Format Consistency', () => {
  it('should generate valid JSDoc syntax with proper opening and closing', () => {
    fc.assert(
      fc.property(jsdocArbitrary, (jsdoc) => {
        // Format the JSDoc
        const formatted = formatJSDoc(jsdoc);

        // Property: Must have valid JSDoc syntax structure
        expect(isValidJSDocSyntax(formatted)).toBe(true);

        // Must start with /**
        expect(formatted.startsWith('/**')).toBe(true);

        // Must end with */
        expect(formatted.endsWith('*/')).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should format JSDoc tags correctly', () => {
    fc.assert(
      fc.property(jsdocArbitrary, (jsdoc) => {
        const formatted = formatJSDoc(jsdoc);

        // Property: All tags must be properly formatted
        expect(hasValidTagFormat(formatted)).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent indentation throughout JSDoc', () => {
    fc.assert(
      fc.property(jsdocArbitrary, (jsdoc) => {
        const formatted = formatJSDoc(jsdoc);

        // Property: Indentation must be consistent
        expect(hasConsistentIndentation(formatted)).toBe(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should properly format @param tags with types and descriptions', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 10 }),
          params: fc.array(paramDocArbitrary, { minLength: 1, maxLength: 5 })
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: Each @param must have {type} and description
          jsdoc.params!.forEach(param => {
            // Check that param appears in formatted output
            expect(formatted).toContain(`@param`);
            expect(formatted).toContain(`{${param.type}}`);
            expect(formatted).toContain(param.name);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly format @returns tags with types and descriptions', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 10 }),
          returns: returnDocArbitrary
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: @returns must have {type} and description
          expect(formatted).toContain('@returns');
          expect(formatted).toContain(`{${jsdoc.returns!.type}}`);
          expect(formatted).toContain(jsdoc.returns!.description);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should properly format @throws tags with types and conditions', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 10 }),
          throws: fc.array(throwsDocArbitrary, { minLength: 1, maxLength: 3 })
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: Each @throws must have {type} and condition
          jsdoc.throws!.forEach(throwDoc => {
            expect(formatted).toContain('@throws');
            expect(formatted).toContain(`{${throwDoc.type}}`);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle optional parameters with bracket notation', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 10 }),
          params: fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
              type: fc.constant('string'),
              description: fc.lorem({ maxCount: 10 }),
              optional: fc.constant(true)
            }),
            { minLength: 1, maxLength: 3 }
          )
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: Optional parameters must use bracket notation [name]
          jsdoc.params!.forEach(param => {
            if (param.optional) {
              expect(formatted).toContain(`[${param.name}]`);
            }
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle parameters with default values', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 10 }),
          params: fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
              type: fc.constant('string'),
              description: fc.lorem({ maxCount: 10 }),
              optional: fc.constant(true),
              defaultValue: fc.oneof(
                fc.constant('""'),
                fc.constant('null'),
                fc.constant('0')
              )
            }),
            { minLength: 1, maxLength: 3 }
          )
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: Parameters with defaults must show [name=default]
          jsdoc.params!.forEach(param => {
            if (param.defaultValue) {
              expect(formatted).toContain(`[${param.name}=${param.defaultValue}]`);
            }
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multi-line descriptions correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.array(fc.lorem({ maxCount: 10 }), { minLength: 2, maxLength: 5 })
            .map(lines => lines.join('\n')),
          params: fc.option(fc.array(paramDocArbitrary, { maxLength: 2 }), { nil: undefined })
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: Multi-line descriptions must maintain proper formatting
          
          // Each line of description should start with * 
          const descriptionLines = jsdoc.description.split('\n');
          descriptionLines.forEach(descLine => {
            if (descLine.trim().length > 0) {
              // The description line should appear in the formatted output
              expect(formatted).toContain(descLine.trim());
            }
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include blank line between description and tags when tags exist', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 10 }),
          params: fc.array(paramDocArbitrary, { minLength: 1, maxLength: 3 })
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);
          const lines = formatted.split('\n');

          // Property: There should be a blank line (just " *") between description and tags
          let foundBlankLine = false;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '*') {
              // Check if next line is a tag
              if (i + 1 < lines.length && lines[i + 1].includes('@')) {
                foundBlankLine = true;
                break;
              }
            }
          }

          expect(foundBlankLine).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle JSDoc with all elements (description, params, returns, throws)', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 15 }),
          params: fc.array(paramDocArbitrary, { minLength: 1, maxLength: 4 }),
          returns: returnDocArbitrary,
          throws: fc.array(throwsDocArbitrary, { minLength: 1, maxLength: 2 })
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: Complete JSDoc must be valid and contain all elements
          expect(isValidJSDocSyntax(formatted)).toBe(true);
          expect(hasValidTagFormat(formatted)).toBe(true);
          expect(hasConsistentIndentation(formatted)).toBe(true);

          // Must contain all tag types
          expect(formatted).toContain('@param');
          expect(formatted).toContain('@returns');
          expect(formatted).toContain('@throws');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle minimal JSDoc with only description', () => {
    fc.assert(
      fc.property(
        fc.record({
          description: fc.lorem({ maxCount: 10 })
        }),
        (jsdoc) => {
          const formatted = formatJSDoc(jsdoc as JSDoc);

          // Property: Even minimal JSDoc must be valid
          expect(isValidJSDocSyntax(formatted)).toBe(true);
          expect(hasConsistentIndentation(formatted)).toBe(true);

          // Should contain the description
          expect(formatted).toContain(jsdoc.description);

          // Should not contain any tags
          expect(formatted).not.toContain('@param');
          expect(formatted).not.toContain('@returns');
          expect(formatted).not.toContain('@throws');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
