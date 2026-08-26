Yes — **it absolutely is possible**, and I think you're seeing an interesting opportunity here.

The key distinction is:

> **scriptc can replace the “Rust backend” part of Tauri surprisingly well, but it doesn't replace the WebView itself.**

Tauri is essentially:

```text
┌──────────────────────────────────────┐
│          Your Desktop App            │
│                                      │
│  ┌──────────────────────────────┐    │
│  │       OS WebView             │    │
│  │                              │    │
│  │ HTML / CSS / JS / React      │    │
│  └──────────────┬───────────────┘    │
│                 │ IPC                │
│  ┌──────────────▼───────────────┐    │
│  │       Native Backend         │    │
│  │             Rust             │    │
│  │ filesystem / network / OS    │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

Tauri explicitly uses the OS WebView plus a native Rust layer for OS integration. ([Tauri][1])

With scriptc, you could instead build:

```text
┌──────────────────────────────────────┐
│          Your Desktop App            │
│                                      │
│  ┌──────────────────────────────┐    │
│  │       OS WebView             │    │
│  │                              │    │
│  │ HTML / CSS / React / Svelte  │    │
│  └──────────────┬───────────────┘    │
│                 │ IPC                │
│  ┌──────────────▼───────────────┐    │
│  │       Native Backend         │    │
│  │          TypeScript          │    │
│  │                              │    │
│  │ fs / http / crypto / OS FFI  │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

And **scriptc is already much closer to being capable of this than you might initially think.**

It has a native runtime, async/await, filesystem APIs, networking/server APIs, crypto, FFI, and native compilation. ([GitHub][2])

### The missing piece is actually quite specific

You need something like:

```ts
import { Window } from "scriptc-desktop";

const window = new Window({
  title: "My App",
  width: 1200,
  height: 800,
});

window.load("index.html");

window.on("message", async (message) => {
  if (message.type === "readFile") {
    return await fs.readFile(message.path, "utf8");
  }
});

window.show();
```

The compiler/runtime doesn't inherently give you:

* native window creation
* WebView creation
* WebView lifecycle
* menu/tray integration
* OS notifications
* keyboard/mouse/window events
* WebView ↔ native IPC
* macOS WKWebView integration
* Windows WebView2 integration
* Linux WebKitGTK integration

**Those are the things Tauri's Rust ecosystem provides.**

But here's the interesting part:

### You don't necessarily need Rust to build them.

`scriptc` has **native FFI** specifically for binding TypeScript declarations to C ABI libraries. ([GitHub][2])

So conceptually:

```text
             TypeScript
                 │
                 ▼
            ┌─────────┐
            │ scriptc │
            └────┬────┘
                 │
          native executable
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
    scriptc runtime     FFI bindings
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
           WebKit       WebView2      WKWebView
           GTK/etc.     Windows       macOS
```

You could build a **TypeScript-first Tauri alternative**.

And actually, I think that's a more interesting project than simply "Tauri but rewritten in TypeScript."

---

## There are two ways to approach it

### 1. Thin wrapper around existing native WebView libraries

This is the easiest.

Build a small native library in C/C++/Zig that exposes something like:

```c
window_create(...)
window_load_url(...)
window_load_html(...)
window_eval(...)
window_on_message(...)
window_send_message(...)
window_set_size(...)
window_show(...)
window_close(...)
```

Then expose declarations:

```ts
declare function window_create(options: WindowOptions): Window;
declare function window_eval(window: Window, js: string): void;
```

and bind them through scriptc FFI.

Your actual application stays **100% TypeScript**.

That would already give you something resembling:

```text
my-app.ts
   │
   ▼
scriptc
   │
   ▼
my-app.exe
   │
   ├── scriptc runtime
   ├── your TypeScript
   └── native WebView bindings
```

No Node.

No Electron.

No V8.

And potentially a very small application.

---

## 2. Go much further: build the whole desktop runtime

This is where it gets really interesting.

You could make:

```text
desktopc
```

or something similar:

```bash
desktopc build src/main.ts
```

with:

```ts
import { app, Window, tray } from "desktop";

const win = new Window({
  width: 1000,
  height: 700,
});

win.load("dist/index.html");

win.on("ready", () => {
  console.log("ready");
});
```

Then provide:

```ts
app
window
webview
menu
tray
notification
clipboard
dialog
filesystem
shell
process
system
```

as native TypeScript APIs.

The architecture could be:

```text
                 TypeScript
                     │
                     ▼
                  scriptc
                     │
              ┌──────▼──────┐
              │ Native IR   │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │ scriptc C   │
              │ runtime     │
              └──────┬──────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
    Window         WebView        OS APIs
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
                Native App
```

The really nice thing is that **the IPC boundary could disappear for your application code**.

Instead of the traditional Tauri model:

```text
React
  │
  │ invoke("read_file")
  ▼
Rust
  │
  ▼
filesystem
```

you could have:

```ts
const contents = await fs.readFile(path);
```

because the TypeScript itself is native.

---

# But there's one enormous problem

**The WebView.**

This is the part that's easy to underestimate.

Tauri doesn't implement a browser. It delegates to the operating system's WebView. That's why Tauri can remain relatively small. ([Tauri][1])

You'd need platform implementations roughly like:

### macOS

```text
TypeScript
   ↓
scriptc
   ↓
Objective-C/Swift/C ABI
   ↓
WKWebView
```

### Windows

```text
TypeScript
   ↓
scriptc
   ↓
C/C++ ABI
   ↓
WebView2
```

### Linux

```text
TypeScript
   ↓
scriptc
   ↓
GTK/WebKitGTK
   ↓
WebKit
```

That's the genuinely difficult part.

**Not compiling TypeScript.**

**Not the IPC.**

**Not filesystem APIs.**

**Not even the native executable.**

It's the cross-platform desktop/windowing/WebView layer.

---

# And scriptc has another advantage here

Look at what scriptc already does:

> TypeScript → typed IR → LLVM/C → native executable

and its runtime is already written in C, with feature units that are link-gated. ([GitHub][2])

That means a hypothetical desktop runtime doesn't necessarily have to become a gigantic dependency.

You could potentially have:

```text
app.exe
│
├── your compiled TS
├── scriptc runtime
├── desktop runtime
└── platform WebView integration
```

rather than:

```text
Electron
├── Chromium
├── V8
├── Node
├── Electron runtime
└── your application
```

That's a **very compelling architecture**.

---

# There's an even crazier possibility

You could make the frontend **TypeScript too**, but *not execute it through scriptc*.

For example:

```text
                    app.ts
                      │
             ┌────────┴─────────┐
             │                  │
             ▼                  ▼
        scriptc compiler     Vite/esbuild
             │                  │
             ▼                  ▼
        native backend       web frontend
             │                  │
             │              index.html
             │                  │
             └────────┬─────────┘
                      ▼
                  WebView
```

So developers get:

```text
src/
├── main.ts       ← native TypeScript
├── frontend/
│   ├── App.tsx
│   └── ...
```

and:

```bash
desktopc build
```

produces one application.

---

## And WASI makes the idea even more interesting

The current scriptc work has also made WASI a production target, including async/await, promises, timers, filesystem work and even the dynamic tier. ([GitHub][3])

So you could eventually imagine:

```text
              TypeScript
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
     Native                WASM
     desktop              sandbox
        │                    │
     OS APIs             restricted APIs
```

That could give you a **capability-based plugin system** where plugins are written in TypeScript and compiled to WASM.

---

# So my answer is: yes.

If by "Tauri-like" you mean:

> **"Can scriptc be the foundation for a TypeScript-native desktop application framework?"**

**Absolutely.**

If you mean:

> **"Can scriptc alone currently compile a `.ts` file and magically produce a Tauri-like desktop GUI?"**

No — because scriptc is currently a **native language/runtime/compiler**, not a desktop GUI/WebView framework. Its documented platform support is currently focused on native executable/WASI targets and OS/runtime APIs rather than providing the WebView/window abstraction itself. ([GitHub][4])

But the missing layer is quite well-defined.

And honestly, **I think the architecture could be cleaner than Tauri for TypeScript developers**:

```text
Tauri

TypeScript UI
     ↓
   IPC
     ↓
Rust backend
     ↓
OS
```

versus:

```text
scriptc-desktop

TypeScript
     ↓
native compilation
     ↓
OS
```

with the WebView sitting alongside the native TypeScript runtime.

If you're thinking of actually building this, I can sketch out a **minimal `scriptc-desktop` architecture**—including the FFI boundary, WebView abstraction, IPC design, macOS/Windows/Linux implementation strategy, and what you'd need to add to scriptc itself versus keeping in a separate project.

[1]: https://tauri.app/concept/architecture/?utm_source=chatgpt.com "Tauri Architecture | Tauri"
[2]: https://github.com/vercel-labs/scriptc?utm_source=chatgpt.com "GitHub - vercel-labs/scriptc: TypeScript-to-Native Compiler · GitHub"
[3]: https://github.com/vercel-labs/scriptc/releases?utm_source=chatgpt.com "Releases · vercel-labs/scriptc · GitHub"
[4]: https://github.com/vercel-labs/scriptc/blob/main/docs/src/app/platforms/page.mdx?utm_source=chatgpt.com "scriptc/docs/src/app/platforms/page.mdx at main · vercel-labs/scriptc · GitHub"
