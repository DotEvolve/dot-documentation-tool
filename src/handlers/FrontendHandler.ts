/**
 * Frontend Handler
 *
 * Specialized documentation handler for Frontend applications (React SPAs).
 * Handles React components, hooks, state management, API clients, and routing.
 */

import { CodeElement, JSDoc, ParamDoc } from "../types";

/**
 * Generates specialized documentation for Frontend components
 *
 * @param element - Code element to document
 * @returns JSDoc with Frontend-specific documentation
 */
export function generateFrontendDoc(element: CodeElement): JSDoc {
  // Check if this is routing configuration (check before React component)
  if (isRoutingConfig(element)) {
    return generateRoutingDoc(element);
  }

  // Check if this is a React component
  if (isReactComponent(element)) {
    return generateReactComponentDoc(element);
  }

  // Check if this is a custom hook
  if (isCustomHook(element)) {
    return generateCustomHookDoc(element);
  }

  // Check if this is state management
  if (isStateManagement(element)) {
    return generateStateManagementDoc(element);
  }

  // Check if this is API client
  if (isAPIClient(element)) {
    return generateAPIClientDoc(element);
  }

  // Default documentation
  return generateDefaultDoc(element);
}

/**
 * Checks if the code element is a React component
 *
 * @param element - Code element to check
 * @returns True if element is a React component
 */
function isReactComponent(element: CodeElement): boolean {
  const name = element.name;
  // React components start with uppercase letter
  return /^[A-Z]/.test(name) && !name.startsWith("use");
}

/**
 * Checks if the code element is a custom hook
 *
 * @param element - Code element to check
 * @returns True if element is a custom hook
 */
function isCustomHook(element: CodeElement): boolean {
  const name = element.name;
  return name.startsWith("use") && /^use[A-Z]/.test(name);
}

/**
 * Checks if the code element is state management
 *
 * @param element - Code element to check
 * @returns True if element is state management
 */
function isStateManagement(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return (
    name.includes("store") ||
    name.includes("reducer") ||
    name.includes("action") ||
    name.includes("context")
  );
}

/**
 * Checks if the code element is an API client
 *
 * @param element - Code element to check
 * @returns True if element is an API client
 */
function isAPIClient(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return (
    name.includes("api") ||
    name.includes("client") ||
    name.includes("service") ||
    name.includes("fetch") ||
    name.includes("request")
  );
}

/**
 * Checks if the code element is routing configuration
 *
 * @param element - Code element to check
 * @returns True if element is routing configuration
 */
function isRoutingConfig(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return (
    name.includes("route") ||
    name.includes("router") ||
    name.includes("navigation")
  );
}

/**
 * Generates documentation for React components
 *
 * @param element - React component element
 * @returns JSDoc for React component
 */
function generateReactComponentDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] =
    element.signature?.parameters.map((p) => ({
      name: p.name,
      type: p.type || "any",
      description: `${p.name === "props" ? "Component props" : `Component prop: ${p.name}`}`,
      optional: p.optional,
    })) || [];

  return {
    description: `React component that renders UI elements. Manages component state, handles user interactions, and integrates with application state. Follows React best practices for performance and maintainability.`,
    params,
    returns: {
      type: "JSX.Element",
      description: "Rendered React component",
    },
    tags: {
      component: "react",
      ui: "true",
    },
    example: `// Usage:\n// <${element.name} ${params.length > 0 ? `${params[0].name}={...}` : ""} />`,
  };
}

/**
 * Generates documentation for custom React hooks
 *
 * @param element - Custom hook element
 * @returns JSDoc for custom hook
 */
function generateCustomHookDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] =
    element.signature?.parameters.map((p) => ({
      name: p.name,
      type: p.type || "any",
      description: `Hook parameter: ${p.name}`,
      optional: p.optional,
    })) || [];

  return {
    description: `Custom React hook that encapsulates reusable stateful logic. Follows React hooks rules and can use other hooks internally. Provides a clean API for component logic reuse.`,
    params,
    returns: {
      type: element.signature?.returnType || "any",
      description: "Hook return value containing state and functions",
    },
    tags: {
      hook: "custom",
      react: "true",
      reusable: "true",
    },
    example: `// Usage:\n// const result = ${element.name}(${params.map((p) => p.name).join(", ")});`,
  };
}

/**
 * Generates documentation for state management
 *
 * @param element - State management element
 * @returns JSDoc for state management
 */
function generateStateManagementDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] =
    element.signature?.parameters.map((p) => ({
      name: p.name,
      type: p.type || "any",
      description: `${p.name.includes("state") ? "Current state" : p.name.includes("action") ? "Action to dispatch" : `State management parameter: ${p.name}`}`,
      optional: p.optional,
    })) || [];

  return {
    description: `State management logic for application state. Handles state updates, action dispatching, and state derivation. Ensures predictable state changes and enables time-travel debugging.`,
    params,
    returns: {
      type: element.signature?.returnType || "any",
      description: "Updated state or state accessor",
    },
    tags: {
      state: "management",
      pattern: "redux/context",
    },
  };
}

/**
 * Generates documentation for API client functions
 *
 * @param element - API client element
 * @returns JSDoc for API client
 */
function generateAPIClientDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] =
    element.signature?.parameters.map((p) => ({
      name: p.name,
      type: p.type || "any",
      description: `${p.name.includes("id") ? "Resource identifier" : p.name.includes("data") ? "Request payload data" : `API parameter: ${p.name}`}`,
      optional: p.optional,
    })) || [];

  return {
    description: `API client function that communicates with backend services. Handles HTTP requests, response parsing, error handling, and authentication. Provides type-safe interface for backend API consumption.`,
    params,
    returns: {
      type: element.signature?.returnType || "Promise<any>",
      description: "API response data",
    },
    throws: [
      {
        type: "NetworkError",
        condition: "When network request fails",
      },
      {
        type: "APIError",
        condition: "When API returns error response",
      },
      {
        type: "AuthenticationError",
        condition: "When authentication token is invalid or expired",
      },
    ],
    tags: {
      api: "client",
      http: "true",
      async: "true",
    },
  };
}

/**
 * Generates documentation for routing configuration
 *
 * @param element - Routing configuration element
 * @returns JSDoc for routing
 */
function generateRoutingDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] =
    element.signature?.parameters.map((p) => ({
      name: p.name,
      type: p.type || "any",
      description: `Routing parameter: ${p.name}`,
      optional: p.optional,
    })) || [];

  return {
    description: `Application routing configuration that defines navigation structure. Maps URLs to components, handles route parameters, and manages navigation guards. Enables deep linking and browser history integration.`,
    params,
    returns: {
      type: element.signature?.returnType || "JSX.Element",
      description: "Router configuration or route component",
    },
    tags: {
      routing: "react-router",
      navigation: "true",
    },
  };
}

/**
 * Generates default documentation for Frontend components
 *
 * @param element - Code element
 * @returns Basic JSDoc
 */
function generateDefaultDoc(element: CodeElement): JSDoc {
  return {
    description: `Frontend component: ${element.name}. Part of the React application UI and logic.`,
    params:
      element.signature?.parameters.map((p) => ({
        name: p.name,
        type: p.type || "any",
        description: `Parameter ${p.name}`,
        optional: p.optional,
      })) || [],
    returns: {
      type: element.signature?.returnType || "any",
      description: "Function return value",
    },
  };
}
