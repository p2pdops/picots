export class MenuItem {
    label;
    type;
    click;
    enabled;
    visible;
    checked;
    submenu;
    id;
    constructor(options) {
        Object.assign(this, options);
    }
}
export class Menu {
    items;
    constructor() {
        this.items = [];
    }
    append(menuItem) {
        this.items.push(menuItem);
    }
    popup(options) {
        // Shows context menu at coordinates
    }
    static buildFromTemplate(template) {
        const menu = new Menu();
        menu.items = template;
        return menu;
    }
    static setApplicationMenu(menu) {
        // PicoTS apps are natively modern frameless/clean titlebars
    }
    static getApplicationMenu() {
        return null;
    }
}
export class Tray {
    _tooltip = "PicoTS App";
    _menu = null;
    _isDestroyed = false;
    constructor(imagePath) {
        this.create();
    }
    async create() {
        if (typeof globalThis.tray_create === "function") {
            await globalThis.tray_create(this._tooltip);
            return true;
        }
        return false;
    }
    setToolTip(toolTip) {
        this._tooltip = toolTip;
        if (typeof globalThis.tray_set_tooltip === "function") {
            globalThis.tray_set_tooltip(toolTip);
        }
    }
    setContextMenu(menu) {
        this._menu = menu;
    }
    destroy() {
        if (typeof globalThis.tray_destroy === "function") {
            globalThis.tray_destroy();
        }
        this._isDestroyed = true;
    }
    isDestroyed() {
        return this._isDestroyed;
    }
}
// Global tray singleton helper
export const tray = {
    create: async (options) => {
        const t = new Tray();
        if (options?.tooltip)
            t.setToolTip(options.tooltip);
        return true;
    },
    setTooltip: async (tooltip) => {
        if (typeof globalThis.tray_set_tooltip === "function") {
            await globalThis.tray_set_tooltip(tooltip);
            return true;
        }
        return false;
    },
    destroy: async () => {
        if (typeof globalThis.tray_destroy === "function") {
            await globalThis.tray_destroy();
            return true;
        }
        return false;
    },
};
