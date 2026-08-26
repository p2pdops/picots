import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const targetDirName = process.argv[2] || "my-picots-app";
  const targetPath = join(process.cwd(), targetDirName);

  console.log(`\n🚀 [create-picots] Scaffolding new PicoTS desktop app in: ${targetDirName}\n`);

  if (existsSync(targetPath)) {
    console.error(`❌ Directory "${targetDirName}" already exists!`);
    process.exit(1);
  }

  mkdirSync(targetPath, { recursive: true });
  const templatePath = join(__dirname, "..", "templates", "vanilla");

  cpSync(templatePath, targetPath, { recursive: true });

  // Handle _gitignore -> .gitignore for npm distribution
  const underGitignore = join(targetPath, "_gitignore");
  const dotGitignore = join(targetPath, ".gitignore");
  if (existsSync(underGitignore) && !existsSync(dotGitignore)) {
    cpSync(underGitignore, dotGitignore);
  }

  // Update package.json name
  const pkgJsonPath = join(targetPath, "package.json");
  if (existsSync(pkgJsonPath)) {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    pkg.name = targetDirName;
    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2), "utf8");
  }

  console.log(`✅ Success! Created "${targetDirName}"`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${targetDirName}`);
  console.log(`  bun install`);
  console.log(`  bun run dev\n`);
}

main().catch(console.error);
