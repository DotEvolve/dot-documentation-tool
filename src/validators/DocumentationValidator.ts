/**
 * DocumentationValidator ensures JSDoc quality by checking syntax, completeness,
 * redundancy, and terminology consistency.
 */

import {
  JSDoc,
  FunctionSignature,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationErrorType,
  ValidationWarningType,
} from '../types';

/**
 * Glossary of standard terminology
 */
export interface Glossary {
  terms: Map<string, string>; // Maps incorrect terms to correct terms
}

/**
 * Represents a terminology issue found in documentation
 */
export interface TerminologyIssue {
  incorrectTerm: string;
  correctTerm: string;
  location: string;
}

/**
 * Represents a validation issue for completeness checks
 */
export interface ValidationIssue {
  type: 'missing_param' | 'missing_return' | 'missing_throws' | 'param_mismatch';
  message: string;
  paramName?: string;
}

/**
 * DocumentationValidator validates JSDoc comments for quality and correctness
 */
export class DocumentationValidator {
  private glossary: Glossary;

  constructor(glossary?: Glossary) {
    this.glossary = glossary || { terms: new Map() };
  }

  /**
   * Validates JSDoc syntax correctness
   * 
   * @param jsdoc - The JSDoc string to validate
   * @returns Array of syntax errors found
   */
  validateSyntax(jsdoc: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if JSDoc starts with /**
    if (!jsdoc.trim().startsWith('/**')) {
      errors.push({
        type: ValidationErrorType.SYNTAX,
        message: 'JSDoc comment must start with /**',
        location: { line: 1, column: 1 },
      });
    }

    // Check if JSDoc ends with */
    if (!jsdoc.trim().endsWith('*/')) {
      errors.push({
        type: ValidationErrorType.SYNTAX,
        message: 'JSDoc comment must end with */',
        location: { line: jsdoc.split('\n').length, column: 1 },
      });
    }

    // Check for valid JSDoc tags
    const validTags = [
      '@param',
      '@returns',
      '@return',
      '@throws',
      '@throw',
      '@example',
      '@description',
      '@type',
      '@typedef',
      '@property',
      '@prop',
      '@async',
      '@private',
      '@public',
      '@protected',
      '@readonly',
      '@deprecated',
      '@see',
      '@since',
      '@version',
      '@author',
      '@license',
    ];

    const lines = jsdoc.split('\n');
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for malformed tags (@ not followed by valid tag name)
      const tagMatch = trimmedLine.match(/@(\w+)/);
      if (tagMatch) {
        const tag = `@${tagMatch[1]}`;
        if (!validTags.includes(tag)) {
          errors.push({
            type: ValidationErrorType.SYNTAX,
            message: `Invalid JSDoc tag: ${tag}`,
            location: { line: index + 1, column: trimmedLine.indexOf(tag) + 1 },
          });
        }
      }

      // Check for unmatched braces in type annotations
      const braceCount = (trimmedLine.match(/{/g) || []).length - (trimmedLine.match(/}/g) || []).length;
      if (braceCount !== 0) {
        errors.push({
          type: ValidationErrorType.SYNTAX,
          message: 'Unmatched braces in type annotation',
          location: { line: index + 1, column: 1 },
        });
      }
    });

    // Check for proper @param format: @param {type} name - description
    lines.forEach((line, index) => {
      if (line.includes('@param')) {
        const paramMatch = line.match(/@param\s+(?:{([^}]+)}\s+)?(\[?[\w.]+\]?)?(?:\s+-?\s*(.+))?/);
        if (paramMatch) {
          const [, type, name] = paramMatch;
          
          // Check if type is present
          if (!type) {
            errors.push({
              type: ValidationErrorType.SYNTAX,
              message: `@param ${name || '(unnamed)'} is missing type annotation`,
              location: { line: index + 1, column: 1 },
            });
          }
          
          // Check if name is present (name is required even if type is present)
          if (!name || name.trim() === '') {
            errors.push({
              type: ValidationErrorType.SYNTAX,
              message: '@param is missing parameter name',
              location: { line: index + 1, column: 1 },
            });
          }
        } else {
          errors.push({
            type: ValidationErrorType.SYNTAX,
            message: 'Malformed @param tag',
            location: { line: index + 1, column: 1 },
          });
        }
      }
    });

    // Check for proper @returns format: @returns {type} description
    lines.forEach((line, index) => {
      if (line.includes('@returns') || line.includes('@return')) {
        const returnsMatch = line.match(/@returns?\s+{([^}]+)}\s*(.+)?/);
        if (returnsMatch) {
          const [, type] = returnsMatch;
          
          if (!type) {
            errors.push({
              type: ValidationErrorType.SYNTAX,
              message: '@returns is missing type annotation',
              location: { line: index + 1, column: 1 },
            });
          }
        } else {
          // Check if there's a @returns without braces
          if (line.match(/@returns?\s+[^{]/)) {
            errors.push({
              type: ValidationErrorType.SYNTAX,
              message: '@returns is missing type annotation',
              location: { line: index + 1, column: 1 },
            });
          }
        }
      }
    });

    return errors;
  }

  /**
   * Validates that JSDoc documentation is complete relative to function signature
   * 
   * @param jsdoc - The JSDoc object to validate
   * @param signature - The function signature to validate against
   * @returns Array of validation issues found
   */
  validateCompleteness(jsdoc: JSDoc, signature: FunctionSignature): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check that all parameters are documented
    signature.parameters.forEach((param) => {
      const documented = jsdoc.params?.find((p) => p.name === param.name);
      if (!documented) {
        issues.push({
          type: 'missing_param',
          message: `Parameter '${param.name}' is not documented`,
          paramName: param.name,
        });
      }
    });

    // Check that documented parameters exist in signature
    jsdoc.params?.forEach((paramDoc) => {
      const exists = signature.parameters.find((p) => p.name === paramDoc.name);
      if (!exists) {
        issues.push({
          type: 'param_mismatch',
          message: `Documented parameter '${paramDoc.name}' does not exist in function signature`,
          paramName: paramDoc.name,
        });
      }
    });

    // Check that return type is documented for non-void functions
    if (signature.returnType && signature.returnType !== 'void' && !jsdoc.returns) {
      issues.push({
        type: 'missing_return',
        message: 'Function has a return type but @returns is not documented',
      });
    }

    // Check that errors are documented if function throws
    if (signature.throws && signature.throws.length > 0 && (!jsdoc.throws || jsdoc.throws.length === 0)) {
      issues.push({
        type: 'missing_throws',
        message: 'Function throws errors but @throws is not documented',
      });
    }

    return issues;
  }

  /**
   * Checks if JSDoc documentation is redundant (merely restates the code)
   * 
   * @param jsdoc - The JSDoc object to check
   * @param code - The code being documented (function name or signature)
   * @returns True if documentation is redundant, false otherwise
   */
  checkRedundancy(jsdoc: JSDoc, code: string): boolean {
    const description = jsdoc.description.toLowerCase().trim();
    const codeLower = code.toLowerCase().trim();

    // Check if description is too short or generic
    if (description.length < 10) {
      return true;
    }

    // Check for trivial descriptions that just restate the function name
    // e.g., "getUser" -> "Gets the user"
    const trivialPatterns = [
      /^(gets?|sets?|creates?|deletes?|updates?|fetches?|retrieves?)\s+(the\s+)?(\w+)$/,
      /^(this\s+)?(function|method)\s+(gets?|sets?|creates?|deletes?|updates?)\s+/,
      /^(returns?|return)\s+(the\s+)?(\w+)$/,
    ];

    for (const pattern of trivialPatterns) {
      if (pattern.test(description)) {
        // Extract the key word from description
        const match = description.match(pattern);
        if (match) {
          // Check if the key word appears in the code
          const keyWords = match.filter((m) => m && m.length > 3);
          const hasMatch = keyWords.some((word) => codeLower.includes(word.toLowerCase()));
          if (hasMatch) {
            return true;
          }
        }
      }
    }

    // Check if description is just the function name with spaces
    // Split both code and description into words, handling camelCase
    const splitCamelCase = (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space before capital letters
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
    };
    
    const codeWords = splitCamelCase(code);
    const descWords = splitCamelCase(description);
    
    // Filter out common words that don't indicate redundancy
    const commonWords = ['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'has', 'have'];
    const meaningfulDescWords = descWords.filter((w) => !commonWords.includes(w));
    
    if (meaningfulDescWords.length === 0) {
      return true;
    }
    
    // If most meaningful words in description appear in code, it's likely redundant
    const matchingWords = meaningfulDescWords.filter((word) => codeWords.includes(word));
    if (matchingWords.length >= meaningfulDescWords.length * 0.75) {
      return true;
    }

    return false;
  }

  /**
   * Verifies that JSDoc uses consistent terminology from the glossary
   * 
   * @param jsdoc - The JSDoc object to verify
   * @param glossary - The glossary of standard terms
   * @returns Array of terminology issues found
   */
  verifyTerminology(jsdoc: JSDoc, glossary: Glossary): TerminologyIssue[] {
    const issues: TerminologyIssue[] = [];

    // Collect all text from JSDoc
    const allText = [
      jsdoc.description,
      ...(jsdoc.params?.map((p) => p.description) || []),
      jsdoc.returns?.description || '',
      ...(jsdoc.throws?.map((t) => t.condition) || []),
      jsdoc.example || '',
    ].join(' ');

    // Check for incorrect terms
    glossary.terms.forEach((correctTerm, incorrectTerm) => {
      const regex = new RegExp(`\\b${incorrectTerm}\\b`, 'gi');
      const matches = allText.match(regex);
      
      if (matches) {
        matches.forEach(() => {
          issues.push({
            incorrectTerm,
            correctTerm,
            location: 'JSDoc comment',
          });
        });
      }
    });

    return issues;
  }

  /**
   * Performs complete validation of JSDoc documentation
   * 
   * @param jsdoc - The JSDoc object to validate
   * @param jsdocString - The raw JSDoc string for syntax validation
   * @param signature - The function signature to validate against (optional)
   * @param code - The code being documented for redundancy check (optional)
   * @returns Complete validation result with errors and warnings
   */
  validate(
    jsdoc: JSDoc,
    jsdocString: string,
    signature?: FunctionSignature,
    code?: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Syntax validation
    const syntaxErrors = this.validateSyntax(jsdocString);
    errors.push(...syntaxErrors);

    // Completeness validation
    if (signature) {
      const completenessIssues = this.validateCompleteness(jsdoc, signature);
      completenessIssues.forEach((issue) => {
        errors.push({
          type: ValidationErrorType.COMPLETENESS,
          message: issue.message,
        });
      });
    }

    // Redundancy check
    if (code) {
      const isRedundant = this.checkRedundancy(jsdoc, code);
      if (isRedundant) {
        warnings.push({
          type: ValidationWarningType.REDUNDANCY,
          message: 'Documentation appears to be redundant or trivial',
          suggestion: 'Provide more meaningful description that explains why and how, not just what',
        });
      }
    }

    // Terminology validation
    const terminologyIssues = this.verifyTerminology(jsdoc, this.glossary);
    terminologyIssues.forEach((issue) => {
      warnings.push({
        type: ValidationWarningType.TERMINOLOGY,
        message: `Use '${issue.correctTerm}' instead of '${issue.incorrectTerm}'`,
        suggestion: issue.correctTerm,
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
