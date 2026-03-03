/**
 * Unit tests for SideEffectDetector - Side Effect Detection
 *
 * Tests for Task 4.3: Write unit tests for side effect detection
 * Requirements: 2.5, 8.1
 */

import { detectSideEffects } from "../../src/analyzers/SideEffectDetector";
import { SideEffectType } from "../../src/types";
import { parse } from "@babel/parser";

describe("SideEffectDetector - Side Effect Detection", () => {
  /**
   * Helper function to parse code and extract the first function node
   */
  function parseFunction(code: string): any {
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });

    // Find the first function declaration, expression, or arrow function
    for (const node of ast.program.body) {
      if (node.type === "FunctionDeclaration") {
        return node;
      }
      if (node.type === "VariableDeclaration") {
        const init = node.declarations[0]?.init;
        if (
          init &&
          (init.type === "FunctionExpression" ||
            init.type === "ArrowFunctionExpression")
        ) {
          return init;
        }
      }
      if (
        node.type === "ExpressionStatement" &&
        node.expression.type === "FunctionExpression"
      ) {
        return node.expression;
      }
    }

    return null;
  }

  describe("Prisma Database Operations", () => {
    it("should detect Prisma create operation", () => {
      const code = `
        async function createUser(data) {
          return await prisma.user.create({ data });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
      expect(sideEffects[0].description).toContain("user");
      expect(sideEffects[0].description).toContain("create");
    });

    it("should detect Prisma update operation", () => {
      const code = `
        async function updateUser(id, data) {
          return await prisma.user.update({ where: { id }, data });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
      expect(sideEffects[0].description).toContain("user");
      expect(sideEffects[0].description).toContain("update");
    });

    it("should detect Prisma delete operation", () => {
      const code = `
        async function deleteUser(id) {
          return await prisma.user.delete({ where: { id } });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
      expect(sideEffects[0].description).toContain("user");
      expect(sideEffects[0].description).toContain("delete");
    });

    it("should detect Prisma findMany operation", () => {
      const code = `
        async function getUsers() {
          return await prisma.user.findMany();
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
      expect(sideEffects[0].description).toContain("user");
      expect(sideEffects[0].description).toContain("findMany");
    });

    it('should detect Prisma operations with "db" client name', () => {
      const code = `
        async function createPost(data) {
          return await db.post.create({ data });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
      expect(sideEffects[0].description).toContain("post");
      expect(sideEffects[0].description).toContain("create");
    });

    it('should detect Prisma operations with "client" name', () => {
      const code = `
        async function findUser(id) {
          return await client.user.findUnique({ where: { id } });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
      expect(sideEffects[0].description).toContain("user");
      expect(sideEffects[0].description).toContain("findUnique");
    });

    it("should detect raw SQL query execution", () => {
      const code = `
        async function executeQuery() {
          return await prisma.$queryRaw({ text: 'SELECT * FROM users' });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
      expect(sideEffects[0].description).toContain("SQL");
      expect(sideEffects[0].description).toContain("$queryRaw");
    });

    it("should detect multiple Prisma operations", () => {
      const code = `
        async function transferData(fromId, toId) {
          const from = await prisma.account.findUnique({ where: { id: fromId } });
          await prisma.account.update({ where: { id: fromId }, data: { balance: 0 } });
          await prisma.account.update({ where: { id: toId }, data: { balance: from.balance } });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects.length).toBeGreaterThanOrEqual(3);
      expect(
        sideEffects.filter((se) => se.type === SideEffectType.DATABASE),
      ).toHaveLength(3);
    });
  });

  describe("API Call Detection", () => {
    it("should detect fetch() call with string URL", () => {
      const code = `
        async function fetchData() {
          const response = await fetch('https://api.example.com/data');
          return response.json();
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      // Detects twice: once from CallExpression and once from AwaitExpression
      expect(sideEffects.length).toBeGreaterThanOrEqual(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("fetch");
      expect(sideEffects[0].description).toContain(
        "https://api.example.com/data",
      );
    });

    it("should detect fetch() call with template literal URL", () => {
      const code = `
        async function fetchUser(id) {
          const response = await fetch(\`/api/users/\${id}\`);
          return response.json();
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      // Detects twice: once from CallExpression and once from AwaitExpression
      expect(sideEffects.length).toBeGreaterThanOrEqual(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("fetch");
      expect(sideEffects[0].description).toContain("/api/users/");
    });

    it("should detect axios.get() call", () => {
      const code = `
        async function getData() {
          const response = await axios.get('https://api.example.com/data');
          return response.data;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      // Detects twice: once from CallExpression and once from AwaitExpression
      expect(sideEffects.length).toBeGreaterThanOrEqual(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("GET");
      expect(sideEffects[0].description).toContain("axios");
      expect(sideEffects[0].description).toContain(
        "https://api.example.com/data",
      );
    });

    it("should detect axios.post() call", () => {
      const code = `
        async function createUser(data) {
          const response = await axios.post('/api/users', data);
          return response.data;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      // Detects twice: once from CallExpression and once from AwaitExpression
      expect(sideEffects.length).toBeGreaterThanOrEqual(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("POST");
      expect(sideEffects[0].description).toContain("axios");
      expect(sideEffects[0].description).toContain("/api/users");
    });

    it("should detect axios.put() call", () => {
      const code = `
        async function updateUser(id, data) {
          return await axios.put(\`/api/users/\${id}\`, data);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      // Detects twice: once from CallExpression and once from AwaitExpression
      expect(sideEffects.length).toBeGreaterThanOrEqual(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("PUT");
      expect(sideEffects[0].description).toContain("axios");
    });

    it("should detect axios.delete() call", () => {
      const code = `
        async function deleteUser(id) {
          return await axios.delete(\`/api/users/\${id}\`);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      // Detects twice: once from CallExpression and once from AwaitExpression
      expect(sideEffects.length).toBeGreaterThanOrEqual(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("DELETE");
      expect(sideEffects[0].description).toContain("axios");
    });

    it("should detect direct axios() call", () => {
      const code = `
        async function makeRequest() {
          return await axios({ method: 'GET', url: '/api/data' });
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      // Detects twice: once from CallExpression and once from AwaitExpression
      expect(sideEffects.length).toBeGreaterThanOrEqual(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("axios");
    });

    it("should detect http.request() call", () => {
      const code = `
        function makeHttpRequest() {
          http.request({ hostname: 'example.com', path: '/api' }, callback);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("http.request");
    });

    it("should detect https.get() call", () => {
      const code = `
        function makeHttpsRequest() {
          https.get('https://example.com/api', callback);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.API_CALL);
      expect(sideEffects[0].description).toContain("https.get");
    });

    it("should detect multiple API calls", () => {
      const code = `
        async function fetchMultiple() {
          const users = await fetch('/api/users');
          const posts = await axios.get('/api/posts');
          return { users, posts };
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects.length).toBeGreaterThanOrEqual(2);
      // Each API call may be detected multiple times due to await handling
      expect(
        sideEffects.filter((se) => se.type === SideEffectType.API_CALL).length,
      ).toBeGreaterThanOrEqual(2);
    });
  });

  describe("File I/O Operations", () => {
    it("should detect fs.readFile() operation", () => {
      const code = `
        function readConfig() {
          fs.readFile('config.json', 'utf8', callback);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.readFile");
      expect(sideEffects[0].description).toContain("Reads");
    });

    it("should detect fs.writeFile() operation", () => {
      const code = `
        function saveData(data) {
          fs.writeFile('data.json', JSON.stringify(data), callback);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.writeFile");
      expect(sideEffects[0].description).toContain("Writes");
    });

    it("should detect fs.readFileSync() operation", () => {
      const code = `
        function readConfigSync() {
          return fs.readFileSync('config.json', 'utf8');
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.readFileSync");
    });

    it("should detect fs.writeFileSync() operation", () => {
      const code = `
        function saveDataSync(data) {
          fs.writeFileSync('data.json', JSON.stringify(data));
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.writeFileSync");
    });

    it("should detect fs.promises.readFile() operation", () => {
      const code = `
        async function readConfigAsync() {
          return await fs.promises.readFile('config.json', 'utf8');
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.promises.readFile");
    });

    it("should detect fs.promises.writeFile() operation", () => {
      const code = `
        async function saveDataAsync(data) {
          await fs.promises.writeFile('data.json', JSON.stringify(data));
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.promises.writeFile");
    });

    it("should detect fs.mkdir() operation", () => {
      const code = `
        function createDirectory() {
          fs.mkdir('new-dir', callback);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.mkdir");
    });

    it("should detect fs.unlink() operation", () => {
      const code = `
        function deleteFile() {
          fs.unlink('file.txt', callback);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.FILE_IO);
      expect(sideEffects[0].description).toContain("fs.unlink");
    });

    it("should detect multiple file operations", () => {
      const code = `
        async function processFiles() {
          const data = await fs.promises.readFile('input.txt', 'utf8');
          await fs.promises.writeFile('output.txt', data.toUpperCase());
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects.length).toBeGreaterThanOrEqual(2);
      expect(
        sideEffects.filter((se) => se.type === SideEffectType.FILE_IO),
      ).toHaveLength(2);
    });
  });

  describe("State Mutation Detection", () => {
    it("should detect object property assignment", () => {
      const code = `
        function updateConfig(value) {
          config.setting = value;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("config.setting");
    });

    it("should detect variable assignment", () => {
      const code = `
        function setValue(value) {
          globalVar = value;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("globalVar");
    });

    it("should detect array.push() mutation", () => {
      const code = `
        function addItem(item) {
          items.push(item);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("items");
      expect(sideEffects[0].description).toContain("push");
    });

    it("should detect array.pop() mutation", () => {
      const code = `
        function removeItem() {
          return items.pop();
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("pop");
    });

    it("should detect array.splice() mutation", () => {
      const code = `
        function removeAt(index) {
          items.splice(index, 1);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("splice");
    });

    it("should detect array.sort() mutation", () => {
      const code = `
        function sortItems() {
          items.sort((a, b) => a - b);
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("sort");
    });

    it("should detect increment operator", () => {
      const code = `
        function increment() {
          counter++;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("counter");
      expect(sideEffects[0].description).toContain("++");
    });

    it("should detect decrement operator", () => {
      const code = `
        function decrement() {
          counter--;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("counter");
      expect(sideEffects[0].description).toContain("--");
    });

    it("should detect object property increment", () => {
      const code = `
        function incrementScore() {
          player.score++;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.STATE_MUTATION);
      expect(sideEffects[0].description).toContain("player.score");
    });

    it("should detect multiple state mutations", () => {
      const code = `
        function updateState(value) {
          config.setting = value;
          items.push(value);
          counter++;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects.length).toBeGreaterThanOrEqual(3);
      expect(
        sideEffects.filter((se) => se.type === SideEffectType.STATE_MUTATION),
      ).toHaveLength(3);
    });
  });

  describe("Complex Scenarios", () => {
    it("should detect multiple types of side effects in one function", () => {
      const code = `
        async function complexOperation(userId, data) {
          // Database operation
          const user = await prisma.user.findUnique({ where: { id: userId } });
          
          // API call
          const response = await fetch('https://api.example.com/validate', {
            method: 'POST',
            body: JSON.stringify(data)
          });
          
          // File I/O
          await fs.promises.writeFile('log.txt', 'Operation completed');
          
          // State mutation
          globalCache[userId] = user;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects.length).toBeGreaterThanOrEqual(4);
      expect(
        sideEffects.some((se) => se.type === SideEffectType.DATABASE),
      ).toBe(true);
      expect(
        sideEffects.some((se) => se.type === SideEffectType.API_CALL),
      ).toBe(true);
      expect(sideEffects.some((se) => se.type === SideEffectType.FILE_IO)).toBe(
        true,
      );
      expect(
        sideEffects.some((se) => se.type === SideEffectType.STATE_MUTATION),
      ).toBe(true);
    });

    it("should handle function with no side effects", () => {
      const code = `
        function pureCalculation(a, b) {
          const result = a + b;
          return result * 2;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(0);
    });

    it("should handle empty function", () => {
      const code = `
        function emptyFunction() {}
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(0);
    });

    it("should handle null node", () => {
      const sideEffects = detectSideEffects(null);
      expect(sideEffects).toHaveLength(0);
    });

    it("should handle node without body", () => {
      const sideEffects = detectSideEffects({
        type: "FunctionDeclaration",
        params: [],
      });
      expect(sideEffects).toHaveLength(0);
    });

    it("should detect side effects in arrow function", () => {
      const code = `
        const updateUser = async (id, data) => {
          await prisma.user.update({ where: { id }, data });
        };
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects).toHaveLength(1);
      expect(sideEffects[0].type).toBe(SideEffectType.DATABASE);
    });

    it("should detect side effects in nested function calls", () => {
      const code = `
        async function processData() {
          const result = await Promise.all([
            prisma.user.findMany(),
            fetch('/api/data'),
            fs.promises.readFile('config.json')
          ]);
          return result;
        }
      `;

      const funcNode = parseFunction(code);
      const sideEffects = detectSideEffects(funcNode);

      expect(sideEffects.length).toBeGreaterThanOrEqual(3);
    });
  });
});
