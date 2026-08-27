export class Notification {
    title;
    body;
    subtitle;
    silent;
    icon;
    constructor(options) {
        this.title = options.title;
        this.body = options.body;
        this.subtitle = options.subtitle;
        this.silent = options.silent;
        this.icon = options.icon;
    }
    async show() {
        if (typeof globalThis.notification_send === "function") {
            await globalThis.notification_send(this.title, this.body);
            return;
        }
        if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
            new window.Notification(this.title, { body: this.body, icon: this.icon, silent: this.silent });
        }
    }
    static isSupported() {
        return true;
    }
}
export const notification = {
    async send(options) {
        const notif = new Notification(options);
        await notif.show();
        return true;
    },
};
