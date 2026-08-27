/**
 * Console forwarder that pipes browser renderer logs (log, warn, error)
 * straight into the terminal stdout during development.
 */
export function setupConsoleForwarder() {
    if (typeof window === "undefined")
        return;
    if (window.__picots_logger_installed__)
        return;
    window.__picots_logger_installed__ = true;
    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    function forward(type, args) {
        const cleanArgs = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (typeof arg === "string" && arg.includes("%c")) {
                const count = (arg.match(/%c/g) || []).length;
                cleanArgs.push(arg.replace(/%c/g, ""));
                i += count; // Skip the CSS styling strings
            }
            else {
                cleanArgs.push(arg);
            }
        }
        const formatted = cleanArgs
            .map((arg) => {
            if (typeof arg === "string")
                return arg;
            if (arg instanceof Error)
                return `${arg.name}: ${arg.message}\n${arg.stack}`;
            try {
                return JSON.stringify(arg, null, 2);
            }
            catch {
                return String(arg);
            }
        })
            .join(" ");
        // 1. Forward via Vite HMR WebSocket if available
        try {
            if (import.meta.hot) {
                import.meta.hot.send("picots:log", { type, message: formatted });
            }
        }
        catch { }
        // 2. Forward via native C++ binding if available
        try {
            if (typeof window.__picots_log__ === "function") {
                window.__picots_log__(`[${type}] ${formatted}`);
            }
        }
        catch { }
    }
    console.log = (...args) => {
        origLog(...args);
        forward("log", args);
    };
    console.warn = (...args) => {
        origWarn(...args);
        forward("warn", args);
    };
    console.error = (...args) => {
        origError(...args);
        forward("error", args);
    };
}
// Auto-run forwarder in browser context
setupConsoleForwarder();
