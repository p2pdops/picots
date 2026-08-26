import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, "..");

export const webviewPaths = {
  root: packageRoot,
  includeDir: join(packageRoot, "include"),
  libDir: join(packageRoot, "lib"),
  srcDir: join(packageRoot, "src"),
  webviewHeader: join(packageRoot, "include", "webview.h"),
  windowsStaticLib: join(packageRoot, "lib", "WebView2LoaderStatic.lib"),
};

export default webviewPaths;
