import fs from "fs";
import path from "path";

// Feature: codebase-quality-improvements, Property 6: fast-check Version Consistency
describe("Property 6: fast-check Version Consistency", () => {
  it("all workspace package.json files declaring fast-check must use major version 4", () => {
    // Assuming workspace root is the parent directory of dot-documentation-tool
    const workspaceRoot = path.resolve(__dirname, "../../../");

    const dirs = fs
      .readdirSync(workspaceRoot, { withFileTypes: true })
      .filter(
        (dirent) => dirent.isDirectory() && dirent.name.startsWith("dot-"),
      )
      .map((dirent) => dirent.name);

    expect(dirs.length).toBeGreaterThan(0);

    for (const repoDir of dirs) {
      const packageJsonPath = path.join(workspaceRoot, repoDir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        const pkgContent = fs.readFileSync(packageJsonPath, "utf8");
        const pkg = JSON.parse(pkgContent);

        const fastCheckVer =
          (pkg.dependencies && pkg.dependencies["fast-check"]) ||
          (pkg.devDependencies && pkg.devDependencies["fast-check"]);

        if (fastCheckVer) {
          // The semver range should start with ^4, ~4, or 4
          const isValid =
            fastCheckVer.trim().startsWith("^4") ||
            fastCheckVer.trim().startsWith("~4") ||
            fastCheckVer.trim().startsWith("4");
          if (!isValid) {
            throw new Error(
              `Repo ${repoDir} uses fast-check version ${fastCheckVer}, expected major version 4.`,
            );
          }
          expect(isValid).toBe(true);
        }
      }
    }
  });
});
