# 🤝 Contributing to PicoTS

Thank you for your interest in contributing to **PicoTS**! We welcome contributions of all kinds: bug fixes, documentation improvements, new native platform features, and performance enhancements.

---

## 🛠️ Development Setup

### Prerequisites
1. **[Bun](https://bun.sh)** (`>= 1.1.0`) — Monorepo package manager and runtime.
2. **C++ Compiler**:
   - **Windows**: MinGW-w64 (`g++` + `windres`) or MSVC.
   - **macOS**: Clang / Xcode Command Line Tools.
   - **Linux**: GCC / Clang with `libgtk-3-dev` and `libwebkit2gtk-4.1-dev`.
3. **[Git](https://git-scm.com/)**.

---

## 📦 Monorepo Structure

```
packages/
├── core/            # @picots/core — Runtime TypeScript SDK (BrowserWindow, ipcMain, etc.)
├── webview/         # @picots/webview — Native WebView engine headers & static libraries
├── vite-plugin/     # @picots/vite-plugin — Official Vite HMR plugin
├── picots/          # @picots/cli — Compiler and CLI driver (picots dev, picots build)
└── create-picots/   # @picots/create — Scaffolding starter tool

examples/
└── starter-app/     # Reference React 19 + Tailwind desktop application
```

---

## 🚀 Getting Started

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/p2pdops/picots.git
   cd picots
   ```

2. **Install Workspace Dependencies**:
   ```bash
   bun install
   ```

3. **Build All Packages**:
   ```bash
   bun run build
   ```

4. **Launch Reference App in Dev Mode (Instant Vite HMR)**:
   ```bash
   bun run --filter "starter-app" dev
   ```

5. **Build Standalone Executable**:
   ```bash
   bun run --filter "starter-app" build
   ```

---

## 🧪 Development Workflow

- **Typecheck & Build**: Run `bun run build:packages` to recompile TypeScript declaration files.
- **Dry-Run Package Validation**: Run `bun run test:pack` to ensure package tarballs include all necessary artifacts.
- **Code Style**:
  - Keep diffs minimal and surgically targeted.
  - Preserve documentation comments and existing function signatures.
  - Do not add heavy external runtime dependencies.

---

## 📬 Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(core): add globalShortcut API"
   ```
3. Push to your fork and submit a Pull Request to `main`.
4. GitHub Actions CI will automatically test and verify your build across Windows runners.

---

## 📄 License
By contributing to PicoTS, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
