/**
 * JSDoc Generator
 * 
 * Generates structured JSDoc comments from CodeElement objects.
 * Creates meaningful descriptions, documents parameters with types,
 * documents return values, and documents errors that can be thrown.
 */

import {
  CodeElement,
  JSDoc,
  ParamDoc,
  ReturnDoc,
  ThrowsDoc
} from '../types';

/**
 * Generates a JSDoc comment for a code element
 * 
 * @param {CodeElement} element - The code element to document
 * @returns {JSDoc} The generated JSDoc structure
 * @throws {Error} If the element type is not supported or lacks required information
 */
export function generateJSDoc(element: CodeElement): JSDoc {
  if (!element.signature) {
    throw new Error(`Cannot generate JSDoc for element without signature: ${element.name}`);
  }

  const description = generateDescription(element);
  const params = generateParamDocs(element);
  const returns = generateReturnDoc(element);
  const throws = generateThrowsDocs(element);

  return {
    description,
    params: params.length > 0 ? params : undefined,
    returns,
    throws: throws.length > 0 ? throws : undefined
  };
}

/**
 * Generates a meaningful description based on function name and context
 * 
 * @param {CodeElement} element - The code element to describe
 * @returns {string} A human-readable description
 */
function generateDescription(element: CodeElement): string {
  const { name, signature } = element;
  
  // Convert camelCase or PascalCase to words
  const words = name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  // Detect common patterns
  if (name.startsWith('get')) {
    const target = words.replace(/^Get\s+/, '');
    return `Retrieves ${target.toLowerCase()}`;
  }

  if (name.startsWith('set')) {
    const target = words.replace(/^Set\s+/, '');
    return `Sets ${target.toLowerCase()}`;
  }

  if (name.startsWith('create')) {
    const target = words.replace(/^Create\s+/, '');
    return `Creates a new ${target.toLowerCase()}`;
  }

  if (name.startsWith('update')) {
    const target = words.replace(/^Update\s+/, '');
    return `Updates ${target.toLowerCase()}`;
  }

  if (name.startsWith('delete') || name.startsWith('remove')) {
    const target = words.replace(/^(Delete|Remove)\s+/, '');
    return `Deletes ${target.toLowerCase()}`;
  }

  if (name.startsWith('find') || name.startsWith('search')) {
    const target = words.replace(/^(Find|Search)\s+/, '');
    return `Finds ${target.toLowerCase()}`;
  }

  if (name.startsWith('validate')) {
    const target = words.replace(/^Validate\s+/, '');
    return `Validates ${target.toLowerCase()}`;
  }

  if (name.startsWith('calculate') || name.startsWith('compute')) {
    const target = words.replace(/^(Calculate|Compute)\s+/, '');
    return `Calculates ${target.toLowerCase()}`;
  }

  if (name.startsWith('is') || name.startsWith('has') || name.startsWith('can')) {
    return `Checks if ${words.toLowerCase()}`;
  }

  // Check for async operations
  if (signature?.isAsync) {
    return `Asynchronously ${words.toLowerCase()}`;
  }

  // Default description
  return words;
}

/**
 * Generates @param documentation for all function parameters
 * 
 * @param {CodeElement} element - The code element with parameters
 * @returns {ParamDoc[]} Array of parameter documentation
 */
function generateParamDocs(element: CodeElement): ParamDoc[] {
  if (!element.signature?.parameters) {
    return [];
  }

  return element.signature.parameters.map(param => {
    const paramDoc: ParamDoc = {
      name: param.name,
      type: param.type || '*',
      description: generateParamDescription(param.name, param.type),
      optional: param.optional
    };

    if (param.defaultValue) {
      paramDoc.defaultValue = param.defaultValue;
    }

    return paramDoc;
  });
}

/**
 * Generates a description for a parameter based on its name and type
 * 
 * @param {string} name - The parameter name
 * @param {string} [type] - The parameter type
 * @returns {string} A description of the parameter
 */
function generateParamDescription(name: string, type?: string): string {
  // Convert camelCase to words
  const words = name
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();

  // Common parameter patterns
  if (name === 'id') {
    return 'The unique identifier';
  }

  if (name.endsWith('Id')) {
    const entity = name.replace(/Id$/, '');
    const entityWords = entity.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    return `The ${entityWords} identifier`;
  }

  if (name === 'data' || name === 'payload') {
    return 'The data to process';
  }

  if (name === 'options' || name === 'config') {
    return 'Configuration options';
  }

  if (name === 'callback' || name === 'cb') {
    return 'Callback function';
  }

  if (name === 'error' || name === 'err') {
    return 'Error object';
  }

  if (name === 'req' || name === 'request') {
    return 'HTTP request object';
  }

  if (name === 'res' || name === 'response') {
    return 'HTTP response object';
  }

  if (name === 'next') {
    return 'Next middleware function';
  }

  // Type-based descriptions
  if (type) {
    if (type.includes('[]') || type.toLowerCase().includes('array')) {
      return `Array of ${words}`;
    }

    if (type.toLowerCase() === 'boolean') {
      return `Whether ${words}`;
    }

    if (type.toLowerCase().includes('function')) {
      return `Function to ${words}`;
    }
  }

  // Default description
  return `The ${words}`;
}

/**
 * Generates @returns documentation for the function return value
 * 
 * @param {CodeElement} element - The code element with return type
 * @returns {ReturnDoc | undefined} Return documentation or undefined if void
 */
function generateReturnDoc(element: CodeElement): ReturnDoc | undefined {
  const returnType = element.signature?.returnType;

  // Don't document void returns
  if (!returnType || returnType === 'void') {
    return undefined;
  }

  // Handle Promise types
  if (returnType.startsWith('Promise<')) {
    const innerType = returnType.match(/Promise<(.+)>/)?.[1] || '*';
    return {
      type: returnType,
      description: `Promise that resolves to ${generateReturnDescription(innerType, element.name)}`
    };
  }

  return {
    type: returnType,
    description: generateReturnDescription(returnType, element.name)
  };
}

/**
 * Generates a description for the return value
 * 
 * @param {string} returnType - The return type
 * @param {string} functionName - The function name for context
 * @returns {string} A description of the return value
 */
function generateReturnDescription(returnType: string, functionName: string): string {
  // Handle array types
  if (returnType.includes('[]') || returnType.toLowerCase().includes('array')) {
    const elementType = returnType.replace(/\[\]$/, '').replace(/Array<(.+)>/, '$1');
    return `Array of ${elementType} objects`;
  }

  // Handle boolean returns
  if (returnType.toLowerCase() === 'boolean') {
    if (functionName.startsWith('is') || functionName.startsWith('has') || functionName.startsWith('can')) {
      return 'True if condition is met, false otherwise';
    }
    return 'Boolean indicating success or failure';
  }

  // Handle number returns
  if (returnType.toLowerCase() === 'number') {
    if (functionName.includes('count') || functionName.includes('Count')) {
      return 'The count of items';
    }
    if (functionName.includes('calculate') || functionName.includes('compute')) {
      return 'The calculated value';
    }
    return 'Numeric result';
  }

  // Handle string returns
  if (returnType.toLowerCase() === 'string') {
    return 'String result';
  }

  // Handle object returns
  if (returnType === 'object' || returnType.startsWith('{')) {
    return 'Object containing the result';
  }

  // Default description with type
  return `The ${returnType}`;
}

/**
 * Generates @throws documentation for detected errors
 * 
 * @param {CodeElement} element - The code element that may throw errors
 * @returns {ThrowsDoc[]} Array of throws documentation
 */
function generateThrowsDocs(element: CodeElement): ThrowsDoc[] {
  const throws = element.signature?.throws || [];
  const sideEffects = element.signature?.sideEffects || [];

  const throwsDocs: ThrowsDoc[] = [];

  // Document explicitly thrown errors
  for (const errorType of throws) {
    throwsDocs.push({
      type: errorType,
      condition: generateThrowsCondition(errorType)
    });
  }

  // Document potential errors from side effects
  for (const effect of sideEffects) {
    if (effect.type === 'database') {
      throwsDocs.push({
        type: 'Error',
        condition: 'If database operation fails'
      });
    } else if (effect.type === 'api_call') {
      throwsDocs.push({
        type: 'Error',
        condition: 'If external API call fails'
      });
    } else if (effect.type === 'file_io') {
      throwsDocs.push({
        type: 'Error',
        condition: 'If file operation fails'
      });
    }
  }

  // Remove duplicates
  const uniqueThrows = throwsDocs.filter((doc, index, self) =>
    index === self.findIndex(t => t.type === doc.type && t.condition === doc.condition)
  );

  return uniqueThrows;
}

/**
 * Generates a condition description for a thrown error
 * 
 * @param {string} errorType - The error type
 * @returns {string} A description of when the error is thrown
 */
function generateThrowsCondition(errorType: string): string {
  const lowerType = errorType.toLowerCase();

  if (lowerType.includes('validation')) {
    return 'If input validation fails';
  }

  if (lowerType.includes('notfound') || lowerType.includes('not_found')) {
    return 'If the requested resource is not found';
  }

  if (lowerType.includes('unauthorized') || lowerType.includes('auth')) {
    return 'If authentication or authorization fails';
  }

  if (lowerType.includes('forbidden')) {
    return 'If access is forbidden';
  }

  if (lowerType.includes('conflict')) {
    return 'If a conflict occurs';
  }

  if (lowerType.includes('badrequest') || lowerType.includes('bad_request')) {
    return 'If the request is invalid';
  }

  if (lowerType.includes('timeout')) {
    return 'If the operation times out';
  }

  // Default condition
  return 'If an error occurs during execution';
}

/**
 * Formats a JSDoc structure into a properly formatted JSDoc comment string
 * 
 * @param {JSDoc} jsdoc - The JSDoc structure to format
 * @returns {string} The formatted JSDoc comment string with proper indentation and spacing
 */
export function formatJSDoc(jsdoc: JSDoc): string {
  const lines: string[] = [];
  
  // Opening comment
  lines.push('/**');
  
  // Description - handle multi-line descriptions
  if (jsdoc.description) {
    const descriptionLines = jsdoc.description.split('\n');
    descriptionLines.forEach(line => {
      lines.push(` * ${line.trim()}`);
    });
  }
  
  // Add blank line after description if there are other tags
  const hasTags = jsdoc.params || jsdoc.returns || jsdoc.throws || jsdoc.example || jsdoc.tags;
  if (jsdoc.description && hasTags) {
    lines.push(' *');
  }
  
  // Parameters
  if (jsdoc.params && jsdoc.params.length > 0) {
    jsdoc.params.forEach(param => {
      const defaultValue = param.defaultValue ? `=${param.defaultValue}` : '';
      const paramName = `${param.name}${defaultValue}`;
      
      // Format: @param {type} [name=default] - description
      if (param.optional) {
        lines.push(` * @param {${param.type}} [${paramName}] - ${param.description}`);
      } else {
        lines.push(` * @param {${param.type}} ${paramName} - ${param.description}`);
      }
    });
  }
  
  // Returns
  if (jsdoc.returns) {
    lines.push(` * @returns {${jsdoc.returns.type}} ${jsdoc.returns.description}`);
  }
  
  // Throws
  if (jsdoc.throws && jsdoc.throws.length > 0) {
    jsdoc.throws.forEach(throwsDoc => {
      lines.push(` * @throws {${throwsDoc.type}} ${throwsDoc.condition}`);
    });
  }
  
  // Example
  if (jsdoc.example) {
    lines.push(' * @example');
    const exampleLines = jsdoc.example.split('\n');
    exampleLines.forEach(line => {
      lines.push(` * ${line}`);
    });
  }
  
  // Custom tags
  if (jsdoc.tags) {
    Object.entries(jsdoc.tags).forEach(([tagName, tagValue]) => {
      lines.push(` * @${tagName} ${tagValue}`);
    });
  }
  
  // Closing comment
  lines.push(' */');
  
  return lines.join('\n');
}
