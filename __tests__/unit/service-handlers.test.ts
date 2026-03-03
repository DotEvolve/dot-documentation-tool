/**
 * Unit tests for service-specific handlers
 */

import { generateAPIGatewayDoc } from "../../src/handlers/APIGatewayHandler";
import { generateWorkflowServiceDoc } from "../../src/handlers/WorkflowServiceHandler";
import { generateRuleEngineDoc } from "../../src/handlers/RuleEngineHandler";
import { generateFrontendDoc } from "../../src/handlers/FrontendHandler";
import { generateExtensionDoc } from "../../src/handlers/ExtensionHandler";
import { CodeElement, CodeElementType } from "../../src/types";

describe("API Gateway Handler", () => {
  it("should generate documentation for authentication middleware", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "authenticateUser",
      filePath: "src/middleware/auth.ts",
      lineNumber: 10,
      signature: {
        name: "authenticateUser",
        parameters: [
          { name: "req", type: "Request", optional: false },
          { name: "res", type: "Response", optional: false },
          { name: "next", type: "NextFunction", optional: false },
        ],
        isAsync: true,
        returnType: "void",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateAPIGatewayDoc(element);

    expect(jsdoc.description).toContain("Authentication middleware");
    expect(jsdoc.params).toHaveLength(3);
    expect(jsdoc.throws).toBeDefined();
    expect(jsdoc.throws!.length).toBeGreaterThan(0);
    expect(jsdoc.tags?.middleware).toBe("authentication");
  });

  it("should generate documentation for proxy routes", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "proxyToBackend",
      filePath: "src/routes/proxy.ts",
      lineNumber: 20,
      signature: {
        name: "proxyToBackend",
        parameters: [
          { name: "req", type: "Request", optional: false },
          { name: "res", type: "Response", optional: false },
        ],
        isAsync: true,
        returnType: "Promise<void>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateAPIGatewayDoc(element);

    expect(jsdoc.description).toContain("Proxy route");
    expect(jsdoc.description).toContain("backend");
    expect(jsdoc.tags?.pattern).toBe("proxy");
  });

  it("should generate documentation for CORS configuration", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "corsMiddleware",
      filePath: "src/middleware/cors.ts",
      lineNumber: 5,
      signature: {
        name: "corsMiddleware",
        parameters: [],
        isAsync: false,
        returnType: "void",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateAPIGatewayDoc(element);

    expect(jsdoc.description).toContain("CORS");
    expect(jsdoc.tags?.middleware).toBe("cors");
  });

  it("should generate documentation for security headers", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "securityHeaders",
      filePath: "src/middleware/security.ts",
      lineNumber: 15,
      signature: {
        name: "securityHeaders",
        parameters: [],
        isAsync: false,
        returnType: "void",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateAPIGatewayDoc(element);

    expect(jsdoc.description).toContain("Security headers");
    expect(jsdoc.tags?.middleware).toBe("security");
  });
});

describe("Workflow Service Handler", () => {
  it("should generate documentation for Prisma operations", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "createWorkflow",
      filePath: "src/services/workflow.ts",
      lineNumber: 30,
      signature: {
        name: "createWorkflow",
        parameters: [{ name: "data", type: "WorkflowData", optional: false }],
        isAsync: true,
        returnType: "Promise<Workflow>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateWorkflowServiceDoc(element);

    expect(jsdoc.description).toContain("Prisma");
    expect(jsdoc.description).toContain("Database");
    expect(jsdoc.throws).toBeDefined();
    expect(jsdoc.throws!.some((t) => t.type.includes("Prisma"))).toBe(true);
  });

  it("should generate documentation for business logic", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "validateWorkflowRules",
      filePath: "src/logic/validation.ts",
      lineNumber: 50,
      signature: {
        name: "validateWorkflowRules",
        parameters: [{ name: "workflow", type: "Workflow", optional: false }],
        isAsync: false,
        returnType: "ValidationResult",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateWorkflowServiceDoc(element);

    expect(jsdoc.description).toContain("Business logic");
    expect(jsdoc.tags?.domain).toBe("business-logic");
  });

  it("should generate documentation for PDF generation", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "generatePDFReport",
      filePath: "src/services/pdf.ts",
      lineNumber: 100,
      signature: {
        name: "generatePDFReport",
        parameters: [{ name: "data", type: "ReportData", optional: false }],
        isAsync: true,
        returnType: "Promise<Buffer>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateWorkflowServiceDoc(element);

    expect(jsdoc.description).toContain("PDF");
    expect(jsdoc.returns?.type).toBe("Promise<Buffer>");
  });

  it("should generate documentation for audit logging", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "auditUserAction",
      filePath: "src/services/audit.ts",
      lineNumber: 75,
      signature: {
        name: "auditUserAction",
        parameters: [
          { name: "action", type: "string", optional: false },
          { name: "userId", type: "string", optional: false },
        ],
        isAsync: true,
        returnType: "Promise<void>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateWorkflowServiceDoc(element);

    expect(jsdoc.description).toContain("Audit");
    expect(jsdoc.tags?.compliance).toBe("audit");
  });

  it("should generate documentation for compliance validation", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "checkComplianceRequirements",
      filePath: "src/services/compliance.ts",
      lineNumber: 60,
      signature: {
        name: "checkComplianceRequirements",
        parameters: [{ name: "data", type: "any", optional: false }],
        isAsync: true,
        returnType: "Promise<ValidationResult>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateWorkflowServiceDoc(element);

    expect(jsdoc.description).toContain("Compliance");
    expect(jsdoc.tags?.compliance).toBe("validation");
  });
});

describe("Rule Engine Handler", () => {
  it("should generate documentation for RabbitMQ operations", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "publishToQueue",
      filePath: "src/queue/publisher.ts",
      lineNumber: 25,
      signature: {
        name: "publishToQueue",
        parameters: [
          { name: "message", type: "any", optional: false },
          { name: "queueName", type: "string", optional: false },
        ],
        isAsync: true,
        returnType: "Promise<void>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateRuleEngineDoc(element);

    expect(jsdoc.description).toContain("RabbitMQ");
    expect(jsdoc.tags?.messaging).toBe("rabbitmq");
    expect(jsdoc.throws).toBeDefined();
  });

  it("should generate documentation for webhook handlers", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "handleWebhookEvent",
      filePath: "src/webhooks/handler.ts",
      lineNumber: 40,
      signature: {
        name: "handleWebhookEvent",
        parameters: [
          { name: "req", type: "Request", optional: false },
          { name: "res", type: "Response", optional: false },
        ],
        isAsync: true,
        returnType: "Promise<void>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateRuleEngineDoc(element);

    expect(jsdoc.description).toContain("Webhook");
    expect(jsdoc.tags?.integration).toBe("webhook");
  });

  it("should generate documentation for retry logic", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "retryWithBackoff",
      filePath: "src/utils/retry.ts",
      lineNumber: 10,
      signature: {
        name: "retryWithBackoff",
        parameters: [
          { name: "fn", type: "Function", optional: false },
          { name: "maxAttempts", type: "number", optional: false },
        ],
        isAsync: true,
        returnType: "Promise<any>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateRuleEngineDoc(element);

    expect(jsdoc.description).toContain("Retry");
    expect(jsdoc.description).toContain("backoff");
    expect(jsdoc.tags?.pattern).toBe("retry");
  });

  it("should generate documentation for payload validation", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "validateWebhookPayload",
      filePath: "src/validation/payload.ts",
      lineNumber: 20,
      signature: {
        name: "validateWebhookPayload",
        parameters: [{ name: "payload", type: "any", optional: false }],
        isAsync: false,
        returnType: "ValidationResult",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateRuleEngineDoc(element);

    expect(jsdoc.description).toContain("payload");
    expect(jsdoc.description).toContain("validation");
    expect(jsdoc.tags?.validation).toBe("schema");
  });
});

describe("Frontend Handler", () => {
  it("should generate documentation for React components", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "UserProfile",
      filePath: "src/components/UserProfile.tsx",
      lineNumber: 15,
      signature: {
        name: "UserProfile",
        parameters: [
          { name: "props", type: "UserProfileProps", optional: false },
        ],
        isAsync: false,
        returnType: "JSX.Element",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateFrontendDoc(element);

    expect(jsdoc.description).toContain("React component");
    expect(jsdoc.returns?.type).toBe("JSX.Element");
    expect(jsdoc.tags?.component).toBe("react");
    expect(jsdoc.example).toBeDefined();
  });

  it("should generate documentation for custom hooks", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "useAuth",
      filePath: "src/hooks/useAuth.ts",
      lineNumber: 8,
      signature: {
        name: "useAuth",
        parameters: [],
        isAsync: false,
        returnType: "AuthState",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateFrontendDoc(element);

    expect(jsdoc.description).toContain("Custom React hook");
    expect(jsdoc.tags?.hook).toBe("custom");
  });

  it("should generate documentation for state management", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "userReducer",
      filePath: "src/store/userReducer.ts",
      lineNumber: 20,
      signature: {
        name: "userReducer",
        parameters: [
          { name: "state", type: "UserState", optional: false },
          { name: "action", type: "Action", optional: false },
        ],
        isAsync: false,
        returnType: "UserState",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateFrontendDoc(element);

    expect(jsdoc.description).toContain("State management");
    expect(jsdoc.tags?.state).toBe("management");
  });

  it("should generate documentation for API clients", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "fetchUserData",
      filePath: "src/api/users.ts",
      lineNumber: 30,
      signature: {
        name: "fetchUserData",
        parameters: [{ name: "userId", type: "string", optional: false }],
        isAsync: true,
        returnType: "Promise<User>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateFrontendDoc(element);

    expect(jsdoc.description).toContain("API client");
    expect(jsdoc.tags?.api).toBe("client");
    expect(jsdoc.throws).toBeDefined();
  });

  it("should generate documentation for routing", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "AppRouter",
      filePath: "src/routing/AppRouter.tsx",
      lineNumber: 10,
      signature: {
        name: "AppRouter",
        parameters: [],
        isAsync: false,
        returnType: "JSX.Element",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateFrontendDoc(element);

    expect(jsdoc.description).toContain("routing");
    expect(jsdoc.tags?.routing).toBeDefined();
  });
});

describe("Extension Handler", () => {
  it("should generate documentation for Chrome API usage", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "chromeStorageGet",
      filePath: "src/utils/storage.ts",
      lineNumber: 5,
      signature: {
        name: "chromeStorageGet",
        parameters: [{ name: "key", type: "string", optional: false }],
        isAsync: true,
        returnType: "Promise<any>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateExtensionDoc(element);

    expect(jsdoc.description).toContain("Chrome Extension API");
    expect(jsdoc.tags?.api).toBe("chrome-extension");
  });

  it("should generate documentation for content scripts", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "injectContentScript",
      filePath: "src/content/inject.ts",
      lineNumber: 15,
      signature: {
        name: "injectContentScript",
        parameters: [],
        isAsync: false,
        returnType: "void",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateExtensionDoc(element);

    expect(jsdoc.description).toContain("Content script");
    expect(jsdoc.tags?.script).toBe("content");
    expect(jsdoc.example).toBeDefined();
  });

  it("should generate documentation for message passing", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "sendMessageToBackground",
      filePath: "src/messaging/sender.ts",
      lineNumber: 20,
      signature: {
        name: "sendMessageToBackground",
        parameters: [{ name: "message", type: "any", optional: false }],
        isAsync: true,
        returnType: "Promise<any>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateExtensionDoc(element);

    expect(jsdoc.description).toContain("Message passing");
    expect(jsdoc.tags?.pattern).toBe("message-passing");
    expect(jsdoc.example).toBeDefined();
  });

  it("should generate documentation for authentication sync", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "syncAuthToken",
      filePath: "src/auth/sync.ts",
      lineNumber: 30,
      signature: {
        name: "syncAuthToken",
        parameters: [{ name: "token", type: "string", optional: false }],
        isAsync: true,
        returnType: "Promise<void>",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateExtensionDoc(element);

    expect(jsdoc.description).toContain("Authentication synchronization");
    expect(jsdoc.tags?.auth).toBe("sync");
  });

  it("should generate documentation for background scripts", () => {
    const element: CodeElement = {
      type: CodeElementType.FUNCTION,
      name: "backgroundServiceWorker",
      filePath: "src/background/worker.ts",
      lineNumber: 10,
      signature: {
        name: "backgroundServiceWorker",
        parameters: [],
        isAsync: false,
        returnType: "void",
      },
      context: { imports: [], exports: [] },
    };

    const jsdoc = generateExtensionDoc(element);

    expect(jsdoc.description).toContain("Background script");
    expect(jsdoc.tags?.script).toBe("background");
  });
});
