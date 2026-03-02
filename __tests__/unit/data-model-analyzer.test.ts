/**
 * Unit tests for DataModelAnalyzer
 * 
 * Tests the extraction of data model information from TypeScript interfaces,
 * type aliases, and class declarations.
 */

import * as parser from '@babel/parser';
import { DataModelAnalyzer } from '../../src/analyzers/DataModelAnalyzer';
import { DataModelType } from '../../src/types';

describe('DataModelAnalyzer', () => {
  let analyzer: DataModelAnalyzer;

  beforeEach(() => {
    analyzer = new DataModelAnalyzer();
  });

  describe('findDataModel', () => {
    it('should return null for non-data-model nodes', () => {
      const code = `function test() { return 42; }`;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).toBeNull();
    });

    it('should extract TypeScript interface with basic fields', () => {
      const code = `
        interface User {
          id: number;
          name: string;
          email: string;
          isActive: boolean;
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('User');
      expect(result?.type).toBe(DataModelType.INTERFACE);
      expect(result?.fields).toHaveLength(4);
      expect(result?.fields[0]).toEqual({
        name: 'id',
        type: 'number',
        optional: false
      });
      expect(result?.fields[1]).toEqual({
        name: 'name',
        type: 'string',
        optional: false
      });
      expect(result?.fields[2]).toEqual({
        name: 'email',
        type: 'string',
        optional: false
      });
      expect(result?.fields[3]).toEqual({
        name: 'isActive',
        type: 'boolean',
        optional: false
      });
    });

    it('should detect optional fields in interfaces', () => {
      const code = `
        interface Product {
          id: number;
          name: string;
          description?: string;
          price?: number;
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.fields).toHaveLength(4);
      expect(result?.fields[0].optional).toBe(false);
      expect(result?.fields[1].optional).toBe(false);
      expect(result?.fields[2].optional).toBe(true);
      expect(result?.fields[3].optional).toBe(true);
    });

    it('should extract TypeScript type alias with object type', () => {
      const code = `
        type Address = {
          street: string;
          city: string;
          zipCode: string;
          country: string;
        };
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Address');
      expect(result?.type).toBe(DataModelType.TYPE);
      expect(result?.fields).toHaveLength(4);
      expect(result?.fields[0].name).toBe('street');
      expect(result?.fields[0].type).toBe('string');
    });

    it('should return null for type alias with non-object type', () => {
      const code = `type ID = string | number;`;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).toBeNull();
    });

    it('should extract class declaration with properties', () => {
      const code = `
        class Customer {
          id: number;
          name: string;
          email: string;
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Customer');
      expect(result?.type).toBe(DataModelType.CLASS);
      expect(result?.fields).toHaveLength(3);
      expect(result?.fields[0].name).toBe('id');
      expect(result?.fields[1].name).toBe('name');
      expect(result?.fields[2].name).toBe('email');
    });

    it('should return null for class without properties', () => {
      const code = `
        class Service {
          constructor() {}
          doSomething() { return 42; }
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).toBeNull();
    });

    it('should handle complex types in fields', () => {
      const code = `
        interface Order {
          id: number;
          items: string[];
          customer: Customer;
          status: 'pending' | 'completed' | 'cancelled';
          metadata: object;
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.fields).toHaveLength(5);
      expect(result?.fields[1].type).toBe('string[]');
      expect(result?.fields[2].type).toBe('Customer');
      expect(result?.fields[3].type).toBe('"pending" | "completed" | "cancelled"');
      expect(result?.fields[4].type).toBe('object');
    });

    it('should handle exported interfaces', () => {
      const code = `
        export interface Config {
          apiKey: string;
          timeout: number;
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Config');
      expect(result?.type).toBe(DataModelType.INTERFACE);
      expect(result?.fields).toHaveLength(2);
    });

    it('should handle exported type aliases', () => {
      const code = `
        export type Settings = {
          theme: string;
          language: string;
        };
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Settings');
      expect(result?.type).toBe(DataModelType.TYPE);
    });

    it('should handle exported classes', () => {
      const code = `
        export class Entity {
          id: string;
          createdAt: Date;
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Entity');
      expect(result?.type).toBe(DataModelType.CLASS);
    });

    it('should handle fields with any type when no annotation', () => {
      const code = `
        interface Data {
          value;
        }
      `;
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript']
      });

      const node = ast.program.body[0];
      const result = analyzer.findDataModel(node);

      expect(result).not.toBeNull();
      expect(result?.fields[0].type).toBe('any');
    });
  });

  describe('parsePrismaSchema', () => {
    it('should parse a simple Prisma model with scalar fields', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
model User {
  id    Int     @id @default(autoincrement())
  name  String
  email String  @unique
}
      `;
      
      // Create a temporary file for testing
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(1);
        expect(models[0].name).toBe('User');
        expect(models[0].type).toBe(DataModelType.PRISMA);
        expect(models[0].fields).toHaveLength(3);
        
        expect(models[0].fields[0]).toEqual({
          name: 'id',
          type: 'Int',
          optional: false
        });
        
        expect(models[0].fields[1]).toEqual({
          name: 'name',
          type: 'String',
          optional: false
        });
        
        expect(models[0].fields[2]).toEqual({
          name: 'email',
          type: 'String',
          optional: false
        });
        
        // Check validations
        expect(models[0].validations).toBeDefined();
        expect(models[0].validations?.length).toBeGreaterThan(0);
        
        // Check for @id validation
        const idValidation = models[0].validations?.find(v => v.field === 'id' && v.rule === 'id');
        expect(idValidation).toBeDefined();
        
        // Check for @unique validation
        const uniqueValidation = models[0].validations?.find(v => v.field === 'email' && v.rule === 'unique');
        expect(uniqueValidation).toBeDefined();
        
        // Check for @default validation
        const defaultValidation = models[0].validations?.find(v => v.field === 'id' && v.rule === 'default');
        expect(defaultValidation).toBeDefined();
      } finally {
        // Clean up
        fs.unlinkSync(tmpFile);
      }
    });

    it('should parse optional fields in Prisma models', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
model Profile {
  id        Int      @id @default(autoincrement())
  bio       String?
  avatar    String?
  userId    Int
}
      `;
      
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema2.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(1);
        expect(models[0].fields).toHaveLength(4);
        
        expect(models[0].fields[0].optional).toBe(false); // id
        expect(models[0].fields[1].optional).toBe(true);  // bio
        expect(models[0].fields[2].optional).toBe(true);  // avatar
        expect(models[0].fields[3].optional).toBe(false); // userId
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });

    it('should parse array fields (one-to-many relationships)', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
model User {
  id    Int     @id @default(autoincrement())
  posts Post[]
}
      `;
      
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema3.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(1);
        expect(models[0].fields).toHaveLength(2);
        
        expect(models[0].fields[1].name).toBe('posts');
        expect(models[0].fields[1].type).toBe('Post[]');
        expect(models[0].fields[1].optional).toBe(false);
        
        // Check relationships
        expect(models[0].relationships).toBeDefined();
        expect(models[0].relationships?.length).toBe(1);
        expect(models[0].relationships?.[0].type).toBe('one-to-many');
        expect(models[0].relationships?.[0].target).toBe('Post');
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });

    it('should parse explicit relationships with @relation', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}
      `;
      
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema4.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(1);
        expect(models[0].fields).toHaveLength(4);
        
        // Check relationships
        expect(models[0].relationships).toBeDefined();
        expect(models[0].relationships?.length).toBe(1);
        expect(models[0].relationships?.[0].type).toBe('one-to-one');
        expect(models[0].relationships?.[0].target).toBe('User');
        expect(models[0].relationships?.[0].foreignKey).toBe('authorId');
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });

    it('should parse multiple models in a schema', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}

model Comment {
  id      Int    @id @default(autoincrement())
  content String
  postId  Int
}
      `;
      
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema5.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(3);
        expect(models[0].name).toBe('User');
        expect(models[1].name).toBe('Post');
        expect(models[2].name).toBe('Comment');
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });

    it('should handle one-to-one relationships with optional fields', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}
      `;
      
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema6.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(1);
        expect(models[0].fields[1].optional).toBe(true);
        
        // Check relationships
        expect(models[0].relationships).toBeDefined();
        expect(models[0].relationships?.[0].type).toBe('one-to-one');
        expect(models[0].relationships?.[0].target).toBe('Profile');
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });

    it('should handle all Prisma scalar types', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
model AllTypes {
  id        Int      @id
  name      String
  active    Boolean
  count     BigInt
  price     Float
  amount    Decimal
  createdAt DateTime
  metadata  Json
  data      Bytes
}
      `;
      
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema7.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(1);
        expect(models[0].fields).toHaveLength(9);
        
        // All fields should be scalar (no relationships)
        expect(models[0].relationships).toBeUndefined();
        
        // Verify types
        expect(models[0].fields[0].type).toBe('Int');
        expect(models[0].fields[1].type).toBe('String');
        expect(models[0].fields[2].type).toBe('Boolean');
        expect(models[0].fields[3].type).toBe('BigInt');
        expect(models[0].fields[4].type).toBe('Float');
        expect(models[0].fields[5].type).toBe('Decimal');
        expect(models[0].fields[6].type).toBe('DateTime');
        expect(models[0].fields[7].type).toBe('Json');
        expect(models[0].fields[8].type).toBe('Bytes');
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });

    it('should return empty array for non-existent file', () => {
      const analyzer = new DataModelAnalyzer();
      const models = analyzer.parsePrismaSchema('/non/existent/file.prisma');
      
      expect(models).toEqual([]);
    });

    it('should handle schema with comments', () => {
      const analyzer = new DataModelAnalyzer();
      const schemaContent = `
// User model
model User {
  // Primary key
  id    Int     @id @default(autoincrement())
  // User email
  email String  @unique
  
  // Relationships
  posts Post[]
}
      `;
      
      const fs = require('fs');
      const path = require('path');
      const tmpFile = path.join(__dirname, 'test-schema8.prisma');
      fs.writeFileSync(tmpFile, schemaContent);
      
      try {
        const models = analyzer.parsePrismaSchema(tmpFile);
        
        expect(models).toHaveLength(1);
        expect(models[0].fields).toHaveLength(3);
      } finally {
        fs.unlinkSync(tmpFile);
      }
    });
  });
});
