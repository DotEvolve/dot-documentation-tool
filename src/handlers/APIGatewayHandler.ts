/**
 * API Gateway Handler
 *
 * Specialized documentation handler for API Gateway service.
 * Handles authentication middleware, proxy routing, CORS, and security headers.
 */

import { CodeElement, JSDoc, ParamDoc, ThrowsDoc } from "../types";

/**
 * Generates specialized documentation for API Gateway components
 *
 * @param element - Code element to document
 * @returns JSDoc with API Gateway-specific documentation
 */
export function generateAPIGatewayDoc(element: CodeElement): JSDoc {
  // Check if this is authentication middleware
  if (isAuthMiddleware(element)) {
    return generateAuthMiddlewareDoc(element);
  }

  // Check if this is proxy routing configuration
  if (isProxyRoute(element)) {
    return generateProxyRouteDoc(element);
  }

  // Check if this is CORS configuration
  if (isCORSConfig(element)) {
    return generateCORSDoc(element);
  }

  // Check if this is security headers middleware
  if (isSecurityHeadersMiddleware(element)) {
    return generateSecurityHeadersDoc(element);
  }

  // Default documentation
  return generateDefaultDoc(element);
}

/**
 * Checks if the code element is authentication middleware
 *
 * @param element - Code element to check
 * @returns True if element is authentication middleware
 */
function isAuthMiddleware(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return (
    name.includes("auth") ||
    name.includes("authenticate") ||
    name.includes("verify") ||
    name.includes("token")
  );
}

/**
 * Checks if the code element is a proxy route
 *
 * @param element - Code element to check
 * @returns True if element is a proxy route
 */
function isProxyRoute(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return (
    name.includes("proxy") ||
    name.includes("forward") ||
    name.includes("redirect")
  );
}

/**
 * Checks if the code element is CORS configuration
 *
 * @param element - Code element to check
 * @returns True if element is CORS configuration
 */
function isCORSConfig(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes("cors");
}

/**
 * Checks if the code element is security headers middleware
 *
 * @param element - Code element to check
 * @returns True if element is security headers middleware
 */
function isSecurityHeadersMiddleware(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return (
    name.includes("security") ||
    name.includes("header") ||
    name.includes("helmet")
  );
}

/**
 * Generates documentation for authentication middleware
 *
 * @param _element - Authentication middleware element
 * @returns JSDoc for authentication middleware
 */
function generateAuthMiddlewareDoc(_element: CodeElement): JSDoc {
  const params: ParamDoc[] = [
    {
      name: "req",
      type: "express.Request",
      description:
        "Express request object containing authentication credentials",
    },
    {
      name: "res",
      type: "express.Response",
      description: "Express response object for sending authentication errors",
    },
    {
      name: "next",
      type: "express.NextFunction",
      description:
        "Callback to pass control to next middleware if authenticated",
    },
  ];

  const throws: ThrowsDoc[] = [
    {
      type: "HTTP401",
      condition: "When authentication token is missing or invalid",
    },
    {
      type: "HTTP403",
      condition: "When user lacks required permissions",
    },
  ];

  return {
    description: `Authentication middleware that verifies user credentials and attaches user information to the request. Protects routes by ensuring only authenticated users can access them.`,
    params,
    returns: {
      type: "void",
      description:
        "Calls next() if authenticated, sends error response otherwise",
    },
    throws,
    tags: {
      middleware: "authentication",
      access: "protected",
    },
  };
}

/**
 * Generates documentation for proxy routing configuration
 *
 * @param _element - Proxy route element
 * @returns JSDoc for proxy route
 */
function generateProxyRouteDoc(_element: CodeElement): JSDoc {
  const params: ParamDoc[] = [
    {
      name: "req",
      type: "express.Request",
      description: "Incoming request to be proxied to backend service",
    },
    {
      name: "res",
      type: "express.Response",
      description: "Response object to send backend service response",
    },
  ];

  return {
    description: `Proxy route that forwards requests to backend microservices. Handles request transformation, response aggregation, and error handling for service communication.`,
    params,
    returns: {
      type: "Promise<void>",
      description: "Proxied response from backend service",
    },
    throws: [
      {
        type: "HTTP502",
        condition: "When backend service is unavailable",
      },
      {
        type: "HTTP504",
        condition: "When backend service request times out",
      },
    ],
    tags: {
      pattern: "proxy",
      service: "gateway",
    },
  };
}

/**
 * Generates documentation for CORS configuration
 *
 * @param _element - CORS configuration element
 * @returns JSDoc for CORS configuration
 */
function generateCORSDoc(_element: CodeElement): JSDoc {
  return {
    description: `CORS (Cross-Origin Resource Sharing) configuration middleware. Defines which origins, methods, and headers are allowed for cross-origin requests. Essential for frontend-backend communication.`,
    params: [
      {
        name: "req",
        type: "express.Request",
        description: "Request object to check origin",
      },
      {
        name: "res",
        type: "express.Response",
        description: "Response object to set CORS headers",
      },
      {
        name: "next",
        type: "express.NextFunction",
        description: "Callback to continue request processing",
      },
    ],
    returns: {
      type: "void",
      description: "Sets CORS headers and calls next()",
    },
    tags: {
      middleware: "cors",
      security: "cross-origin",
    },
  };
}

/**
 * Generates documentation for security headers middleware
 *
 * @param _element - Security headers middleware element
 * @returns JSDoc for security headers
 */
function generateSecurityHeadersDoc(_element: CodeElement): JSDoc {
  return {
    description: `Security headers middleware that adds HTTP security headers to responses. Protects against common web vulnerabilities like XSS, clickjacking, and MIME sniffing. Implements security best practices.`,
    params: [
      {
        name: "req",
        type: "express.Request",
        description: "Request object",
      },
      {
        name: "res",
        type: "express.Response",
        description: "Response object to set security headers",
      },
      {
        name: "next",
        type: "express.NextFunction",
        description: "Callback to continue request processing",
      },
    ],
    returns: {
      type: "void",
      description: "Sets security headers and calls next()",
    },
    tags: {
      middleware: "security",
      headers:
        "Content-Security-Policy, X-Frame-Options, X-Content-Type-Options",
    },
  };
}

/**
 * Generates default documentation for API Gateway components
 *
 * @param element - Code element
 * @returns Basic JSDoc
 */
function generateDefaultDoc(element: CodeElement): JSDoc {
  return {
    description: `API Gateway component: ${element.name}. Handles request routing, authentication, and service orchestration.`,
    params:
      element.signature?.parameters.map((p) => ({
        name: p.name,
        type: p.type || "any",
        description: `Parameter ${p.name}`,
        optional: p.optional,
      })) || [],
    returns: {
      type: element.signature?.returnType || "void",
      description: "Function return value",
    },
  };
}
