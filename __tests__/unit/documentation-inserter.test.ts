import * as fs from 'fs';
import * as path from 'path';
import { DocumentationInserter } from '../../src/DocumentationInserter';
import { Documentation, CodeElementType } from '../../src/types';

describe('DocumentationInserter', () => {
  let inserter: DocumentationInserter;
  let tempDir: string;

  beforeEach(() => {
    inserter = new DocumentationInserter();
    tempDir = path.join(__dirname, 'temp-test-files');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  describe('insertDocumentation', () => {
    it('should insert documentation at correct line number', () => {
      const testFile = path.join(tempDir, 'test1.ts');
      const content = `function hello() {
  return 'world';
}`;
      fs.writeFileSync(testFile, content);

      const doc: Documentation = {
        element: {
          type: CodeElementType.FUNCTION,
          name: 'hello',
          filePath: testFile,
          lineNumber: 0,
          context: {}
        },
        jsdoc: {
          description: 'Says hello',
          returns: { type: 'string', description: 'Returns world' }
        },
        insertionPoint: { line: 0, column: 0 },
        formattedComment: '/**\n * Says hello\n * @returns {string} Returns world\n */'
      };

      inserter.insertDocumentation(testFile, [doc]);

      const result = fs.readFileSync(testFile, 'utf-8');
      expect(result).toContain('/**');
      expect(result).toContain('Says hello');
      expect(result).toContain('@returns {string} Returns world');
      expect(result).toContain('function hello()');
    });

    it('should preserve indentation when inserting', () => {
      const testFile = path.join(tempDir, 'test2.ts');
      const content = `class MyClass {
  method() {
    return true;
  }
}`;
      fs.writeFileSync(testFile, content);

      const doc: Documentation = {
        element: {
          type: CodeElementType.METHOD,
          name: 'method',
          filePath: testFile,
          lineNumber: 1,
          context: {}
        },
        jsdoc: {
          description: 'A method',
          returns: { type: 'boolean', description: 'Returns true' }
        },
        insertionPoint: { line: 1, column: 2 },
        formattedComment: '/**\n * A method\n * @returns {boolean} Returns true\n */'
      };

      inserter.insertDocumentation(testFile, [doc]);

      const result = fs.readFileSync(testFile, 'utf-8');
      const lines = result.split('\n');
      
      // Check that the comment is indented
      expect(lines[1]).toMatch(/^\s+\/\*\*/);
      expect(lines[2]).toMatch(/^\s+\*/);
    });

    it('should handle multiple documentation insertions', () => {
      const testFile = path.join(tempDir, 'test3.ts');
      const content = `function first() {
  return 1;
}

function second() {
  return 2;
}`;
      fs.writeFileSync(testFile, content);

      const docs: Documentation[] = [
        {
          element: {
            type: CodeElementType.FUNCTION,
            name: 'first',
            filePath: testFile,
            lineNumber: 0,
            context: {}
          },
          jsdoc: {
            description: 'First function',
            returns: { type: 'number', description: 'Returns 1' }
          },
          insertionPoint: { line: 0, column: 0 },
          formattedComment: '/**\n * First function\n */'
        },
        {
          element: {
            type: CodeElementType.FUNCTION,
            name: 'second',
            filePath: testFile,
            lineNumber: 4,
            context: {}
          },
          jsdoc: {
            description: 'Second function',
            returns: { type: 'number', description: 'Returns 2' }
          },
          insertionPoint: { line: 4, column: 0 },
          formattedComment: '/**\n * Second function\n */'
        }
      ];

      inserter.insertDocumentation(testFile, docs);

      const result = fs.readFileSync(testFile, 'utf-8');
      expect(result).toContain('First function');
      expect(result).toContain('Second function');
      expect(result).toContain('function first()');
      expect(result).toContain('function second()');
    });
  });

  describe('detectExistingDocs', () => {
    it('should detect existing JSDoc comments', () => {
      const testFile = path.join(tempDir, 'test4.ts');
      const content = `/**
 * Existing documentation
 * @returns {string} A value
 */
function existing() {
  return 'value';
}

function undocumented() {
  return 'other';
}`;
      fs.writeFileSync(testFile, content);

      const existingDocs = inserter.detectExistingDocs(testFile);

      expect(existingDocs).toHaveLength(1);
      expect(existingDocs[0].line).toBe(0);
      expect(existingDocs[0].content).toContain('Existing documentation');
      expect(existingDocs[0].elementName).toBe('existing');
    });

    it('should detect multiple existing JSDoc comments', () => {
      const testFile = path.join(tempDir, 'test5.ts');
      const content = `/**
 * First doc
 */
function first() {}

/**
 * Second doc
 */
function second() {}`;
      fs.writeFileSync(testFile, content);

      const existingDocs = inserter.detectExistingDocs(testFile);

      expect(existingDocs).toHaveLength(2);
      expect(existingDocs[0].elementName).toBe('first');
      expect(existingDocs[1].elementName).toBe('second');
    });

    it('should handle files with no JSDoc comments', () => {
      const testFile = path.join(tempDir, 'test6.ts');
      const content = `function noDoc() {
  return true;
}`;
      fs.writeFileSync(testFile, content);

      const existingDocs = inserter.detectExistingDocs(testFile);

      expect(existingDocs).toHaveLength(0);
    });
  });

  describe('conflict detection', () => {
    it('should skip insertion when documentation already exists', () => {
      const testFile = path.join(tempDir, 'test7.ts');
      const content = `/**
 * Existing documentation
 */
function myFunc() {
  return true;
}`;
      fs.writeFileSync(testFile, content);

      const doc: Documentation = {
        element: {
          type: CodeElementType.FUNCTION,
          name: 'myFunc',
          filePath: testFile,
          lineNumber: 3,
          context: {}
        },
        jsdoc: {
          description: 'New documentation',
          returns: { type: 'boolean', description: 'Returns true' }
        },
        insertionPoint: { line: 3, column: 0 },
        formattedComment: '/**\n * New documentation\n */'
      };

      inserter.insertDocumentation(testFile, [doc]);

      const result = fs.readFileSync(testFile, 'utf-8');
      
      // Should still have only one JSDoc comment (the existing one)
      const jsdocCount = (result.match(/\/\*\*/g) || []).length;
      expect(jsdocCount).toBe(1);
      expect(result).toContain('Existing documentation');
      expect(result).not.toContain('New documentation');
    });

    it('should insert when no conflict exists', () => {
      const testFile = path.join(tempDir, 'test8.ts');
      const content = `/**
 * Existing documentation for first
 */
function first() {
  return 1;
}

function second() {
  return 2;
}`;
      fs.writeFileSync(testFile, content);

      const doc: Documentation = {
        element: {
          type: CodeElementType.FUNCTION,
          name: 'second',
          filePath: testFile,
          lineNumber: 7,
          context: {}
        },
        jsdoc: {
          description: 'Documentation for second',
          returns: { type: 'number', description: 'Returns 2' }
        },
        insertionPoint: { line: 7, column: 0 },
        formattedComment: '/**\n * Documentation for second\n */'
      };

      inserter.insertDocumentation(testFile, [doc]);

      const result = fs.readFileSync(testFile, 'utf-8');
      
      // Should have two JSDoc comments
      const jsdocCount = (result.match(/\/\*\*/g) || []).length;
      expect(jsdocCount).toBe(2);
      expect(result).toContain('Existing documentation for first');
      expect(result).toContain('Documentation for second');
    });
  });
});
