/**
 * Core type definitions for the documentation system
 */

/**
 * Types of code elements that can be documented
 */
export enum CodeElementType {
  FUNCTION = "function",
  CLASS = "class",
  METHOD = "method",
  ROUTE = "route",
  MIDDLEWARE = "middleware",
  MODEL = "model",
  CONFIG = "config",
}

/**
 * HTTP methods for API routes
 */
export enum HTTPMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

/**
 * Types of relationships between data models
 */
export enum RelationshipType {
  ONE_TO_ONE = "one-to-one",
  ONE_TO_MANY = "one-to-many",
  MANY_TO_MANY = "many-to-many",
}

/**
 * Types of side effects a function can have
 */
export enum SideEffectType {
  DATABASE = "database",
  API_CALL = "api_call",
  FILE_IO = "file_io",
  STATE_MUTATION = "state_mutation",
}

/**
 * Types of error handling patterns
 */
export enum ErrorPatternType {
  TRY_CATCH = "try-catch",
  THROW = "throw",
  ERROR_MIDDLEWARE = "error-middleware",
  ERROR_HANDLER = "error-handler",
}

/**
 * Types of data models
 */
export enum DataModelType {
  PRISMA = "prisma",
  INTERFACE = "interface",
  TYPE = "type",
  CLASS = "class",
}

/**
 * Types of validation errors
 */
export enum ValidationErrorType {
  SYNTAX = "syntax",
  COMPLETENESS = "completeness",
  CONSISTENCY = "consistency",
}

/**
 * Types of validation warnings
 */
export enum ValidationWarningType {
  REDUNDANCY = "redundancy",
  TERMINOLOGY = "terminology",
  STYLE = "style",
}

/**
 * Context information about code
 */
export interface CodeContext {
  imports?: string[];
  exports?: string[];
  dependencies?: string[];
  [key: string]: any;
}

/**
 * Represents a side effect of a function
 */
export interface SideEffect {
  type: SideEffectType;
  description: string;
}

/**
 * Represents an error handling pattern
 */
export interface ErrorPattern {
  type: ErrorPatternType;
  errorType?: string;
  description: string;
}

/**
 * Represents a function or method parameter
 */
export interface Parameter {
  name: string;
  type?: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Captures function or method signature details
 */
export interface FunctionSignature {
  name: string;
  parameters: Parameter[];
  returnType?: string;
  isAsync: boolean;
  isGenerator?: boolean;
  throws?: string[];
  sideEffects?: SideEffect[];
}

/**
 * Represents an API response specification
 */
export interface ResponseSpec {
  statusCode: number;
  description: string;
  schema?: Record<string, any>;
}

/**
 * Captures API route details
 */
export interface RouteInfo {
  method: HTTPMethod;
  path: string;
  middleware: string[];
  requiresAuth: boolean;
  requestParams?: {
    path?: Record<string, string>;
    query?: Record<string, string>;
    body?: Record<string, any>;
  };
  responses: ResponseSpec[];
}

/**
 * Represents a field in a data model
 */
export interface ModelField {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
  computed?: boolean;
}

/**
 * Represents a relationship between data models
 */
export interface Relationship {
  type: RelationshipType;
  target: string;
  foreignKey?: string;
}

/**
 * Represents a validation constraint
 */
export interface Validation {
  field: string;
  rule: string;
  message?: string;
}

/**
 * Represents a data model or schema
 */
export interface DataModel {
  name: string;
  type: DataModelType;
  fields: ModelField[];
  relationships?: Relationship[];
  validations?: Validation[];
}

/**
 * Represents a code element that needs documentation
 */
export interface CodeElement {
  type: CodeElementType;
  name: string;
  filePath: string;
  lineNumber: number;
  signature?: FunctionSignature;
  routeInfo?: RouteInfo;
  modelInfo?: DataModel;
  existingDoc?: string;
  context: CodeContext;
}

/**
 * Represents a JSDoc parameter documentation
 */
export interface ParamDoc {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  defaultValue?: string;
}

/**
 * Represents a JSDoc return documentation
 */
export interface ReturnDoc {
  type: string;
  description: string;
}

/**
 * Represents a JSDoc throws documentation
 */
export interface ThrowsDoc {
  type: string;
  condition: string;
}

/**
 * Structured representation of JSDoc comment
 */
export interface JSDoc {
  description: string;
  params?: ParamDoc[];
  returns?: ReturnDoc;
  throws?: ThrowsDoc[];
  example?: string;
  tags?: Record<string, string>;
}

/**
 * Represents generated documentation to be inserted
 */
export interface Documentation {
  element: CodeElement;
  jsdoc: JSDoc;
  insertionPoint: {
    line: number;
    column: number;
  };
  formattedComment: string;
}

/**
 * Represents a validation error
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  location?: {
    line: number;
    column: number;
  };
}

/**
 * Represents a validation warning
 */
export interface ValidationWarning {
  type: ValidationWarningType;
  message: string;
  suggestion?: string;
}

/**
 * Result of documentation validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Type guard to check if a CodeElement is a function
 */
export function isFunctionElement(
  element: CodeElement,
): element is CodeElement & { signature: FunctionSignature } {
  return (
    element.type === CodeElementType.FUNCTION && element.signature !== undefined
  );
}

/**
 * Type guard to check if a CodeElement is a method
 */
export function isMethodElement(
  element: CodeElement,
): element is CodeElement & { signature: FunctionSignature } {
  return (
    element.type === CodeElementType.METHOD && element.signature !== undefined
  );
}

/**
 * Type guard to check if a CodeElement is a route
 */
export function isRouteElement(
  element: CodeElement,
): element is CodeElement & { routeInfo: RouteInfo } {
  return (
    element.type === CodeElementType.ROUTE && element.routeInfo !== undefined
  );
}

/**
 * Type guard to check if a CodeElement is middleware
 */
export function isMiddlewareElement(
  element: CodeElement,
): element is CodeElement & { signature: FunctionSignature } {
  return (
    element.type === CodeElementType.MIDDLEWARE &&
    element.signature !== undefined
  );
}

/**
 * Type guard to check if a CodeElement is a data model
 */
export function isModelElement(
  element: CodeElement,
): element is CodeElement & { modelInfo: DataModel } {
  return (
    element.type === CodeElementType.MODEL && element.modelInfo !== undefined
  );
}

/**
 * Type guard to check if a CodeElement is a config
 */
export function isConfigElement(element: CodeElement): boolean {
  return element.type === CodeElementType.CONFIG;
}

/**
 * Type guard to check if a CodeElement is a class
 */
export function isClassElement(element: CodeElement): boolean {
  return element.type === CodeElementType.CLASS;
}
