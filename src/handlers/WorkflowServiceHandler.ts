/**
 * Workflow Service Handler
 * 
 * Specialized documentation handler for Workflow Service.
 * Handles Prisma models, business logic, compliance rules, PDF generation, and audit logging.
 */

import { CodeElement, JSDoc, ParamDoc, ThrowsDoc } from '../types';

/**
 * Generates specialized documentation for Workflow Service components
 * 
 * @param element - Code element to document
 * @returns JSDoc with Workflow Service-specific documentation
 */
export function generateWorkflowServiceDoc(element: CodeElement): JSDoc {
  // Check if this is a Prisma model operation
  if (isPrismaOperation(element)) {
    return generatePrismaOperationDoc(element);
  }
  
  // Check if this is business logic
  if (isBusinessLogic(element)) {
    return generateBusinessLogicDoc(element);
  }
  
  // Check if this is PDF generation
  if (isPDFGeneration(element)) {
    return generatePDFGenerationDoc(element);
  }
  
  // Check if this is audit logging
  if (isAuditLogging(element)) {
    return generateAuditLoggingDoc(element);
  }
  
  // Check if this is compliance validation
  if (isComplianceValidation(element)) {
    return generateComplianceDoc(element);
  }
  
  // Default documentation
  return generateDefaultDoc(element);
}

/**
 * Checks if the code element is a Prisma operation
 * 
 * @param element - Code element to check
 * @returns True if element is a Prisma operation
 */
function isPrismaOperation(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('prisma') || 
         name.includes('create') || 
         name.includes('update') ||
         name.includes('delete') ||
         name.includes('find') ||
         name.includes('query');
}

/**
 * Checks if the code element is business logic
 * 
 * @param element - Code element to check
 * @returns True if element is business logic
 */
function isBusinessLogic(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('workflow') || 
         name.includes('process') ||
         name.includes('validate') ||
         name.includes('calculate') ||
         name.includes('rule');
}

/**
 * Checks if the code element is PDF generation
 * 
 * @param element - Code element to check
 * @returns True if element is PDF generation
 */
function isPDFGeneration(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('pdf') || 
         name.includes('generate') ||
         name.includes('document') ||
         name.includes('report');
}

/**
 * Checks if the code element is audit logging
 * 
 * @param element - Code element to check
 * @returns True if element is audit logging
 */
function isAuditLogging(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('audit') || 
         name.includes('log') ||
         name.includes('track') ||
         name.includes('history');
}

/**
 * Checks if the code element is compliance validation
 * 
 * @param element - Code element to check
 * @returns True if element is compliance validation
 */
function isComplianceValidation(element: CodeElement): boolean {
  const name = element.name.toLowerCase();
  return name.includes('compliance') || 
         name.includes('regulation') ||
         name.includes('policy') ||
         name.includes('requirement');
}

/**
 * Generates documentation for Prisma database operations
 * 
 * @param element - Prisma operation element
 * @returns JSDoc for Prisma operation
 */
function generatePrismaOperationDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - Data for database operation`,
    optional: p.optional
  })) || [];
  
  const throws: ThrowsDoc[] = [
    {
      type: 'PrismaClientKnownRequestError',
      condition: 'When database constraint is violated (unique, foreign key, etc.)'
    },
    {
      type: 'PrismaClientValidationError',
      condition: 'When provided data does not match schema'
    }
  ];
  
  return {
    description: `Database operation using Prisma ORM. Performs data persistence with type safety and automatic migrations. Handles relationships and ensures data integrity.`,
    params,
    returns: {
      type: element.signature?.returnType || 'Promise<any>',
      description: 'Database operation result with typed model data'
    },
    throws,
    tags: {
      database: 'prisma',
      transaction: 'atomic'
    }
  };
}

/**
 * Generates documentation for business logic functions
 * 
 * @param element - Business logic element
 * @returns JSDoc for business logic
 */
function generateBusinessLogicDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - Input for business logic processing`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Business logic implementation for workflow processing. Enforces business rules, validates data against domain requirements, and orchestrates multi-step processes. Critical for maintaining data consistency and business compliance.`,
    params,
    returns: {
      type: element.signature?.returnType || 'any',
      description: 'Processed result after applying business rules'
    },
    throws: [
      {
        type: 'ValidationError',
        condition: 'When business rule validation fails'
      },
      {
        type: 'BusinessLogicError',
        condition: 'When business constraint is violated'
      }
    ],
    tags: {
      domain: 'business-logic',
      critical: 'true'
    }
  };
}

/**
 * Generates documentation for PDF generation functions
 * 
 * @param element - PDF generation element
 * @returns JSDoc for PDF generation
 */
function generatePDFGenerationDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - Data to include in generated PDF`,
    optional: p.optional
  })) || [];
  
  return {
    description: `PDF document generation function. Creates formatted PDF documents from workflow data. Handles templates, styling, and data formatting for professional document output.`,
    params,
    returns: {
      type: 'Promise<Buffer>',
      description: 'Generated PDF as binary buffer'
    },
    throws: [
      {
        type: 'PDFGenerationError',
        condition: 'When PDF generation fails due to invalid data or template issues'
      }
    ],
    tags: {
      output: 'pdf',
      format: 'document'
    }
  };
}

/**
 * Generates documentation for audit logging functions
 * 
 * @param element - Audit logging element
 * @returns JSDoc for audit logging
 */
function generateAuditLoggingDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - Information to log for audit trail`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Audit logging function that records user actions and system events for compliance and security tracking. Creates immutable audit trail with timestamps, user information, and action details. Essential for regulatory compliance and security investigations.`,
    params,
    returns: {
      type: 'Promise<void>',
      description: 'Audit log entry created successfully'
    },
    tags: {
      compliance: 'audit',
      security: 'logging',
      immutable: 'true'
    }
  };
}

/**
 * Generates documentation for compliance validation functions
 * 
 * @param element - Compliance validation element
 * @returns JSDoc for compliance validation
 */
function generateComplianceDoc(element: CodeElement): JSDoc {
  const params: ParamDoc[] = element.signature?.parameters.map(p => ({
    name: p.name,
    type: p.type || 'any',
    description: `${p.name} - Data to validate against compliance rules`,
    optional: p.optional
  })) || [];
  
  return {
    description: `Compliance validation function that ensures data and operations meet regulatory requirements. Validates against industry standards, legal requirements, and internal policies. Critical for maintaining regulatory compliance and avoiding penalties.`,
    params,
    returns: {
      type: element.signature?.returnType || 'ValidationResult',
      description: 'Validation result indicating compliance status and any violations'
    },
    throws: [
      {
        type: 'ComplianceViolationError',
        condition: 'When data violates mandatory compliance rules'
      }
    ],
    tags: {
      compliance: 'validation',
      regulatory: 'required',
      critical: 'true'
    }
  };
}

/**
 * Generates default documentation for Workflow Service components
 * 
 * @param element - Code element
 * @returns Basic JSDoc
 */
function generateDefaultDoc(element: CodeElement): JSDoc {
  return {
    description: `Workflow Service component: ${element.name}. Handles workflow processing, data management, and business logic execution.`,
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
