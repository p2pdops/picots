export interface RecordItem {
  id: string;
  title: string;
  category: string;
  value: number;
  tags: string[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  status: "success" | "pending" | "error";
  durationMs: string;
  timestamp: string;
  details?: any;
}

// In-Memory dataset for CRUD and data storage tests
export const STORE_ITEMS: RecordItem[] = [
  { id: "rec_1", title: "Configuration Profile A", category: "System", value: 128.5, tags: ["env", "prod"], createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: "rec_2", title: "Security Credentials Cache", category: "Auth", value: 45.0, tags: ["vault", "tokens"], createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: "rec_3", title: "Metrics Collector Job #104", category: "Telemetry", value: 920.0, tags: ["perf", "cpu"], createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: "rec_4", title: "Audit Trail Ledger Entry", category: "Audit", value: 310.0, tags: ["hash", "sha256"], createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
];

export const ACTIVITY_LOGS: ActivityLog[] = [
  { id: "log_1", action: "node:crypto Hash Checksum", module: "Crypto", status: "success", durationMs: "0.04", timestamp: new Date(Date.now() - 120000).toISOString() },
  { id: "log_2", action: "node:fs Sync File Write", module: "FileSystem", status: "success", durationMs: "0.18", timestamp: new Date(Date.now() - 60000).toISOString() },
];
