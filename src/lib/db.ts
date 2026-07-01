import Dexie, { type EntityTable } from "dexie";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single micro-step within a breakdown. */
export interface BreakdownStep {
  id: string;
  content: string;
  praise: string;
}

/** A single log entry representing one recorded event. */
export interface LogEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  originalEvent: string;
  breakdownSteps: BreakdownStep[];
  createdAt: string; // ISO
}

/** API / LLM settings — singleton row (always id=1). */
export interface SparkleSettings {
  id?: number;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  useRealApi: boolean;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const db = new Dexie("sparkle_db") as Dexie & {
  logs: EntityTable<LogEntry, "id">;
  settings: EntityTable<SparkleSettings, "id">;
};

db.version(1).stores({
  logs: "++id, date, createdAt",
});

db.version(2).stores({
  logs: "++id, date, createdAt",
  settings: "id",
});

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: SparkleSettings = {
  apiBaseUrl: "https://api.openai.com/v1",
  apiKey: "",
  modelName: "gpt-4o-mini",
  useRealApi: false,
};

export async function getSettings(): Promise<SparkleSettings> {
  const row = await db.settings.get(1);
  return row ?? { ...DEFAULT_SETTINGS };
}

export async function putSettings(s: SparkleSettings): Promise<void> {
  await db.settings.put({ ...s, id: 1 });
}

export { db };
