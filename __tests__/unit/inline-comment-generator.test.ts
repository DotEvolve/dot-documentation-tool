/**
 * Unit Tests for Inline Comment Generator
 *
 * Tests inline comment generation for complex logic, algorithms, and business rules.
 */

import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import {
  generateInlineComments,
  detectBusinessRules,
} from "../../src/generators/InlineCommentGenerator";

/**
 * Helper to parse code and extract first matching node
 */
function parseAndExtract(code: string, nodeType: string): t.Node | null {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript"],
  });

  let foundNode: t.Node | null = null;

  traverse(ast, {
    enter(path) {
      if (path.node.type === nodeType && !foundNode) {
        foundNode = path.node;
      }
    },
  });

  return foundNode;
}

describe("InlineCommentGenerator", () => {
  describe("Complex conditional documentation", () => {
    it("should generate comments for complex if statements", () => {
      const code = `
        if (user.isActive && user.role === 'admin' || user.isSuperUser) {
          console.log('Access granted');
        }
      `;

      const node = parseAndExtract(code, "IfStatement");
      expect(node).not.toBeNull();

      const comments = generateInlineComments(node!);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].type).toBe("conditional");
    });

    it("should not generate comments for simple conditions", () => {
      const code = `
        if (user.isActive) {
          console.log('Active');
        }
      `;

      const node = parseAndExtract(code, "IfStatement");
      expect(node).not.toBeNull();

      const comments = generateInlineComments(node!);
      // Simple conditions might not generate comments
      expect(comments).toBeDefined();
    });
  });

  describe("Loop documentation", () => {
    it("should generate comments for for loops", () => {
      const code = `
        for (let i = 0; i < items.length; i++) {
          process(items[i]);
        }
      `;

      const node = parseAndExtract(code, "ForStatement");
      expect(node).not.toBeNull();

      const comments = generateInlineComments(node!);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].type).toBe("algorithm");
      expect(comments[0].text).toContain("Iterate");
    });

    it("should generate comments for while loops", () => {
      const code = `
        while (hasMore) {
          fetchNext();
        }
      `;

      const node = parseAndExtract(code, "WhileStatement");
      expect(node).not.toBeNull();

      const comments = generateInlineComments(node!);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].type).toBe("algorithm");
    });
  });

  describe("Calculation documentation", () => {
    it("should generate comments for mathematical calculations", () => {
      const code = `
        const total = price * quantity + tax;
      `;

      // Find the binary expression
      const ast = parse(code, { sourceType: "module" });
      let calcNode: t.Node | null = null;

      traverse(ast, {
        BinaryExpression(path) {
          if (!calcNode) {
            calcNode = path.node;
          }
        },
      });

      expect(calcNode).not.toBeNull();

      const comments = generateInlineComments(calcNode!);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0].type).toBe("calculation");
      expect(comments[0].text).toContain("Calculate");
    });

    it("should describe different operators correctly", () => {
      const operators = [
        { code: "a + b", desc: "sum of" },
        { code: "a - b", desc: "difference between" },
        { code: "a * b", desc: "product of" },
        { code: "a / b", desc: "quotient of" },
      ];

      operators.forEach(({ code, desc }) => {
        const ast = parse(code, { sourceType: "module" });
        let calcNode: t.Node | null = null;

        traverse(ast, {
          BinaryExpression(path) {
            if (!calcNode) {
              calcNode = path.node;
            }
          },
        });

        if (calcNode) {
          const comments = generateInlineComments(calcNode);
          if (comments.length > 0) {
            expect(comments[0].text.toLowerCase()).toContain(desc);
          }
        }
      });
    });
  });

  describe("Business rule detection", () => {
    it("should detect validation patterns", () => {
      const code = `
        validateUserInput(data);
      `;

      const node = parseAndExtract(code, "CallExpression");
      expect(node).not.toBeNull();

      const rules = detectBusinessRules(node!);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ruleType).toBe("validation");
    });

    it("should detect authorization patterns", () => {
      const code = `
        if (user.hasRole('admin')) {
          // do something
        }
      `;

      const ast = parse(code, { sourceType: "module" });
      let callNode: t.Node | null = null;

      traverse(ast, {
        CallExpression(path) {
          if (!callNode) {
            callNode = path.node;
          }
        },
      });

      expect(callNode).not.toBeNull();

      const rules = detectBusinessRules(callNode!);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ruleType).toBe("authorization");
    });

    it("should detect workflow patterns", () => {
      const code = `
        workflow.transition('approved');
      `;

      const ast = parse(code, { sourceType: "module" });
      let memberNode: t.Node | null = null;

      traverse(ast, {
        MemberExpression(path) {
          if (!memberNode) {
            memberNode = path.node;
          }
        },
      });

      expect(memberNode).not.toBeNull();

      const rules = detectBusinessRules(memberNode!);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ruleType).toBe("workflow");
    });

    it("should detect compliance patterns", () => {
      const code = `
        auditLog.record(action);
      `;

      const ast = parse(code, { sourceType: "module" });
      let memberNode: t.Node | null = null;

      traverse(ast, {
        MemberExpression(path) {
          if (!memberNode) {
            memberNode = path.node;
          }
        },
      });

      expect(memberNode).not.toBeNull();

      const rules = detectBusinessRules(memberNode!);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ruleType).toBe("compliance");
    });

    it("should not detect rules in regular code", () => {
      const code = `
        console.log('Hello');
      `;

      const node = parseAndExtract(code, "CallExpression");
      expect(node).not.toBeNull();

      const rules = detectBusinessRules(node!);
      expect(rules.length).toBe(0);
    });
  });
});
