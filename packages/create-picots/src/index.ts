import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const args = process.argv.slice(2);
  let targetDirName = "my-picots-app";
  let templateName = "vanilla";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--template" || args[i] === "-t") {
      templateName = args[i + 1] || "vanilla";
      i++;
    } else if (!args[i].startsWith("-")) {
      targetDirName = args[i];
    }
  }

  const targetPath = join(process.cwd(), targetDirName);

  console.log(`\n🚀 [create-picots] Scaffolding new PicoTS app (${templateName}) in: ${targetDirName}\n`);

  if (existsSync(targetPath)) {
    console.error(`❌ Directory "${targetDirName}" already exists!`);
    process.exit(1);
  }

  mkdirSync(targetPath, { recursive: true });
  
  let templatePath = join(__dirname, "..", "templates", templateName);
  if (!existsSync(templatePath)) {
    console.warn(`⚠️ Template "${templateName}" not found. Falling back to "vanilla".`);
    templatePath = join(__dirname, "..", "templates", "vanilla");
  }

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

  // Update picots.config.json name
  const cfgJsonPath = join(targetPath, "picots.config.json");
  if (existsSync(cfgJsonPath)) {
    try {
      const cfg = JSON.parse(readFileSync(cfgJsonPath, "utf8"));
      cfg.name = targetDirName;
      if (cfg.window) cfg.window.title = targetDirName;
      writeFileSync(cfgJsonPath, JSON.stringify(cfg, null, 2), "utf8");
    } catch {}
  }

  console.log(`✅ Success! Created "${targetDirName}" with ${templateName} template.`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${targetDirName}`);
  console.log(`  bun install`);
  console.log(`  bun run dev\n`);
}

main().catch(console.error);
