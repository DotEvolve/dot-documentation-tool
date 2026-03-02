/**
 * Unit tests for DocumentationValidator
 * 
 * Tests syntax validation, completeness validation, redundancy detection,
 * and terminology validation.
 */

import { DocumentationValidator, Glossary } from '../../src/validators/DocumentationValidator';
import {
  JSDoc,
  FunctionSignature,
  ValidationErrorType,
  ValidationWarningType,
} from '../../src/types';

describe('DocumentationValidator', () => {
  let validator: DocumentationValidator;

  beforeEach(() => {
    validator = new DocumentationValidator();
  });

  describe('validateSyntax', () => {
    it('should pass for valid JSDoc', () => {
      const validJSDoc = `/**
 * This is a valid JSDoc comment
 * @param {string} name - The name parameter
 * @returns {boolean} True if successful
 */`;
      
      const errors = validator.validateSyntax(validJSDoc);
      expect(errors).toHaveLength(0);
    });

    it('should detect missing opening /**', () => {
      const invalidJSDoc = `/*
 * Missing opening
 * @param {string} name
 */`;
      
      const errors = validator.validateSyntax(invalidJSDoc);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('must start with /**');
    });

    it('should detect missing closing */', () => {
      const invalidJSDoc = `/**
 * Missing closing
 * @param {string} name`;
      
      const errors = validator.validateSyntax(invalidJSDoc);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('must end with */');
    });

    it('should detect invalid JSDoc tags', () => {
      const invalidJSDoc = `/**
 * Invalid tag
 * @invalidtag {string} name
 */`;
      
      const errors = validator.validateSyntax(invalidJSDoc);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('Invalid JSDoc tag'))).toBe(true);
    });

    it('should detect unmatched braces in type annotations', () => {
      const invalidJSDoc = `/**
 * Unmatched braces
 * @param {string name - Missing closing brace
 */`;
      
      const errors = validator.validateSyntax(invalidJSDoc);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('Unmatched braces'))).toBe(true);
    });

    it('should detect @param without type', () => {
      const invalidJSDoc = `/**
 * Missing type
 * @param name - The name parameter
 */`;
      
      const errors = validator.validateSyntax(invalidJSDoc);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('missing type annotation'))).toBe(true);
    });

    it('should detect @param without name', () => {
      const invalidJSDoc = `/**
 * Missing name
 * @param {string} - A parameter
 */`;
      
      const errors = validator.validateSyntax(invalidJSDoc);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('missing parameter name'))).toBe(true);
    });

    it('should detect @returns without type', () => {
      const invalidJSDoc = `/**
 * Missing return type
 * @returns The result
 */`;
      
      const errors = validator.validateSyntax(invalidJSDoc);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.message.includes('@returns is missing type annotation'))).toBe(true);
    });

    it('should accept optional parameters with brackets', () => {
      const validJSDoc = `/**
 * Optional parameter
 * @param {string} [name] - Optional name
 */`;
      
      const errors = validator.validateSyntax(validJSDoc);
      expect(errors).toHaveLength(0);
    });

    it('should accept @return as alias for @returns', () => {
      const validJSDoc = `/**
 * Using @return
 * @return {boolean} True if successful
 */`;
      
      const errors = validator.validateSyntax(validJSDoc);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateCompleteness', () => {
    it('should pass when all parameters are documented', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [
          { name: 'name', type: 'string', description: 'The name' },
          { name: 'age', type: 'number', description: 'The age' },
        ],
      };

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [
          { name: 'name', type: 'string', optional: false },
          { name: 'age', type: 'number', optional: false },
        ],
        isAsync: false,
      };

      const issues = validator.validateCompleteness(jsdoc, signature);
      expect(issues).toHaveLength(0);
    });

    it('should detect missing parameter documentation', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [
          { name: 'name', type: 'string', description: 'The name' },
        ],
      };

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [
          { name: 'name', type: 'string', optional: false },
          { name: 'age', type: 'number', optional: false },
        ],
        isAsync: false,
      };

      const issues = validator.validateCompleteness(jsdoc, signature);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('missing_param');
      expect(issues[0].paramName).toBe('age');
    });

    it('should detect documented parameters that do not exist', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [
          { name: 'name', type: 'string', description: 'The name' },
          { name: 'nonexistent', type: 'string', description: 'Does not exist' },
        ],
      };

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [
          { name: 'name', type: 'string', optional: false },
        ],
        isAsync: false,
      };

      const issues = validator.validateCompleteness(jsdoc, signature);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('param_mismatch');
      expect(issues[0].paramName).toBe('nonexistent');
    });

    it('should detect missing return documentation for non-void functions', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [],
      };

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [],
        returnType: 'string',
        isAsync: false,
      };

      const issues = validator.validateCompleteness(jsdoc, signature);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('missing_return');
    });

    it('should not require return documentation for void functions', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [],
      };

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [],
        returnType: 'void',
        isAsync: false,
      };

      const issues = validator.validateCompleteness(jsdoc, signature);
      expect(issues).toHaveLength(0);
    });

    it('should detect missing throws documentation', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [],
      };

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [],
        isAsync: false,
        throws: ['Error', 'ValidationError'],
      };

      const issues = validator.validateCompleteness(jsdoc, signature);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].type).toBe('missing_throws');
    });

    it('should pass when throws are documented', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [],
        throws: [
          { type: 'Error', condition: 'When something fails' },
        ],
      };

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [],
        isAsync: false,
        throws: ['Error'],
      };

      const issues = validator.validateCompleteness(jsdoc, signature);
      expect(issues).toHaveLength(0);
    });
  });

  describe('checkRedundancy', () => {
    it('should detect trivial "gets the X" descriptions', () => {
      const jsdoc: JSDoc = {
        description: 'Gets the user',
        params: [],
      };

      const isRedundant = validator.checkRedundancy(jsdoc, 'getUser');
      expect(isRedundant).toBe(true);
    });

    it('should detect trivial "sets the X" descriptions', () => {
      const jsdoc: JSDoc = {
        description: 'Sets the name',
        params: [],
      };

      const isRedundant = validator.checkRedundancy(jsdoc, 'setName');
      expect(isRedundant).toBe(true);
    });

    it('should detect trivial "creates X" descriptions', () => {
      const jsdoc: JSDoc = {
        description: 'Creates user',
        params: [],
      };

      const isRedundant = validator.checkRedundancy(jsdoc, 'createUser');
      expect(isRedundant).toBe(true);
    });

    it('should detect descriptions that are too short', () => {
      const jsdoc: JSDoc = {
        description: 'A method',
        params: [],
      };

      const isRedundant = validator.checkRedundancy(jsdoc, 'someMethod');
      expect(isRedundant).toBe(true);
    });

    it('should not flag meaningful descriptions', () => {
      const jsdoc: JSDoc = {
        description: 'Retrieves user data from the database and validates permissions before returning',
        params: [],
      };

      const isRedundant = validator.checkRedundancy(jsdoc, 'getUser');
      expect(isRedundant).toBe(false);
    });

    it('should detect descriptions that mostly repeat code words', () => {
      const jsdoc: JSDoc = {
        description: 'user token validate',
        params: [],
      };

      const isRedundant = validator.checkRedundancy(jsdoc, 'validateUserToken');
      expect(isRedundant).toBe(true);
    });

    it('should not flag descriptions with different context', () => {
      const jsdoc: JSDoc = {
        description: 'Validates the authentication token by checking expiration and signature',
        params: [],
      };

      const isRedundant = validator.checkRedundancy(jsdoc, 'validateToken');
      expect(isRedundant).toBe(false);
    });
  });

  describe('verifyTerminology', () => {
    it('should detect incorrect terminology', () => {
      const glossary: Glossary = {
        terms: new Map([
          ['customer', 'Tenant'],
          ['workflow', 'Workflow Instance'],
        ]),
      };

      const validatorWithGlossary = new DocumentationValidator(glossary);

      const jsdoc: JSDoc = {
        description: 'Gets the customer workflow',
        params: [],
      };

      const issues = validatorWithGlossary.verifyTerminology(jsdoc, glossary);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(i => i.incorrectTerm === 'customer')).toBe(true);
      expect(issues.some(i => i.incorrectTerm === 'workflow')).toBe(true);
    });

    it('should check terminology in parameter descriptions', () => {
      const glossary: Glossary = {
        terms: new Map([
          ['user', 'Tenant'],
        ]),
      };

      const validatorWithGlossary = new DocumentationValidator(glossary);

      const jsdoc: JSDoc = {
        description: 'A function',
        params: [
          { name: 'id', type: 'string', description: 'The user identifier' },
        ],
      };

      const issues = validatorWithGlossary.verifyTerminology(jsdoc, glossary);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].incorrectTerm).toBe('user');
      expect(issues[0].correctTerm).toBe('Tenant');
    });

    it('should check terminology in return descriptions', () => {
      const glossary: Glossary = {
        terms: new Map([
          ['record', 'Entity'],
        ]),
      };

      const validatorWithGlossary = new DocumentationValidator(glossary);

      const jsdoc: JSDoc = {
        description: 'A function',
        params: [],
        returns: {
          type: 'object',
          description: 'The database record',
        },
      };

      const issues = validatorWithGlossary.verifyTerminology(jsdoc, glossary);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].incorrectTerm).toBe('record');
    });

    it('should not flag correct terminology', () => {
      const glossary: Glossary = {
        terms: new Map([
          ['customer', 'Tenant'],
        ]),
      };

      const validatorWithGlossary = new DocumentationValidator(glossary);

      const jsdoc: JSDoc = {
        description: 'Gets the Tenant information',
        params: [],
      };

      const issues = validatorWithGlossary.verifyTerminology(jsdoc, glossary);
      expect(issues).toHaveLength(0);
    });
  });

  describe('validate (complete validation)', () => {
    it('should return valid result for good documentation', () => {
      const jsdoc: JSDoc = {
        description: 'Validates user authentication by checking token expiration and signature',
        params: [
          { name: 'token', type: 'string', description: 'The authentication token' },
        ],
        returns: {
          type: 'boolean',
          description: 'True if token is valid',
        },
      };

      const jsdocString = `/**
 * Validates user authentication by checking token expiration and signature
 * @param {string} token - The authentication token
 * @returns {boolean} True if token is valid
 */`;

      const signature: FunctionSignature = {
        name: 'validateToken',
        parameters: [
          { name: 'token', type: 'string', optional: false },
        ],
        returnType: 'boolean',
        isAsync: false,
      };

      const result = validator.validate(jsdoc, jsdocString, signature, 'validateToken');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for syntax issues', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [],
      };

      const jsdocString = `/*
 * Missing opening
 */`;

      const result = validator.validate(jsdoc, jsdocString);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe(ValidationErrorType.SYNTAX);
    });

    it('should return errors for completeness issues', () => {
      const jsdoc: JSDoc = {
        description: 'A function',
        params: [],
      };

      const jsdocString = `/**
 * A function
 */`;

      const signature: FunctionSignature = {
        name: 'testFunc',
        parameters: [
          { name: 'name', type: 'string', optional: false },
        ],
        isAsync: false,
      };

      const result = validator.validate(jsdoc, jsdocString, signature);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe(ValidationErrorType.COMPLETENESS);
    });

    it('should return warnings for redundancy', () => {
      const jsdoc: JSDoc = {
        description: 'Gets the user',
        params: [],
      };

      const jsdocString = `/**
 * Gets the user
 */`;

      const result = validator.validate(jsdoc, jsdocString, undefined, 'getUser');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe(ValidationWarningType.REDUNDANCY);
    });

    it('should return warnings for terminology issues', () => {
      const glossary: Glossary = {
        terms: new Map([
          ['customer', 'Tenant'],
        ]),
      };

      const validatorWithGlossary = new DocumentationValidator(glossary);

      const jsdoc: JSDoc = {
        description: 'Gets the customer information',
        params: [],
      };

      const jsdocString = `/**
 * Gets the customer information
 */`;

      const result = validatorWithGlossary.validate(jsdoc, jsdocString);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.type === ValidationWarningType.TERMINOLOGY)).toBe(true);
    });

    it('should combine multiple validation results', () => {
      const jsdoc: JSDoc = {
        description: 'Gets user',
        params: [],
      };

      const jsdocString = `/**
 * Gets user
 * @param name - Missing type
 */`;

      const signature: FunctionSignature = {
        name: 'getUser',
        parameters: [
          { name: 'id', type: 'string', optional: false },
        ],
        returnType: 'object',
        isAsync: false,
      };

      const result = validator.validate(jsdoc, jsdocString, signature, 'getUser');
      
      // Should have syntax errors, completeness errors, and redundancy warnings
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
