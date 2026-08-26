import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const packages = [
  { name: "@picots/core", dir: "packages/core" },
  { name: "@picots/webview", dir: "packages/webview" },
  { name: "@picots/vite-plugin", dir: "packages/vite-plugin" },
  { name: "@picots/cli", dir: "packages/picots" },
  { name: "@picots/create", dir: "packages/create-picots" },
];

console.log("\n🔨 1. Building all packages...\n");
execSync("bun run build:packages", { stdio: "inherit" });

console.log("\n📦 2. Publishing packages to npm...\n");

for (const pkg of packages) {
  const pkgDir = path.join(rootDir, pkg.dir);
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
  console.log(`\n🚀 Publishing ${pkg.name}@${pkgJson.version}...`);

  try {
    execSync("npm publish --access public", {
      cwd: pkgDir,
      stdio: "inherit",
    });
    console.log(`✅ Successfully published ${pkg.name}@${pkgJson.version}`);
  } catch (err: any) {
    console.warn(`⚠️ Skipped or failed ${pkg.name}: (May already be published)`);
  }
}

console.log("\n🎉 Publish process finished!\n");
