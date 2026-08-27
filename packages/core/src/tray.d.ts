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
export declare class MenuItem {
    label?: string;
    type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
    click?: (menuItem: MenuItemConstructorOptions, browserWindow?: any) => void;
    enabled?: boolean;
    visible?: boolean;
    checked?: boolean;
    submenu?: MenuItemConstructorOptions[] | Menu;
    id?: string;
    constructor(options: MenuItemConstructorOptions);
}
export declare class Menu {
    items: MenuItemConstructorOptions[];
    constructor();
    append(menuItem: MenuItemConstructorOptions): void;
    popup(options?: {
        window?: any;
        x?: number;
        y?: number;
    }): void;
    static buildFromTemplate(template: MenuItemConstructorOptions[]): Menu;
    static setApplicationMenu(menu: Menu | null): void;
    static getApplicationMenu(): Menu | null;
}
export declare class Tray {
    private _tooltip;
    private _menu;
    private _isDestroyed;
    constructor(imagePath?: string);
    create(): Promise<boolean>;
    setToolTip(toolTip: string): void;
    setContextMenu(menu: Menu | null): void;
    destroy(): void;
    isDestroyed(): boolean;
}
export declare const tray: {
    create: (options?: {
        tooltip?: string;
    }) => Promise<boolean>;
    setTooltip: (tooltip: string) => Promise<boolean>;
    destroy: () => Promise<boolean>;
};
//# sourceMappingURL=tray.d.ts.map