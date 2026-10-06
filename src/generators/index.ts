/**
 * Documentation Generators Module
 *
 * Provides functionality for generating JSDoc comments based on code analysis.
 * Handles different code patterns and ensures consistent documentation format.
 */

export { generateJSDoc, formatJSDoc } from "./JSDocGenerator.js";
export { generateRouteDoc } from "./RouteDocGenerator.js";
export {
  generateInlineComments,
  detectBusinessRules,
  InlineComment,
  BusinessRule,
} from "./InlineCommentGenerator.js";
