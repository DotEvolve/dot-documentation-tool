/**
 * DataModelAnalyzer - Identifies and extracts data model information
 *
 * Detects TypeScript interfaces, type aliases, and class declarations
 * that represent data structures. Extracts field information including
 * names, types, and optional flags.
 */

import * as fs from "fs";
import {
  DataModel,
  DataModelType,
  ModelField,
  Relationship,
  RelationshipType,
  Validation,
} from "../types";

/**
 * Analyzer for extracting data model information from AST nodes
 */
export class DataModelAnalyzer {
  /**
   * Identifies and extracts data model information from an AST node
   *
   * Detects:
   * - TypeScript interfaces
   * - TypeScript type aliases
   * - Class declarations with properties
   *
   * @param node - AST node to analyze
   * @returns DataModel object if node represents a data model, null otherwise
   */
  findDataModel(node: any): DataModel | null {
    // Check for TypeScript interface
    if (node.type === "TSInterfaceDeclaration") {
      return this.extractInterfaceModel(node);
    }

    // Check for TypeScript type alias
    if (node.type === "TSTypeAliasDeclaration") {
      return this.extractTypeAliasModel(node);
    }

    // Check for class declaration with properties
    if (node.type === "ClassDeclaration") {
      return this.extractClassModel(node);
    }

    // Check for exported interface
    if (node.type === "ExportNamedDeclaration" && node.declaration) {
      if (node.declaration.type === "TSInterfaceDeclaration") {
        return this.extractInterfaceModel(node.declaration);
      }
      if (node.declaration.type === "TSTypeAliasDeclaration") {
        return this.extractTypeAliasModel(node.declaration);
      }
      if (node.declaration.type === "ClassDeclaration") {
        return this.extractClassModel(node.declaration);
      }
    }

    return null;
  }

  /**
   * Extracts data model information from a TypeScript interface
   *
   * @param node - TSInterfaceDeclaration AST node
   * @returns DataModel object representing the interface
   */
  private extractInterfaceModel(node: any): DataModel | null {
    if (!node.id || !node.id.name) {
      return null;
    }

    const name = node.id.name;
    const fields: ModelField[] = [];

    // Extract fields from interface body
    if (node.body && node.body.body) {
      for (const member of node.body.body) {
        if (member.type === "TSPropertySignature") {
          const field = this.extractPropertyField(member);
          if (field) {
            fields.push(field);
          }
        }
      }
    }

    return {
      name,
      type: DataModelType.INTERFACE,
      fields,
    };
  }

  /**
   * Extracts data model information from a TypeScript type alias
   *
   * @param node - TSTypeAliasDeclaration AST node
   * @returns DataModel object representing the type alias, or null if not an object type
   */
  private extractTypeAliasModel(node: any): DataModel | null {
    if (!node.id || !node.id.name) {
      return null;
    }

    const name = node.id.name;
    const fields: ModelField[] = [];

    // Only process type aliases that define object types
    if (node.typeAnnotation && node.typeAnnotation.type === "TSTypeLiteral") {
      if (node.typeAnnotation.members) {
        for (const member of node.typeAnnotation.members) {
          if (member.type === "TSPropertySignature") {
            const field = this.extractPropertyField(member);
            if (field) {
              fields.push(field);
            }
          }
        }
      }

      return {
        name,
        type: DataModelType.TYPE,
        fields,
      };
    }

    return null;
  }

  /**
   * Extracts data model information from a class declaration
   *
   * @param node - ClassDeclaration AST node
   * @returns DataModel object representing the class, or null if no properties found
   */
  private extractClassModel(node: any): DataModel | null {
    if (!node.id || !node.id.name) {
      return null;
    }

    const name = node.id.name;
    const fields: ModelField[] = [];

    // Extract properties from class body
    if (node.body && node.body.body) {
      for (const member of node.body.body) {
        if (member.type === "ClassProperty") {
          const field = this.extractClassPropertyField(member);
          if (field) {
            fields.push(field);
          }
        }
      }
    }

    // Only return a data model if the class has properties
    if (fields.length > 0) {
      return {
        name,
        type: DataModelType.CLASS,
        fields,
      };
    }

    return null;
  }

  /**
   * Extracts field information from a TypeScript property signature
   *
   * @param member - TSPropertySignature AST node
   * @returns ModelField object or null if extraction fails
   */
  private extractPropertyField(member: any): ModelField | null {
    if (!member.key) {
      return null;
    }

    // Extract field name
    let name = "unknown";
    if (member.key.type === "Identifier") {
      name = member.key.name;
    } else if (member.key.type === "StringLiteral") {
      name = member.key.value;
    }

    // Check if field is optional
    const optional = member.optional === true;

    // Extract type annotation
    let type = "any";
    if (member.typeAnnotation) {
      type = this.extractTypeAnnotation(member.typeAnnotation);
    }

    return {
      name,
      type,
      optional,
    };
  }

  /**
   * Extracts field information from a class property
   *
   * @param member - ClassProperty AST node
   * @returns ModelField object or null if extraction fails
   */
  private extractClassPropertyField(member: any): ModelField | null {
    if (!member.key) {
      return null;
    }

    // Extract field name
    let name = "unknown";
    if (member.key.type === "Identifier") {
      name = member.key.name;
    } else if (member.key.type === "StringLiteral") {
      name = member.key.value;
    }

    // Check if field is optional
    const optional = member.optional === true;

    // Extract type annotation
    let type = "any";
    if (member.typeAnnotation) {
      type = this.extractTypeAnnotation(member.typeAnnotation);
    }

    // Check if this is a computed property (getter)
    const computed = member.computed === true;

    return {
      name,
      type,
      optional,
      computed,
    };
  }

  /**
   * Extracts type information from a TypeScript type annotation node
   *
   * @param typeAnnotation - AST node representing a type annotation
   * @returns String representation of the type
   */
  private extractTypeAnnotation(typeAnnotation: any): string {
    if (!typeAnnotation) {
      return "any";
    }

    // Handle TSTypeAnnotation wrapper
    const typeNode = typeAnnotation.typeAnnotation || typeAnnotation;

    switch (typeNode.type) {
      case "TSStringKeyword":
        return "string";
      case "TSNumberKeyword":
        return "number";
      case "TSBooleanKeyword":
        return "boolean";
      case "TSAnyKeyword":
        return "any";
      case "TSVoidKeyword":
        return "void";
      case "TSNullKeyword":
        return "null";
      case "TSUndefinedKeyword":
        return "undefined";
      case "TSUnknownKeyword":
        return "unknown";
      case "TSNeverKeyword":
        return "never";
      case "TSObjectKeyword":
        return "object";
      case "TSArrayType":
        return `${this.extractTypeAnnotation(typeNode.elementType)}[]`;
      case "TSTypeReference":
        if (typeNode.typeName) {
          // Handle simple type references
          if (typeNode.typeName.type === "Identifier") {
            return typeNode.typeName.name;
          }
          // Handle qualified names (e.g., Namespace.Type)
          if (typeNode.typeName.type === "TSQualifiedName") {
            return this.extractQualifiedName(typeNode.typeName);
          }
        }
        return "unknown";
      case "TSUnionType":
        if (typeNode.types) {
          return typeNode.types
            .map((t: any) => this.extractTypeAnnotation(t))
            .join(" | ");
        }
        return "unknown";
      case "TSIntersectionType":
        if (typeNode.types) {
          return typeNode.types
            .map((t: any) => this.extractTypeAnnotation(t))
            .join(" & ");
        }
        return "unknown";
      case "TSFunctionType":
        return "Function";
      case "TSTypeLiteral":
        return "object";
      case "TSLiteralType":
        // Handle literal types (e.g., "literal" | 123 | true)
        if (typeNode.literal) {
          return this.extractLiteralType(typeNode.literal);
        }
        return "unknown";
      default:
        return "any";
    }
  }

  /**
   * Extracts a qualified type name (e.g., Namespace.Type)
   *
   * @param node - TSQualifiedName AST node
   * @returns String representation of the qualified name
   */
  private extractQualifiedName(node: any): string {
    const parts: string[] = [];
    let current = node;

    while (current) {
      if (current.type === "TSQualifiedName") {
        if (current.right && current.right.name) {
          parts.unshift(current.right.name);
        }
        current = current.left;
      } else if (current.type === "Identifier") {
        parts.unshift(current.name);
        break;
      } else {
        break;
      }
    }

    return parts.join(".");
  }

  /**
   * Extracts a literal type value
   *
   * @param node - Literal AST node
   * @returns String representation of the literal
   */
  private extractLiteralType(node: any): string {
    switch (node.type) {
      case "StringLiteral":
        return `"${node.value}"`;
      case "NumericLiteral":
        return String(node.value);
      case "BooleanLiteral":
        return String(node.value);
      case "NullLiteral":
        return "null";
      default:
        return "unknown";
    }
  }

  /**
   * Parses a Prisma schema file and extracts data model definitions
   *
   * Prisma schemas use a custom DSL with the following structure:
   * ```
   * model ModelName {
   *   id        Int      @id @default(autoincrement())
   *   name      String
   *   email     String   @unique
   *   posts     Post[]
   *   profile   Profile?
   * }
   * ```
   *
   * @param filePath - Path to the .prisma schema file
   * @returns Array of DataModel objects representing Prisma models
   */
  parsePrismaSchema(filePath: string): DataModel[] {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return this.parsePrismaSchemaContent(content);
    } catch (error) {
      console.error(`Error reading Prisma schema file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Parses Prisma schema content and extracts data models
   *
   * @param content - Prisma schema file content
   * @returns Array of DataModel objects
   */
  private parsePrismaSchemaContent(content: string): DataModel[] {
    const models: DataModel[] = [];

    // Regular expression to match model blocks
    // Matches: model ModelName { ... }
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;

    let match;
    while ((match = modelRegex.exec(content)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];

      const model = this.parsePrismaModel(modelName, modelBody);
      if (model) {
        models.push(model);
      }
    }

    return models;
  }

  /**
   * Parses a single Prisma model definition
   *
   * @param name - Model name
   * @param body - Model body content (fields and attributes)
   * @returns DataModel object or null if parsing fails
   */
  private parsePrismaModel(name: string, body: string): DataModel | null {
    const fields: ModelField[] = [];
    const relationships: Relationship[] = [];
    const validations: Validation[] = [];

    // Split body into lines and process each field
    const lines = body
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith("//") || line.startsWith("@@")) {
        continue;
      }

      const fieldInfo = this.parsePrismaField(line);
      if (fieldInfo) {
        fields.push(fieldInfo.field);

        if (fieldInfo.relationship) {
          relationships.push(fieldInfo.relationship);
        }

        if (fieldInfo.validations) {
          validations.push(...fieldInfo.validations);
        }
      }
    }

    return {
      name,
      type: DataModelType.PRISMA,
      fields,
      relationships: relationships.length > 0 ? relationships : undefined,
      validations: validations.length > 0 ? validations : undefined,
    };
  }

  /**
   * Parses a single Prisma field definition
   *
   * Field format: fieldName fieldType modifiers @attributes
   * Examples:
   * - id Int @id @default(autoincrement())
   * - name String
   * - email String @unique
   * - posts Post[]
   * - profile Profile?
   * - userId Int
   * - user User @relation(fields: [userId], references: [id])
   *
   * @param line - Field definition line
   * @returns Object containing field, relationship, and validation info, or null if parsing fails
   */
  private parsePrismaField(line: string): {
    field: ModelField;
    relationship?: Relationship;
    validations?: Validation[];
  } | null {
    // Match field pattern: fieldName fieldType modifiers @attributes
    const fieldMatch = line.match(/^(\w+)\s+(\w+(\[\]|\?)?)\s*(.*)?$/);

    if (!fieldMatch) {
      return null;
    }

    const fieldName = fieldMatch[1];
    const fieldTypeRaw = fieldMatch[2];
    const attributes = fieldMatch[4] || "";

    // Determine if field is optional or array
    const isArray = fieldTypeRaw.endsWith("[]");
    const isOptional = fieldTypeRaw.endsWith("?");
    const baseType = fieldTypeRaw.replace(/[\[\]\?]/g, "");

    // Determine field type (scalar vs relation)
    const isRelation = this.isPrismaRelationType(baseType);

    let fieldType = baseType;
    if (isArray) {
      fieldType = `${baseType}[]`;
    }

    const field: ModelField = {
      name: fieldName,
      type: fieldType,
      optional: isOptional,
    };

    // Parse validations from attributes
    const validations: Validation[] = [];

    if (attributes.includes("@unique")) {
      validations.push({
        field: fieldName,
        rule: "unique",
        message: `${fieldName} must be unique`,
      });
    }

    if (attributes.includes("@id")) {
      validations.push({
        field: fieldName,
        rule: "id",
        message: `${fieldName} is the primary key`,
      });
    }

    // Parse @default attribute
    const defaultMatch = attributes.match(/@default\(([^)]+)\)/);
    if (defaultMatch) {
      validations.push({
        field: fieldName,
        rule: "default",
        message: `Default value: ${defaultMatch[1]}`,
      });
    }

    // Parse relationship if this is a relation field
    let relationship: Relationship | undefined;

    if (isRelation) {
      // Check for @relation attribute to determine relationship details
      const relationMatch = attributes.match(/@relation\(([^)]+)\)/);

      if (relationMatch) {
        // Parse relation details: fields: [userId], references: [id]
        const relationDetails = relationMatch[1];
        const fieldsMatch = relationDetails.match(/fields:\s*\[([^\]]+)\]/);

        if (fieldsMatch) {
          const foreignKey = fieldsMatch[1].trim();

          // Determine relationship type
          let relationType: RelationshipType;
          if (isArray) {
            relationType = RelationshipType.ONE_TO_MANY;
          } else if (isOptional) {
            relationType = RelationshipType.ONE_TO_ONE;
          } else {
            relationType = RelationshipType.ONE_TO_ONE;
          }

          relationship = {
            type: relationType,
            target: baseType,
            foreignKey,
          };
        }
      } else {
        // Implicit relation (no @relation attribute)
        // Determine relationship type based on field modifiers
        let relationType: RelationshipType;
        if (isArray) {
          relationType = RelationshipType.ONE_TO_MANY;
        } else if (isOptional) {
          relationType = RelationshipType.ONE_TO_ONE;
        } else {
          relationType = RelationshipType.ONE_TO_ONE;
        }

        relationship = {
          type: relationType,
          target: baseType,
        };
      }
    }

    return {
      field,
      relationship,
      validations: validations.length > 0 ? validations : undefined,
    };
  }

  /**
   * Checks if a Prisma type is a relation type (references another model)
   *
   * Scalar types in Prisma: String, Boolean, Int, BigInt, Float, Decimal, DateTime, Json, Bytes
   * Any other type is considered a relation to another model
   *
   * @param type - Prisma field type
   * @returns True if the type is a relation, false if it's a scalar type
   */
  private isPrismaRelationType(type: string): boolean {
    const scalarTypes = [
      "String",
      "Boolean",
      "Int",
      "BigInt",
      "Float",
      "Decimal",
      "DateTime",
      "Json",
      "Bytes",
    ];

    return !scalarTypes.includes(type);
  }
}
