export interface NotificationOptions {
  title: string;
  body: string;
}

export const notification = {
  async send(options: NotificationOptions): Promise<boolean> {
    if (typeof (globalThis as any).notification_send === "function") {
      await (globalThis as any).notification_send(options.title, options.body);
      return true;
    }
    // Fallback to Web Notification if granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(options.title, { body: options.body });
      return true;
    }
    return false;
  },
};
