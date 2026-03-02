/**
 * Rule Engine Handler
 * 
 * Specialized documentation handler for Rule Engine Service.
 * Handles RabbitMQ integration, webhook payload validation, message queue patterns, and retry logic.
 */

import { CodeElement, JSDoc, ParamDoc, ThrowsDoc } from '../types';

/**
 * Generates specialized documentation for Rule Engine Service components
 * 
 * @param element - Code element to document
 * @returns JSDoc with Rule Engine-specific documentation
 */
export function generateRuleEngineDoc(element: CodeElement): JSDoc {
  // Check if this is RabbitMQ integration
  if (isRabbitMQOperation(element)) {
    return generateRabbitMQDoc(element);
  }
  
  // Check if this is webhook handling
  if (isWebhookHandler(element)) {
    return generateWebhookDoc(element);
  }
  
  // Check if this is message queue pattern
  if (isMessageQueuePattern(element)) {
    return generateMessageQueueDoc(element);
  }
  
  // Check if this is retry logic
  if (isRetryLogic(element)) {
    return generateRetryLogicDoc(element);
  }
  
  // Check if this is payload validation
  if (isPayloadValidation(element)) {
    return generatePayloadValidationDoc(element);
  }
  
  // Default documentation
  return generateDefaultDoc(element);
}

/**
 * Checks if the code element is a RabbitMQ operation
 * 
 * @param element - Code element to check
 * @returns True if element is a RabbitMQ operation
 */
function isRabbitMQOperation(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('rabbitmq') || 
         name.includes('amqp') || 
         name.includes('queue') ||
         name.includes('publish') ||
         name.includes('consume');
}

/**
 * Checks if the code element is a webhook handler
 * 
 * @param element - Code element to check
 * @returns True if element is a webhook handler
 */
function isWebhookHandler(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  // Don't match validation functions
  if (name.includes('validate') || name.includes('verify')) {
    return false;
  }
  return name.includes('webhook') || 
         name.includes('callback') ||
         name.includes('event');
}

/**
 * Checks if the code element is a message queue pattern
 * 
 * @param element - Code element to check
 * @returns True if element is a message queue pattern
 */
function isMessageQueuePattern(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('message') || 
         name.includes('producer') ||
         name.includes('consumer') ||
         name.includes('subscriber');
}

/**
 * Checks if the code element is retry logic
 * 
 * @param element - Code element to check
 * @returns True if element is retry logic
 */
function isRetryLogic(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('retry') || 
         name.includes('backoff') ||
         name.includes('attempt');
}

/**
 * Checks if the code element is payload validation
 * 
 * @param element - Code element to check
 * @returns True if element is payload validation
 */
function isPayloadValidation(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('validate') || 
         name.includes('payload') ||
         name.includes('schema') ||
         name.includes('verify');
}

/**
 * Generates documentation for RabbitMQ operations
 * 
 * @param element - RabbitMQ operation element
 * @returns JSDoc for RabbitMQ operation
 */
function generateRabbitMQDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - ${p.name.includes('message') ? 'Message data to publish/consume' : 'RabbitMQ operation parameter'}`,
    optional: p.optional
  })) || [];
  
  const throws: ThrowsDoc[] = [
    {
      type: 'AMQPConnectionError',
      condition: 'When connection to RabbitMQ server fails'
    },
    {
      type: 'AMQPChannelError',
      condition: 'When channel operation fails'
    },
    {
      type: 'MessagePublishError',
      condition: 'When message cannot be published to queue'
    }
  ];
  
  return {
    description: `RabbitMQ message queue operation. Handles asynchronous message publishing and consumption for reliable inter-service communication. Ensures message delivery with acknowledgments and dead-letter queues for failed messages.`,
    params,
    returns: {
      type: element.signature?.returnType || 'Promise<void>',
      description: 'Operation completes when message is published/consumed'
    },
    throws,
    tags: {
      messaging: 'rabbitmq',
      pattern: 'async',
      reliability: 'guaranteed-delivery'
    }
  };
}

/**
 * Generates documentation for webhook handlers
 * 
 * @param _element - Webhook handler element
 * @returns JSDoc for webhook handler
 */
function generateWebhookDoc(_element: CodeElement): JSDoc {
  const params: ParamDoc[] = [
    {
      name: 'req',
      type: 'express.Request',
      description: 'Webhook request containing event payload from external system'
    },
    {
      name: 'res',
      type: 'express.Response',
      description: 'Response to acknowledge webhook receipt'
    }
  ];
  
  return {
    description: `Webhook endpoint handler that receives and processes events from external ERP systems. Validates webhook signatures, parses payloads, and triggers appropriate business logic. Implements idempotency to handle duplicate webhook deliveries.`,
    params,
    returns: {
      type: 'Promise<void>',
      description: 'Sends 200 OK response after processing webhook'
    },
    throws: [
      {
        type: 'HTTP400',
        condition: 'When webhook payload is invalid or signature verification fails'
      },
      {
        type: 'HTTP500',
        condition: 'When webhook processing fails internally'
      }
    ],
    tags: {
      integration: 'webhook',
      external: 'erp-system',
      idempotent: 'true'
    }
  };
}

/**
 * Generates documentation for message queue patterns
 * 
 * @param element - Message queue pattern element
 * @returns JSDoc for message queue pattern
 */
function generateMessageQueueDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - Message queue operation parameter`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Message queue pattern implementation for asynchronous task processing. Decouples producers and consumers, enables load balancing, and provides fault tolerance. Messages are persisted until successfully processed.`,
    params,
    returns: {
      type: element.signature?.returnType || 'Promise<void>',
      description: 'Message queue operation result'
    },
    throws: [
      {
        type: 'QueueError',
        condition: 'When queue operation fails'
      }
    ],
    tags: {
      pattern: 'message-queue',
      async: 'true',
      scalable: 'true'
    }
  };
}

/**
 * Generates documentation for retry logic
 * 
 * @param element - Retry logic element
 * @returns JSDoc for retry logic
 */
function generateRetryLogicDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - ${p.name.includes('attempt') ? 'Current retry attempt number' : 'Retry operation parameter'}`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Retry logic with exponential backoff for handling transient failures. Automatically retries failed operations with increasing delays between attempts. Implements circuit breaker pattern to prevent cascading failures. Logs retry attempts for monitoring and debugging.`,
    params,
    returns: {
      type: element.signature?.returnType || 'Promise<any>',
      description: 'Result of successful operation after retries'
    },
    throws: [
      {
        type: 'MaxRetriesExceededError',
        condition: 'When all retry attempts are exhausted'
      },
      {
        type: 'CircuitBreakerOpenError',
        condition: 'When circuit breaker is open due to repeated failures'
      }
    ],
    tags: {
      pattern: 'retry',
      strategy: 'exponential-backoff',
      resilience: 'circuit-breaker'
    }
  };
}

/**
 * Generates documentation for payload validation
 * 
 * @param element - Payload validation element
 * @returns JSDoc for payload validation
 */
function generatePayloadValidationDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - ${p.name.includes('payload') ? 'Payload data to validate' : 'Validation parameter'}`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Webhook payload validation function that verifies incoming data structure, types, and business rules. Validates against JSON schemas, checks required fields, and ensures data integrity. Prevents processing of malformed or malicious payloads.`,
    params,
    returns: {
      type: element.signature?.returnType || 'ValidationResult',
      description: 'Validation result with errors if payload is invalid'
    },
    throws: [
      {
        type: 'ValidationError',
        condition: 'When payload fails schema validation'
      },
      {
        type: 'SecurityError',
        condition: 'When payload contains suspicious or malicious content'
      }
    ],
    tags: {
      validation: 'schema',
      security: 'input-validation',
      critical: 'true'
    }
  };
}

/**
 * Generates default documentation for Rule Engine components
 * 
 * @param element - Code element
 * @returns Basic JSDoc
 */
function generateDefaultDoc(element: CodeElement): JSDoc {
  return {
    description: `Rule Engine component: ${element.name}. Handles event processing, webhook integration, and message queue operations.`,
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
