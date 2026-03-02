/**
 * Extension Handler
 * 
 * Specialized documentation handler for Chrome Extension (MCA Extension).
 * Handles Chrome APIs, content scripts, message passing, and authentication sync.
 */

import { CodeElement, JSDoc, ParamDoc } from '../types';

/**
 * Generates specialized documentation for Chrome Extension components
 * 
 * @param element - Code element to document
 * @returns JSDoc with Extension-specific documentation
 */
export function generateExtensionDoc(element: CodeElement): JSDoc {
  // Check if this is Chrome API usage
  if (isChromeAPI(element)) {
    return generateChromeAPIDoc(element);
  }
  
  // Check if this is content script
  if (isContentScript(element)) {
    return generateContentScriptDoc(element);
  }
  
  // Check if this is message passing
  if (isMessagePassing(element)) {
    return generateMessagePassingDoc(element);
  }
  
  // Check if this is authentication sync
  if (isAuthSync(element)) {
    return generateAuthSyncDoc(element);
  }
  
  // Check if this is background script
  if (isBackgroundScript(element)) {
    return generateBackgroundScriptDoc(element);
  }
  
  // Default documentation
  return generateDefaultDoc(element);
}

/**
 * Checks if the code element uses Chrome APIs
 * 
 * @param element - Code element to check
 * @returns True if element uses Chrome APIs
 */
function isChromeAPI(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('chrome') || 
         name.includes('browser') ||
         name.includes('extension') ||
         name.includes('storage') ||
         name.includes('tabs');
}

/**
 * Checks if the code element is a content script
 * 
 * @param element - Code element to check
 * @returns True if element is a content script
 */
function isContentScript(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('content') || 
         name.includes('inject') ||
         name.includes('dom') ||
         name.includes('page');
}

/**
 * Checks if the code element is message passing
 * 
 * @param element - Code element to check
 * @returns True if element is message passing
 */
function isMessagePassing(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('message') || 
         name.includes('send') ||
         name.includes('receive') ||
         name.includes('listener');
}

/**
 * Checks if the code element is authentication sync
 * 
 * @param element - Code element to check
 * @returns True if element is authentication sync
 */
function isAuthSync(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('auth') || 
         name.includes('token') ||
         name.includes('session') ||
         name.includes('sync');
}

/**
 * Checks if the code element is a background script
 * 
 * @param element - Code element to check
 * @returns True if element is a background script
 */
function isBackgroundScript(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('background') || 
         name.includes('service') ||
         name.includes('worker');
}

/**
 * Generates documentation for Chrome API usage
 * 
 * @param element - Chrome API element
 * @returns JSDoc for Chrome API
 */
function generateChromeAPIDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `Chrome API parameter: ${p.name}`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Chrome Extension API function that interacts with browser capabilities. Provides access to browser features like storage, tabs, notifications, and more. Requires appropriate permissions in manifest.json.`,
    params,
    returns: {
      type: element.signature?.returnType || 'Promise<any>',
      description: 'Chrome API operation result'
    },
    throws: [
      {
        type: 'ChromeAPIError',
        condition: 'When Chrome API call fails or permission is denied'
      }
    ],
    tags: {
      api: 'chrome-extension',
      browser: 'chrome',
      permissions: 'required'
    }
  };
}

/**
 * Generates documentation for content scripts
 * 
 * @param element - Content script element
 * @returns JSDoc for content script
 */
function generateContentScriptDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `Content script parameter: ${p.name}`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Content script that runs in the context of web pages. Has access to the page DOM and can modify page content. Communicates with background scripts via message passing. Isolated from page JavaScript for security.`,
    params,
    returns: {
      type: element.signature?.returnType || 'void',
      description: 'Content script execution result'
    },
    tags: {
      script: 'content',
      context: 'page',
      isolated: 'true'
    },
    example: `// Content script runs in page context\n// Can access and modify DOM\n// Communicates with background via chrome.runtime.sendMessage()`
  };
}

/**
 * Generates documentation for message passing
 * 
 * @param element - Message passing element
 * @returns JSDoc for message passing
 */
function generateMessagePassingDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name.includes('message') ? 'Message data to send/receive' : p.name.includes('sender') ? 'Message sender information' : `Message passing parameter: ${p.name}`}`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Message passing function for communication between extension components (background, content scripts, popup). Enables asynchronous communication with request-response pattern. Supports both one-time messages and long-lived connections.`,
    params,
    returns: {
      type: element.signature?.returnType || 'Promise<any>',
      description: 'Message response or acknowledgment'
    },
    tags: {
      pattern: 'message-passing',
      async: 'true',
      communication: 'inter-component'
    },
    example: `// Send message:\n// chrome.runtime.sendMessage({ type: 'ACTION', data: {...} })\n// Receive message:\n// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {...})`
  };
}

/**
 * Generates documentation for authentication synchronization
 * 
 * @param element - Auth sync element
 * @returns JSDoc for auth sync
 */
function generateAuthSyncDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name.includes('token') ? 'Authentication token' : p.name.includes('session') ? 'Session data' : `Auth sync parameter: ${p.name}`}`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Authentication synchronization function that keeps extension auth state in sync with web application. Stores tokens securely in chrome.storage, handles token refresh, and manages session lifecycle. Ensures seamless user experience across extension and web app.`,
    params,
    returns: {
      type: element.signature?.returnType || 'Promise<void>',
      description: 'Auth sync operation result'
    },
    throws: [
      {
        type: 'AuthSyncError',
        condition: 'When authentication sync fails'
      },
      {
        type: 'TokenExpiredError',
        condition: 'When authentication token has expired'
      }
    ],
    tags: {
      auth: 'sync',
      storage: 'chrome.storage',
      security: 'token-management'
    }
  };
}

/**
 * Generates documentation for background scripts
 * 
 * @param element - Background script element
 * @returns JSDoc for background script
 */
function generateBackgroundScriptDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `Background script parameter: ${p.name}`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Background script (service worker) that runs independently of web pages. Handles long-running operations, manages extension state, and coordinates between content scripts and popup. Persists across browser sessions.`,
    params,
    returns: {
      type: element.signature?.returnType || 'void',
      description: 'Background script operation result'
    },
    tags: {
      script: 'background',
      worker: 'service-worker',
      persistent: 'true'
    }
  };
}

/**
 * Generates default documentation for Extension components
 * 
 * @param element - Code element
 * @returns Basic JSDoc
 */
function generateDefaultDoc(element: CodeElement): JSDoc {
  return {
    description: `Chrome Extension component: ${element.name}. Part of the MCA Extension for attended automation.`,
    params: element.signature?.parameters.map(p => ({
      name: p.name,
      type: p.type || 'any',
      description: `Parameter ${p.name}`,
      optional: p.optional
    })) || [],
    returns: {
      type: element.signature?.returnType || 'void',
      description: 'Function return value'
    }
  };
}
