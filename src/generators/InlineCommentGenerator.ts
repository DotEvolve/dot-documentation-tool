/**
 * Inline Comment Generator
 * 
 * Generates inline comments for complex logic, algorithms, and business rules.
 * Detects patterns that need explanation and creates contextual comments.
 */

import * as t from '@babel/types';

/**
 * Represents an inline comment to be inserted
 */
export interface InlineComment {
  line: number;
  column: number;
  text: string;
  type: 'conditional' | 'algorithm' | 'calculation' | 'edge-case';
}

/**
 * Generates inline comments for complex conditional logic
 * 
 * @param node - AST node representing conditional statement
 * @returns Array of inline comments
 */
export function generateInlineComments(node: t.Node): InlineComment[] {
  const comments: InlineComment[] = [];
  
  if (t.isIfStatement(node) || t.isConditionalExpression(node)) {
    const conditionalComments = analyzeConditional(node);
    comments.push(...conditionalComments);
  }
  
  if (t.isForStatement(node) || t.isWhileStatement(node) || t.isDoWhileStatement(node)) {
    const loopComments = analyzeLoop(node);
    comments.push(...loopComments);
  }
  
  if (t.isBinaryExpression(node) && isCalculation(node)) {
    const calcComments = analyzeCalculation(node);
    comments.push(...calcComments);
  }
  
  return comments;
}

/**
 * Analyzes conditional statements for complexity
 * 
 * @param node - Conditional AST node
 * @returns Array of comments for complex conditions
 */
function analyzeConditional(node: t.IfStatement | t.ConditionalExpression): InlineComment[] {
  const comments: InlineComment[] = [];
  
  // Check for complex boolean expressions
  const test = 'test' in node ? node.test : null;
  if (test && isComplexCondition(test)) {
    comments.push({
      line: node.loc?.start.line || 0,
      column: node.loc?.start.column || 0,
      text: `Check complex condition: ${describeCondition(test)}`,
      type: 'conditional'
    });
  }
  
  return comments;
}

/**
 * Analyzes loop statements for documentation needs
 * 
 * @param node - Loop AST node
 * @returns Array of comments for loops
 */
function analyzeLoop(node: t.ForStatement | t.WhileStatement | t.DoWhileStatement): InlineComment[] {
  const comments: InlineComment[] = [];
  
  // Document loop purpose
  comments.push({
    line: node.loc?.start.line || 0,
    column: node.loc?.start.column || 0,
    text: `Iterate to process ${getLoopPurpose(node)}`,
    type: 'algorithm'
  });
  
  return comments;
}

/**
 * Analyzes mathematical calculations
 * 
 * @param node - Binary expression node
 * @returns Array of comments for calculations
 */
function analyzeCalculation(node: t.BinaryExpression): InlineComment[] {
  const comments: InlineComment[] = [];
  
  comments.push({
    line: node.loc?.start.line || 0,
    column: node.loc?.start.column || 0,
    text: `Calculate: ${describeCalculation(node)}`,
    type: 'calculation'
  });
  
  return comments;
}

/**
 * Checks if a condition is complex enough to need documentation
 * 
 * @param node - Test expression node
 * @returns True if condition is complex
 */
function isComplexCondition(node: t.Expression): boolean {
  // Complex if it has multiple logical operators
  if (t.isLogicalExpression(node)) {
    return true;
  }
  
  // Complex if it has nested conditions
  if (t.isBinaryExpression(node)) {
    return t.isLogicalExpression(node.left) || t.isLogicalExpression(node.right);
  }
  
  return false;
}

/**
 * Describes a conditional expression in human-readable form
 * 
 * @param node - Expression node
 * @returns Human-readable description
 */
function describeCondition(node: t.Expression): string {
  if (t.isLogicalExpression(node)) {
    const left = describeCondition(node.left);
    const right = describeCondition(node.right);
    return `${left} ${node.operator} ${right}`;
  }
  
  if (t.isBinaryExpression(node)) {
    return `${getIdentifierName(node.left)} ${node.operator} ${getIdentifierName(node.right)}`;
  }
  
  if (t.isIdentifier(node)) {
    return node.name;
  }
  
  return 'condition';
}

/**
 * Checks if a binary expression is a calculation
 * 
 * @param node - Binary expression node
 * @returns True if it's a mathematical calculation
 */
function isCalculation(node: t.BinaryExpression): boolean {
  const mathOperators = ['+', '-', '*', '/', '%', '**'];
  return mathOperators.includes(node.operator);
}

/**
 * Describes a calculation in human-readable form
 * 
 * @param node - Binary expression node
 * @returns Human-readable description
 */
function describeCalculation(node: t.BinaryExpression): string {
  const left = getIdentifierName(node.left);
  const right = getIdentifierName(node.right);
  
  const operatorDescriptions: Record<string, string> = {
    '+': 'sum of',
    '-': 'difference between',
    '*': 'product of',
    '/': 'quotient of',
    '%': 'remainder of',
    '**': 'power of'
  };
  
  const desc = operatorDescriptions[node.operator] || node.operator;
  return `${desc} ${left} and ${right}`;
}

/**
 * Gets the purpose of a loop based on its structure
 * 
 * @param node - Loop node
 * @returns Description of loop purpose
 */
function getLoopPurpose(node: t.ForStatement | t.WhileStatement | t.DoWhileStatement): string {
  // Try to infer from variable names or structure
  if (t.isForStatement(node) && node.init && t.isVariableDeclaration(node.init)) {
    const declarations = node.init.declarations;
    if (declarations.length > 0 && t.isIdentifier(declarations[0].id)) {
      return `items using ${declarations[0].id.name}`;
    }
  }
  
  return 'items';
}

/**
 * Extracts identifier name from an expression
 * 
 * @param node - Expression node
 * @returns Identifier name or placeholder
 */
function getIdentifierName(node: t.Expression | t.PrivateName): string {
  if (t.isIdentifier(node)) {
    return node.name;
  }
  
  if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
    return node.property.name;
  }
  
  if (t.isLiteral(node) && 'value' in node) {
    return String(node.value);
  }
  
  return 'value';
}

/**
 * Represents a detected business rule
 */
export interface BusinessRule {
  line: number;
  column: number;
  description: string;
  ruleType: 'validation' | 'compliance' | 'workflow' | 'authorization';
}

/**
 * Detects business rules in code based on patterns
 * 
 * @param node - AST node to analyze
 * @returns Array of detected business rules
 */
export function detectBusinessRules(node: t.Node): BusinessRule[] {
  const rules: BusinessRule[] = [];
  
  // Detect validation rules
  if (isValidationPattern(node)) {
    rules.push({
      line: node.loc?.start.line || 0,
      column: node.loc?.start.column || 0,
      description: 'Validates input data according to business requirements',
      ruleType: 'validation'
    });
  }
  
  // Detect authorization checks
  if (isAuthorizationPattern(node)) {
    rules.push({
      line: node.loc?.start.line || 0,
      column: node.loc?.start.column || 0,
      description: 'Enforces authorization rules for access control',
      ruleType: 'authorization'
    });
  }
  
  // Detect compliance rules
  if (isCompliancePattern(node)) {
    rules.push({
      line: node.loc?.start.line || 0,
      column: node.loc?.start.column || 0,
      description: 'Implements compliance requirement',
      ruleType: 'compliance'
    });
  }
  
  // Detect workflow rules
  if (isWorkflowPattern(node)) {
    rules.push({
      line: node.loc?.start.line || 0,
      column: node.loc?.start.column || 0,
      description: 'Manages workflow state transition',
      ruleType: 'workflow'
    });
  }
  
  return rules;
}

/**
 * Checks if node matches validation pattern
 * 
 * @param node - AST node
 * @returns True if validation pattern detected
 */
function isValidationPattern(node: t.Node): boolean {
  // Look for validation keywords in identifiers
  const validationKeywords = ['validate', 'check', 'verify', 'ensure', 'assert'];
  
  if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
    const name = node.callee.name.toLowerCase();
    return validationKeywords.some(keyword => name.includes(keyword));
  }
  
  if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
    const name = node.property.name.toLowerCase();
    return validationKeywords.some(keyword => name.includes(keyword));
  }
  
  return false;
}

/**
 * Checks if node matches authorization pattern
 * 
 * @param node - AST node
 * @returns True if authorization pattern detected
 */
function isAuthorizationPattern(node: t.Node): boolean {
  const authKeywords = ['authorize', 'permission', 'access', 'role', 'allowed'];
  
  if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
    const name = node.callee.name.toLowerCase();
    return authKeywords.some(keyword => name.includes(keyword));
  }
  
  if (t.isCallExpression(node) && t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) {
    const name = node.callee.property.name.toLowerCase();
    return authKeywords.some(keyword => name.includes(keyword));
  }
  
  if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
    const name = node.property.name.toLowerCase();
    return authKeywords.some(keyword => name.includes(keyword));
  }
  
  return false;
}

/**
 * Checks if node matches compliance pattern
 * 
 * @param node - AST node
 * @returns True if compliance pattern detected
 */
function isCompliancePattern(node: t.Node): boolean {
  const complianceKeywords = ['compliance', 'audit', 'gdpr', 'hipaa', 'pci', 'sox'];
  
  if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
    const name = node.callee.name.toLowerCase();
    return complianceKeywords.some(keyword => name.includes(keyword));
  }
  
  if (t.isMemberExpression(node) && t.isIdentifier(node.object)) {
    const name = node.object.name.toLowerCase();
    return complianceKeywords.some(keyword => name.includes(keyword));
  }
  
  if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
    const name = node.property.name.toLowerCase();
    return complianceKeywords.some(keyword => name.includes(keyword));
  }
  
  return false;
}

/**
 * Checks if node matches workflow pattern
 * 
 * @param node - AST node
 * @returns True if workflow pattern detected
 */
function isWorkflowPattern(node: t.Node): boolean {
  const workflowKeywords = ['workflow', 'transition', 'state', 'status', 'approve', 'reject'];
  
  if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
    const name = node.callee.name.toLowerCase();
    return workflowKeywords.some(keyword => name.includes(keyword));
  }
  
  if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
    const name = node.property.name.toLowerCase();
    return workflowKeywords.some(keyword => name.includes(keyword));
  }
  
  return false;
}
