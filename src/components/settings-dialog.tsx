"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSparkleStore } from "@/lib/store";
import type { SparkleSettings } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Eye, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-out settings panel.
 * EVERY change is persisted immediately to Dexie — no "save" button needed.
 * The API config you enter stays forever until you change it.
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const storeSettings = useSparkleStore((s) => s.settings);
  const saveSettings = useSparkleStore((s) => s.saveSettings);

  const [local, setLocal] = useState<SparkleSettings>({
    apiBaseUrl: "https://api.openai.com/v1",
    apiKey: "",
    modelName: "gpt-4o-mini",
    useRealApi: false,
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Hydrate from store when panel opens
  useEffect(() => {
    if (open && storeSettings) {
      setLocal({ ...storeSettings });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-persist on every change (debounced 400ms)
  const persist = useCallback(
    (next: SparkleSettings) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await saveSettings(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }, 400);
    },
    [saveSettings]
  );

  const update = (patch: Partial<SparkleSettings>) => {
    setLocal((prev) => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  };

  // Save on close (X, backdrop, Escape) — no data loss
  const handleClose = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveSettings(local);
    onClose();
  }, [local, saveSettings, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  // Flush debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — closes and auto-saves */}
      <div
        className="fixed inset-0 z-40 bg-black/15 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[calc(100vw-2rem)]",
          "bg-card text-card-foreground shadow-2xl",
          "animate-in slide-in-from-right duration-300",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium">设置</h2>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 animate-in fade-in duration-150">
                <Check className="size-3" />
                已保存
              </span>
            )}
          </div>
          <Button size="icon-xs" variant="ghost" onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Toggle: real or mock */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-foreground/80">
              {local.useRealApi ? "使用真实 API" : "使用模拟数据"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={local.useRealApi}
              onClick={() => update({ useRealApi: !local.useRealApi })}
              className={cn(
                "relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                local.useRealApi ? "bg-warm" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform",
                  local.useRealApi ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </label>

          <p className="text-xs text-muted-foreground leading-relaxed">
            所有设置自动保存。API 密钥仅存于本地，只发往你填写的端点。
          </p>

          {/* API Base URL */}
          <fieldset disabled={!local.useRealApi} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              API 基础地址
            </label>
            <Input
              value={local.apiBaseUrl}
              onChange={(e) => update({ apiBaseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="h-8 text-sm border-soft bg-soft/50"
            />
          </fieldset>

          {/* API Key */}
          <fieldset disabled={!local.useRealApi} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              API 密钥
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={local.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="h-8 pr-8 text-sm border-soft bg-soft/50"
              />
              <Button
                size="icon-xs"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowKey((v) => !v)}
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </Button>
            </div>
          </fieldset>

          {/* Model name */}
          <fieldset disabled={!local.useRealApi} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              模型名称
            </label>
            <Input
              value={local.modelName}
              onChange={(e) => update({ modelName: e.target.value })}
              placeholder="gpt-4o-mini"
              className="h-8 text-sm border-soft bg-soft/50"
            />
          </fieldset>
        </div>

        {/* Import / Export */}
        <div className="px-5 py-4 border-t border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground">数据备份</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 text-xs"
              onClick={() => {
                useSparkleStore.getState().exportAllData();
              }}
            >
              导出数据
            </Button>
            <label className="flex-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs"
                onClick={() => {
                  document.getElementById("import-file-input")?.click();
                }}
              >
                导入数据
              </Button>
              <input
                id="import-file-input"
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const result = await useSparkleStore
                      .getState()
                      .importAllData(file);
                    alert(
                      `导入成功：${result.logs} 条日志` +
                        (result.settings ? " + 设置" : "")
                    );
                  } catch (err: unknown) {
                    alert(
                      "导入失败：" +
                        (err instanceof Error ? err.message : "未知错误")
                    );
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            导出会把所有日志和设置保存为文件。导入会追加到当前数据中，不会覆盖已有记录。
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border">
          <Button
            size="sm"
            onClick={handleClose}
            className="flex-1"
            variant="secondary"
          >
            关闭
          </Button>
        </div>
      </div>
    </>
  );
}
