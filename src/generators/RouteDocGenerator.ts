/**
 * Route Documentation Generator
 * 
 * Generates JSDoc comments specifically for API route handlers.
 * Documents endpoints, parameters, responses, authentication, and side effects.
 */

import { RouteInfo, JSDoc, ParamDoc, ThrowsDoc, HTTPMethod } from '../types';

/**
 * Generates JSDoc documentation for an API route handler
 * 
 * @param routeInfo - Information about the API route
 * @returns JSDoc object with complete route documentation
 */
export function generateRouteDoc(routeInfo: RouteInfo): JSDoc {
  const description = generateRouteDescription(routeInfo);
  const params = generateRouteParams(routeInfo);
  const returns = generateRouteReturns(routeInfo);
  const throws = generateRouteThrows(routeInfo);
  
  const jsdoc: JSDoc = {
    description,
    params,
    returns,
    throws,
    tags: {
      route: `${routeInfo.method} ${routeInfo.path}`,
      access: routeInfo.requiresAuth ? 'protected' : 'public'
    }
  };

  // Helper to check if an object has meaningful content
  const hasKeys = (obj: any): boolean => {
    return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
  };

  // Add example if we have request/response info with actual content
  const hasBody = hasKeys(routeInfo.requestParams?.body);
  const hasResponseSchema = routeInfo.responses.some(r => hasKeys(r.schema));
  
  if (hasBody || hasResponseSchema) {
    const example = generateRouteExample(routeInfo);
    if (example) {
      jsdoc.example = example;
    }
  }

  return jsdoc;
}

/**
 * Generates a description for the route based on HTTP method and path
 * 
 * @param routeInfo - Route information
 * @returns Human-readable description of the route's purpose
 */
function generateRouteDescription(routeInfo: RouteInfo): string {
  const { method, path } = routeInfo;
  
  // Extract resource name from path (skip path parameters starting with :)
  const pathParts = path.split('/').filter(p => p && !p.startsWith(':'));
  const resource = pathParts[pathParts.length - 1] || 'resource';
  
  // Generate description based on HTTP method
  const methodDescriptions: Record<HTTPMethod, string> = {
    [HTTPMethod.GET]: `Retrieves ${resource} information`,
    [HTTPMethod.POST]: `Creates a new ${resource}`,
    [HTTPMethod.PUT]: `Updates an existing ${resource}`,
    [HTTPMethod.PATCH]: `Partially updates a ${resource}`,
    [HTTPMethod.DELETE]: `Deletes a ${resource}`
  };
  
  let description = methodDescriptions[method] || `Handles ${method} request for ${path}`;
  
  // Add authentication note
  if (routeInfo.requiresAuth) {
    description += '. Requires authentication.';
  }
  
  return description;
}

/**
 * Generates parameter documentation for the route
 * 
 * @param routeInfo - Route information
 * @returns Array of parameter documentation
 */
function generateRouteParams(routeInfo: RouteInfo): ParamDoc[] {
  const params: ParamDoc[] = [];
  
  // Always document req and res
  params.push({
    name: 'req',
    type: 'express.Request',
    description: 'Express request object'
  });
  
  params.push({
    name: 'res',
    type: 'express.Response',
    description: 'Express response object'
  });
  
  // Document next if middleware is present
  if (routeInfo.middleware && routeInfo.middleware.length > 0) {
    params.push({
      name: 'next',
      type: 'express.NextFunction',
      description: 'Express next middleware function',
      optional: true
    });
  }
  
  return params;
}

/**
 * Generates return type documentation for the route
 * 
 * @param routeInfo - Route information
 * @returns Return documentation
 */
function generateRouteReturns(routeInfo: RouteInfo): { type: string; description: string } {
  const successResponse = routeInfo.responses.find(r => r.statusCode >= 200 && r.statusCode < 300);
  
  if (successResponse) {
    return {
      type: 'Promise<void>',
      description: `${successResponse.statusCode} - ${successResponse.description}`
    };
  }
  
  return {
    type: 'Promise<void>',
    description: 'Express response sent to client'
  };
}

/**
 * Generates error documentation for the route
 * 
 * @param routeInfo - Route information
 * @returns Array of error documentation
 */
function generateRouteThrows(routeInfo: RouteInfo): ThrowsDoc[] {
  const throws: ThrowsDoc[] = [];
  
  // Document error responses
  const errorResponses = routeInfo.responses.filter(r => r.statusCode >= 400);
  
  for (const response of errorResponses) {
    throws.push({
      type: `HTTP${response.statusCode}`,
      condition: response.description
    });
  }
  
  return throws;
}

/**
 * Generates an example usage for the route
 * 
 * @param routeInfo - Route information
 * @returns Example code string
 */
function generateRouteExample(routeInfo: RouteInfo): string {
  const { method, path, requestParams, responses } = routeInfo;
  
  let example = `// ${method} ${path}\n`;
  let hasContent = false;
  
  // Helper to check if an object has meaningful content
  const hasKeys = (obj: any): boolean => {
    return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
  };
  
  // Add request example
  if (hasKeys(requestParams?.body)) {
    example += `// Request body:\n`;
    example += `// ${JSON.stringify(requestParams!.body, null, 2).split('\n').join('\n// ')}\n`;
    hasContent = true;
  }
  
  // Add response example
  const successResponse = responses.find(r => r.statusCode >= 200 && r.statusCode < 300);
  if (successResponse && hasKeys(successResponse.schema)) {
    example += `// Response (${successResponse.statusCode}):\n`;
    example += `// ${JSON.stringify(successResponse.schema, null, 2).split('\n').join('\n// ')}`;
    hasContent = true;
  }
  
  // Only return example if we added actual content beyond the route line
  return hasContent ? example : '';
}
