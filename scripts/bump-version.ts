import fs from "node:fs";
import path from "node:path";

const targetVersion = process.argv[2];

if (!targetVersion) {
  console.error("Usage: bun run bump <version> (e.g. bun run bump 0.0.3)");
  process.exit(1);
}

const rootDir = process.cwd();

const packageDirs = [
  rootDir,
  path.join(rootDir, "packages", "core"),
  path.join(rootDir, "packages", "webview"),
  path.join(rootDir, "packages", "vite-plugin"),
  path.join(rootDir, "packages", "picots"),
  path.join(rootDir, "packages", "create-picots"),
  path.join(rootDir, "packages", "create-picots", "templates", "react"),
  path.join(rootDir, "packages", "create-picots", "templates", "vanilla"),
  path.join(rootDir, "examples", "starter-app"),
];

console.log(`\n🚀 Bumping all packages to version: ${targetVersion}\n`);

for (const dir of packageDirs) {
  const pkgPath = path.join(dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const oldVersion = pkg.version;
    pkg.version = targetVersion;

    // Update internal @picots/* dependency versions if present
    for (const depType of ["dependencies", "devDependencies", "peerDependencies"]) {
      if (pkg[depType]) {
        for (const dep of Object.keys(pkg[depType])) {
          if (dep.startsWith("@picots/")) {
            pkg[depType][dep] = `^${targetVersion}`;
          }
        }
      }
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(`✅ ${pkg.name || "root"} : ${oldVersion} -> ${targetVersion}`);
  }
}

console.log("\n🎉 All package versions updated successfully!\n");
