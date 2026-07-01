import { create } from "zustand";
import {
  db,
  type LogEntry,
  type BreakdownStep,
  type SparkleSettings,
  getSettings,
  putSettings,
} from "./db";
import { generateBreakdown, generatePraise } from "./mock-ai";
import { generateBreakdownReal, generatePraiseReal } from "./api-ai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Visual feedback for AI breakdown / praise calls */
export type AiStatus = "idle" | "loading" | "success" | "fallback";
export type AiSource = "real" | "mock";

interface SparkleState {
  /* ---- diary entries ---- */
  logs: LogEntry[];
  loading: boolean;

  /* ---- current event being composed ---- */
  currentEvent: string;
  currentStartTime: string;
  currentEndTime: string;
  currentSteps: BreakdownStep[];

  /* ---- UI flags ---- */
  isBreakingDown: boolean;
  praisingStepId: string | null;

  /* ---- AI feedback ---- */
  breakdownStatus: AiStatus;
  breakdownSource: AiSource;
  breakdownError: string; // user-facing error snippet
  praiseStatus: AiStatus;
  praiseSource: AiSource;

  /* ---- settings ---- */
  settings: SparkleSettings | null;
  settingsLoaded: boolean;

  /* ---- actions ---- */
  loadLogs: () => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  setCurrentEvent: (text: string) => void;
  setCurrentStartTime: (time: string) => void;
  setCurrentEndTime: (time: string) => void;

  breakdownEvent: () => Promise<void>;
  updateStep: (stepId: string, content: string) => void;
  addStep: () => void;
  removeStep: (stepId: string) => void;
  generateStepPraise: (stepId: string) => Promise<void>;
  saveLog: () => Promise<void>;
  dismissBreakdownFeedback: () => void;

  loadSettings: () => Promise<void>;
  saveSettings: (s: SparkleSettings) => Promise<void>;
  exportAllData: () => Promise<void>;
  importAllData: (file: File) => Promise<{ logs: number; settings: boolean }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const nowHHMM = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const uid = (): string => crypto.randomUUID();

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSparkleStore = create<SparkleState>((set, get) => ({
  logs: [],
  loading: false,

  currentEvent: "",
  currentStartTime: "",
  currentEndTime: "",
  currentSteps: [],

  isBreakingDown: false,
  praisingStepId: null,

  breakdownStatus: "idle",
  breakdownSource: "mock",
  breakdownError: "",
  praiseStatus: "idle",
  praiseSource: "mock",

  settings: null,
  settingsLoaded: false,

  /* ---- actions ---- */

  loadLogs: async () => {
    set({ loading: true });
    const all = await db.logs.orderBy("createdAt").reverse().toArray();
    set({ logs: all, loading: false });
  },

  deleteLog: async (id) => {
    await db.logs.delete(id);
    await get().loadLogs();
  },

  setCurrentEvent: (text) => set({ currentEvent: text }),
  setCurrentStartTime: (time) => set({ currentStartTime: time }),
  setCurrentEndTime: (time) => set({ currentEndTime: time }),

  breakdownEvent: async () => {
    const { currentEvent, settings } = get();
    if (!currentEvent.trim()) return;

    set({
      isBreakingDown: true,
      breakdownStatus: "loading",
      breakdownError: "",
    });

    const useReal = settings?.useRealApi && settings?.apiKey;
    let steps: BreakdownStep[];
    let status: AiStatus = "success";
    let source: AiSource = "mock";
    let error = "";

    if (useReal) {
      source = "real";
      try {
        steps = await generateBreakdownReal(currentEvent, settings!);
        status = "success";
      } catch (err: unknown) {
        // Fall back to mock
        const msg =
          err instanceof Error ? err.message : "未知错误";
        error = msg;
        status = "fallback";
        steps = await generateBreakdown(currentEvent);
      }
    } else {
      steps = await generateBreakdown(currentEvent);
    }

    set({
      currentSteps: steps,
      isBreakingDown: false,
      breakdownStatus: status,
      breakdownSource: source,
      breakdownError: error,
    });
  },

  updateStep: (stepId, content) => {
    set((s) => ({
      currentSteps: s.currentSteps.map((st) =>
        st.id === stepId ? { ...st, content } : st
      ),
    }));
  },

  addStep: () => {
    set((s) => ({
      currentSteps: [
        ...s.currentSteps,
        { id: uid(), content: "", praise: "" },
      ],
    }));
  },

  removeStep: (stepId) => {
    set((s) => ({
      currentSteps: s.currentSteps.filter((st) => st.id !== stepId),
    }));
  },

  generateStepPraise: async (stepId) => {
    const step = get().currentSteps.find((s) => s.id === stepId);
    if (!step || !step.content.trim()) return;

    set({ praisingStepId: stepId, praiseStatus: "loading" });

    const { settings } = get();
    const useReal = settings?.useRealApi && settings?.apiKey;
    let praise: string;
    let pStatus: AiStatus = "success";
    let pSource: AiSource = "mock";

    if (useReal) {
      pSource = "real";
      try {
        praise = await generatePraiseReal(step.content, settings!);
        pStatus = "success";
      } catch {
        praise = await generatePraise(step.content);
        pStatus = "fallback";
      }
    } else {
      praise = await generatePraise(step.content);
    }

    set((s) => ({
      currentSteps: s.currentSteps.map((st) =>
        st.id === stepId ? { ...st, praise } : st
      ),
      praisingStepId: null,
      praiseStatus: pStatus,
      praiseSource: pSource,
    }));
  },

  saveLog: async () => {
    const { currentEvent, currentStartTime, currentEndTime, currentSteps } =
      get();

    const entry: Omit<LogEntry, "id"> = {
      date: today(),
      startTime: currentStartTime || nowHHMM(),
      endTime: currentEndTime || nowHHMM(),
      originalEvent: currentEvent,
      breakdownSteps: currentSteps,
      createdAt: new Date().toISOString(),
    };

    await db.logs.add(entry);
    await get().loadLogs();

    set({
      currentEvent: "",
      currentStartTime: "",
      currentEndTime: "",
      currentSteps: [],
      breakdownStatus: "idle",
      breakdownSource: "mock",
      breakdownError: "",
    });
  },

  dismissBreakdownFeedback: () => {
    set({ breakdownStatus: "idle", breakdownError: "" });
  },

  loadSettings: async () => {
    const s = await getSettings();
    set({ settings: s, settingsLoaded: true });
  },

  saveSettings: async (newSettings) => {
    await putSettings(newSettings);
    set({ settings: newSettings });
  },

  // ---- import / export ----

  exportAllData: async () => {
    const logs = await db.logs.toArray();
    const settings = await getSettings();
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      logs,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sparkle-log-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importAllData: async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.logs || !Array.isArray(data.logs)) {
      throw new Error("文件格式不正确，缺少 logs 数据");
    }
    let logCount = 0;
    for (const entry of data.logs) {
      const { id, ...rest } = entry;
      await db.logs.put(rest);
      logCount++;
    }
    if (data.settings) {
      await putSettings(data.settings);
      set({ settings: data.settings });
    }
    await get().loadLogs();
    return { logs: logCount, settings: !!data.settings };
  },
}));
