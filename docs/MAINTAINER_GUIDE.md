# 🛠️ PicoTS Maintainer & Release Guide

This document is for repository maintainers responsible for releasing new versions of PicoTS and publishing packages to the **npm registry** and **GitHub Releases**.

---

## 📦 Monorepo Package Topology

```
@picots/webview ──┐
                  ├──> @picots/cli (picots) ──> create-picots (create)
   @picots/core ──┘
```

1. **`@picots/webview`**: Single-header WebView bindings and static libraries.
2. **`@picots/core`**: Runtime TypeScript SDK (`BrowserWindow`, `ipcMain`, `ipcRenderer`, etc.).
3. **`@picots/vite-plugin`**: Vite desktop dev server & HMR plugin.
4. **`@picots/cli`**: Master CLI compiler (`picots dev`, `picots build`).
5. **`@picots/create`**: Scaffolding tool (`bunx @picots/create`, `npx @picots/create`).

---

## 🚀 How to Cut a Release

### Step 1: Bump All Versions Across the Monorepo
Run the automated version bumper:
```bash
# Example for bumping to 0.0.7
bun run bump 0.0.7
```
This automatically updates:
- Root `package.json`
- All package manifests under `packages/*/package.json`
- Starter templates and example applications
- Internal `@picots/*` workspace dependencies

---

### Step 2: Build & Verify Packages Locally
```bash
bun run build
bun run test:pack
```

---

### Step 3: Publish to npm
Ensure you are logged in to your npm account (`npm login`):
```bash
bun run release:publish
```

---

### Step 4: Tag & Push to GitHub
```bash
git add .
git commit -m "chore: release v0.0.7"
git tag v0.0.7
git push origin main --tags
```

---

## 🤖 Automated CI/CD Behavior

1. **On Push / PR to `main`**:
   - Runs [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) to compile all packages and verify that `dist/starter-app.exe` compiles cleanly on Windows.
2. **On Git Tag (`v*`)**:
   - Runs [`.github/workflows/release.yml`](../.github/workflows/release.yml) to compile `picots-starter-app-windows-x64.exe` and publish the release to **GitHub Releases**.
   - If `NPM_TOKEN` secret is set, automatically deploys to npm.
3. **On Changes to `docs/`**:
   - Runs [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) to deploy the landing page to `https://p2pdops.github.io/picots/`.
