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
    actions?: Array<{
        type: "button";
        text: string;
    }>;
    closeButtonText?: string;
    toastXml?: string;
}
export declare class Notification {
    title: string;
    body: string;
    subtitle?: string;
    silent?: boolean;
    icon?: string;
    constructor(options: NotificationConstructorOptions);
    show(): Promise<void>;
    static isSupported(): boolean;
}
export interface NotificationOptions {
    title: string;
    body: string;
}
export declare const notification: {
    send(options: NotificationOptions): Promise<boolean>;
};
//# sourceMappingURL=notification.d.ts.map