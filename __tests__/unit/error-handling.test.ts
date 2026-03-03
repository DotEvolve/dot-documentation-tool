import * as fs from "fs";
import * as path from "path";
import { DocumentationInserter } from "../../src/DocumentationInserter";
import { CodeAnalyzer } from "../../src/analyzers/CodeAnalyzer";
import { generateJSDoc } from "../../src/generators/JSDocGenerator";

describe("Error Handling", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(__dirname, "temp-error-test");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  describe("File Operations", () => {
    it("should handle non-existent file gracefully", () => {
      const inserter = new DocumentationInserter();
      const nonExistentFile = path.join(tempDir, "does-not-exist.ts");

      expect(() => {
        inserter.detectExistingDocs(nonExistentFile);
      }).toThrow();
    });

    it("should handle invalid file path", () => {
      const analyzer = new CodeAnalyzer();
      const invalidPath = "/invalid/path/to/file.ts";

      expect(() => {
        analyzer.analyzeFile(invalidPath);
      }).toThrow();
    });
  });

  describe("Parsing Errors", () => {
    it("should throw on malformed JavaScript", () => {
      const testFile = path.join(tempDir, "malformed.js");
      const malformedCode = "function broken( { return";
      fs.writeFileSync(testFile, malformedCode);

      const analyzer = new CodeAnalyzer();

      // Should throw on malformed code
      expect(() => {
        analyzer.analyzeFile(testFile);
      }).toThrow("Failed to parse file");
    });

    it("should handle empty file", () => {
      const testFile = path.join(tempDir, "empty.ts");
      fs.writeFileSync(testFile, "");

      const analyzer = new CodeAnalyzer();
      const elements = analyzer.analyzeFile(testFile);

      expect(elements).toEqual([]);
    });
  });

  describe("Validation Errors", () => {
    it("should handle element without signature", () => {
      const element = {
        type: "function" as any,
        name: "test",
        filePath: "test.ts",
        lineNumber: 1,
        context: {},
      };

      expect(() => {
        generateJSDoc(element);
      }).toThrow("Cannot generate JSDoc for element without signature");
    });
  });
});
