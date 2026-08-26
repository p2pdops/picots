export interface MenuItemConstructorOptions {
  label?: string;
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  click?: (menuItem: MenuItemConstructorOptions, browserWindow?: any) => void;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  submenu?: MenuItemConstructorOptions[] | Menu;
  id?: string;
}

export class MenuItem {
  public label?: string;
  public type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  public click?: (menuItem: MenuItemConstructorOptions, browserWindow?: any) => void;
  public enabled?: boolean;
  public visible?: boolean;
  public checked?: boolean;
  public submenu?: MenuItemConstructorOptions[] | Menu;
  public id?: string;

  constructor(options: MenuItemConstructorOptions) {
    Object.assign(this, options);
  }
}

export class Menu {
  public items: MenuItemConstructorOptions[];

  constructor() {
    this.items = [];
  }

  append(menuItem: MenuItemConstructorOptions): void {
    this.items.push(menuItem);
  }

  popup(options?: { window?: any; x?: number; y?: number }): void {
    // Shows context menu at coordinates
  }

  static buildFromTemplate(template: MenuItemConstructorOptions[]): Menu {
    const menu = new Menu();
    menu.items = template;
    return menu;
  }

  static setApplicationMenu(menu: Menu | null): void {
    // PicoTS apps are natively modern frameless/clean titlebars
  }

  static getApplicationMenu(): Menu | null {
    return null;
  }
}

export class Tray {
  private _tooltip: string = "PicoTS App";
  private _menu: Menu | null = null;
  private _isDestroyed: boolean = false;

  constructor(imagePath?: string) {
    this.create();
  }

  async create(): Promise<boolean> {
    if (typeof (globalThis as any).tray_create === "function") {
      await (globalThis as any).tray_create(this._tooltip);
      return true;
    }
    return false;
  }

  setToolTip(toolTip: string): void {
    this._tooltip = toolTip;
    if (typeof (globalThis as any).tray_set_tooltip === "function") {
      (globalThis as any).tray_set_tooltip(toolTip);
    }
  }

  setContextMenu(menu: Menu | null): void {
    this._menu = menu;
  }

  destroy(): void {
    if (typeof (globalThis as any).tray_destroy === "function") {
      (globalThis as any).tray_destroy();
    }
    this._isDestroyed = true;
  }

  isDestroyed(): boolean {
    return this._isDestroyed;
  }
}

// Global tray singleton helper
export const tray = {
  create: async (options?: { tooltip?: string }) => {
    const t = new Tray();
    if (options?.tooltip) t.setToolTip(options.tooltip);
    return true;
  },
  setTooltip: async (tooltip: string) => {
    if (typeof (globalThis as any).tray_set_tooltip === "function") {
      await (globalThis as any).tray_set_tooltip(tooltip);
      return true;
    }
    return false;
  },
  destroy: async () => {
    if (typeof (globalThis as any).tray_destroy === "function") {
      await (globalThis as any).tray_destroy();
      return true;
    }
    return false;
  },
};
