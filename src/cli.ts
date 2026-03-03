#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import { CodeAnalyzer } from "./analyzers/CodeAnalyzer";
import { generateJSDoc, formatJSDoc } from "./generators/JSDocGenerator";
import { DocumentationValidator } from "./validators/DocumentationValidator";
import { DocumentationInserter } from "./DocumentationInserter";
import { Documentation } from "./types";

/**
 * CLI configuration options
 */
interface CLIConfig {
  glossary?: Record<string, string>;
  excludePatterns?: string[];
  style?: {
    lineLength?: number;
    indentation?: string;
  };
}

/**
 * Statistics for documentation generation
 */
interface Stats {
  filesProcessed: number;
  commentsAdded: number;
  warnings: number;
  errors: number;
}

/**
 * Main CLI class for the documentation tool
 */
class DocumentationCLI {
  private analyzer: CodeAnalyzer;
  private validator: DocumentationValidator;
  private inserter: DocumentationInserter;
  private config: CLIConfig;
  private stats: Stats;

  constructor(config: CLIConfig = {}) {
    this.analyzer = new CodeAnalyzer();
    this.validator = new DocumentationValidator();
    this.inserter = new DocumentationInserter();
    this.config = config;
    this.stats = {
      filesProcessed: 0,
      commentsAdded: 0,
      warnings: 0,
      errors: 0,
    };
  }

  /**
   * Document a single file
   * @param filePath - Path to the file to document
   * @param dryRun - If true, don't write changes
   */
  async documentFile(filePath: string, dryRun: boolean = false): Promise<void> {
    try {
      console.log(`Processing ${filePath}...`);

      // Analyze the file
      const elements = this.analyzer.analyzeFile(filePath);

      if (elements.length === 0) {
        console.log(`  No undocumented elements found`);
        return;
      }

      // Generate documentation for each element
      const docs: Documentation[] = [];
      for (const element of elements) {
        try {
          const jsdoc = generateJSDoc(element);
          const formatted = formatJSDoc(jsdoc);

          // Validate the documentation
          const validationErrors = this.validator.validateSyntax(formatted);
          if (validationErrors.length > 0) {
            console.warn(`  Warning: Invalid JSDoc for ${element.name}`);
            validationErrors.forEach((err) =>
              console.warn(`    - ${err.message}`),
            );
            this.stats.warnings++;
            continue;
          }

          docs.push({
            element,
            jsdoc,
            insertionPoint: {
              line: element.lineNumber,
              column: 0,
            },
            formattedComment: formatted,
          });
        } catch (error) {
          // Skip elements that can't be documented (e.g., no signature)
          console.log(
            `  Skipping ${element.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          continue;
        }
      }

      if (dryRun) {
        console.log(`  Would add ${docs.length} documentation comments`);
        docs.forEach((doc) => {
          console.log(
            `    - ${doc.element.name} at line ${doc.element.lineNumber}`,
          );
        });
      } else {
        this.inserter.insertDocumentation(filePath, docs);
        console.log(`  Added ${docs.length} documentation comments`);
        this.stats.commentsAdded += docs.length;
      }

      this.stats.filesProcessed++;
    } catch (error) {
      console.error(`  Error processing ${filePath}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Document all files in a directory
   * @param dirPath - Path to the directory
   * @param dryRun - If true, don't write changes
   */
  async documentDirectory(
    dirPath: string,
    dryRun: boolean = false,
  ): Promise<void> {
    const files = this.getSourceFiles(dirPath);

    console.log(`Found ${files.length} files to process`);

    for (const file of files) {
      await this.documentFile(file, dryRun);
    }
  }

  /**
   * Get all source files in a directory recursively
   * @param dirPath - Directory path
   * @returns Array of file paths
   */
  private getSourceFiles(dirPath: string): string[] {
    const files: string[] = [];
    const excludePatterns = this.config.excludePatterns || [
      "node_modules",
      "dist",
      "build",
    ];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip excluded directories
        if (entry.isDirectory()) {
          if (
            !excludePatterns.some((pattern) => entry.name.includes(pattern))
          ) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          // Only process .ts and .js files
          if (fullPath.match(/\.(ts|js)$/)) {
            files.push(fullPath);
          }
        }
      }
    };

    walk(dirPath);
    return files;
  }

  /**
   * Validate existing documentation in a file
   * @param filePath - Path to the file to validate
   */
  async validateFile(filePath: string): Promise<void> {
    try {
      console.log(`Validating ${filePath}...`);

      const existingDocs = this.inserter.detectExistingDocs(filePath);

      if (existingDocs.length === 0) {
        console.log(`  No documentation found`);
        return;
      }

      for (const doc of existingDocs) {
        const validationErrors = this.validator.validateSyntax(doc.content);

        if (validationErrors.length > 0) {
          console.warn(`  Issues found at line ${doc.line}:`);
          validationErrors.forEach((err) =>
            console.warn(`    - ${err.message}`),
          );
          this.stats.warnings++;
        }
      }

      console.log(`  Validated ${existingDocs.length} documentation blocks`);
    } catch (error) {
      console.error(`  Error validating ${filePath}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Print statistics summary
   */
  printStats(): void {
    console.log("\n=== Summary ===");
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Comments added: ${this.stats.commentsAdded}`);
    console.log(`Warnings: ${this.stats.warnings}`);
    console.log(`Errors: ${this.stats.errors}`);
  }
}

/**
 * Load configuration from .docrc.json file
 * @param configPath - Path to config file
 * @returns Configuration object
 */
function loadConfig(configPath?: string): CLIConfig {
  const defaultConfig: CLIConfig = {
    excludePatterns: ["node_modules", "dist", "build", "__tests__"],
    style: {
      lineLength: 80,
      indentation: "  ",
    },
  };

  if (!configPath) {
    // Try to find .docrc.json in current directory
    const defaultPath = path.join(process.cwd(), ".docrc.json");
    if (fs.existsSync(defaultPath)) {
      configPath = defaultPath;
    } else {
      return defaultConfig;
    }
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(content);
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.warn(
      `Warning: Could not load config from ${configPath}, using defaults`,
    );
    return defaultConfig;
  }
}

// Main CLI program
const program = new Command();

program
  .name("doc-tool")
  .description("Automated JSDoc documentation generator")
  .version("1.0.0");

program
  .command("file <path>")
  .description("Document a single file")
  .option("--dry-run", "Preview changes without writing")
  .option("--config <path>", "Path to configuration file")
  .action(async (filePath: string, options: any) => {
    const config = loadConfig(options.config);
    const cli = new DocumentationCLI(config);
    await cli.documentFile(filePath, options.dryRun);
    cli.printStats();
  });

program
  .command("directory <path>")
  .description("Document all files in a directory")
  .option("--dry-run", "Preview changes without writing")
  .option("--config <path>", "Path to configuration file")
  .action(async (dirPath: string, options: any) => {
    const config = loadConfig(options.config);
    const cli = new DocumentationCLI(config);
    await cli.documentDirectory(dirPath, options.dryRun);
    cli.printStats();
  });

program
  .command("validate <path>")
  .description("Validate existing documentation")
  .option("--config <path>", "Path to configuration file")
  .action(async (filePath: string, options: any) => {
    const config = loadConfig(options.config);
    const cli = new DocumentationCLI(config);
    await cli.validateFile(filePath);
    cli.printStats();
  });

program.parse(process.argv);
