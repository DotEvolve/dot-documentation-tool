/**
 * Documentation Generators Module
 * 
 * Provides functionality for generating JSDoc comments based on code analysis.
 * Handles different code patterns and ensures consistent documentation format.
 */

export { generateJSDoc, formatJSDoc } from './JSDocGenerator';
export { generateRouteDoc } from './RouteDocGenerator';
export { generateInlineComments, detectBusinessRules, InlineComment, BusinessRule } from './InlineCommentGenerator';
