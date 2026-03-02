import * as fs from 'fs';
import { Documentation } from './types';

/**
 * Represents existing documentation found in a file
 */
export interface ExistingDoc {
  line: number;
  content: string;
  elementName?: string;
}

/**
 * DocumentationInserter handles inserting JSDoc comments into source files
 * while preserving existing code structure and detecting conflicts
 */
export class DocumentationInserter {
  /**
   * Insert documentation into a file
   * @param filePath - Path to the file to modify
   * @param docs - Array of documentation to insert
   * @throws {Error} If file cannot be read or written
   */
  insertDocumentation(filePath: string, docs: Documentation[]): void {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Detect existing documentation
    const existingDocs = this.detectExistingDocs(filePath);
    
    // Filter out docs that conflict with existing documentation
    const docsToInsert = docs.filter(doc => {
      return !this.hasConflict(doc, existingDocs);
    });

    // Sort docs by line number in reverse order to maintain line numbers
    const sortedDocs = [...docsToInsert].sort((a, b) => 
      b.insertionPoint.line - a.insertionPoint.line
    );

    // Insert each documentation
    for (const doc of sortedDocs) {
      const insertLine = doc.insertionPoint.line;
      const indentation = this.getIndentation(lines, insertLine);
      const formattedComment = this.formatWithIndentation(
        doc.formattedComment,
        indentation
      );

      // Insert the comment before the target line
      lines.splice(insertLine, 0, formattedComment);
    }

    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }

  /**
   * Detect existing JSDoc comments in a file
   * @param filePath - Path to the file to analyze
   * @returns Array of existing documentation locations
   */
  detectExistingDocs(filePath: string): ExistingDoc[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const existingDocs: ExistingDoc[] = [];

    let inComment = false;
    let commentStart = -1;
    let commentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('/**')) {
        inComment = true;
        commentStart = i;
        commentLines = [line];
      } else if (inComment) {
        commentLines.push(line);
        if (line.includes('*/')) {
          inComment = false;
          
          // Try to extract element name from next non-empty line
          let elementName: string | undefined;
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.startsWith('//')) {
              // Extract function/class/const name
              const match = nextLine.match(/(?:function|class|const|let|var|export)\s+(\w+)/);
              if (match) {
                elementName = match[1];
              }
              break;
            }
          }

          existingDocs.push({
            line: commentStart,
            content: commentLines.join('\n'),
            elementName
          });
          commentLines = [];
        }
      }
    }

    return existingDocs;
  }

  /**
   * Check if a documentation conflicts with existing documentation
   * @param doc - Documentation to check
   * @param existingDocs - Array of existing documentation
   * @returns True if there's a conflict
   */
  private hasConflict(doc: Documentation, existingDocs: ExistingDoc[]): boolean {
    const targetLine = doc.insertionPoint.line;
    const elementName = doc.element.name;

    // Check if there's existing documentation near the insertion point
    for (const existing of existingDocs) {
      // If existing doc is within 5 lines before the insertion point
      if (existing.line >= targetLine - 5 && existing.line < targetLine) {
        // If element names match, it's a conflict
        if (existing.elementName === elementName) {
          console.warn(
            `Skipping documentation for ${elementName} at line ${targetLine}: ` +
            `existing documentation found at line ${existing.line}`
          );
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the indentation of a line
   * @param lines - Array of file lines
   * @param lineNumber - Line number to check
   * @returns Indentation string (spaces or tabs)
   */
  private getIndentation(lines: string[], lineNumber: number): string {
    if (lineNumber >= lines.length) {
      return '';
    }

    const line = lines[lineNumber];
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }

  /**
   * Format a comment with proper indentation
   * @param comment - Comment text to format
   * @param indentation - Indentation string to apply
   * @returns Formatted comment with indentation
   */
  private formatWithIndentation(comment: string, indentation: string): string {
    const lines = comment.split('\n');
    return lines.map(line => indentation + line).join('\n');
  }
}
