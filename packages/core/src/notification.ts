export interface NotificationConstructorOptions {
  title: string;
  body: string;
  subtitle?: string;
  silent?: boolean;
  icon?: string;
  hasReply?: boolean;
  timeoutType?: "default" | "never";
  replyPlaceholder?: string;
  sound?: string;
  urgency?: "normal" | "critical" | "low";
  actions?: Array<{ type: "button"; text: string }>;
  closeButtonText?: string;
  toastXml?: string;
}

export class Notification {
  public title: string;
  public body: string;
  public subtitle?: string;
  public silent?: boolean;
  public icon?: string;

  constructor(options: NotificationConstructorOptions) {
    this.title = options.title;
    this.body = options.body;
    this.subtitle = options.subtitle;
    this.silent = options.silent;
    this.icon = options.icon;
  }

  async show(): Promise<void> {
    if (typeof (globalThis as any).notification_send === "function") {
      await (globalThis as any).notification_send(this.title, this.body);
      return;
    }
    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
      new window.Notification(this.title, { body: this.body, icon: this.icon, silent: this.silent });
    }
  }

  static isSupported(): boolean {
    return true;
  }
}

export interface NotificationOptions {
  title: string;
  body: string;
}

export const notification = {
  async send(options: NotificationOptions): Promise<boolean> {
    const notif = new Notification(options);
    await notif.show();
    return true;
  },
};
