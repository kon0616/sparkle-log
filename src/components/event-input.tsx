"use client";

import { useSparkleStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BreakdownStepRow, AddStepButton } from "./breakdown-step";
import {
  Wand2,
  Save,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline feedback banner shown after AI breakdown completes.
 */
function BreakdownFeedback() {
  const status = useSparkleStore((s) => s.breakdownStatus);
  const source = useSparkleStore((s) => s.breakdownSource);
  const error = useSparkleStore((s) => s.breakdownError);
  const dismiss = useSparkleStore((s) => s.dismissBreakdownFeedback);

  if (status === "idle" || status === "loading") return null;

  const isFallback = status === "fallback";

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm animate-in fade-in slide-in-from-top-1 duration-200",
        isFallback
          ? "bg-amber-50 text-amber-800 border border-amber-200"
          : "bg-emerald-50 text-emerald-800 border border-emerald-200"
      )}
    >
      {isFallback ? (
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
      )}

      <div className="flex-1 space-y-0.5">
        <p className="font-medium leading-tight">
          {isFallback
            ? "API 调用失败，已回退到本地模拟"
            : `✨ 闪光点提取完成 · ${source === "real" ? "真实 API" : "本地模拟"}`}
        </p>
        {isFallback && error && (
          <p className="text-xs text-amber-600/80 leading-relaxed break-all">
            {error}
          </p>
        )}
        {!isFallback && (
          <p className="text-xs text-emerald-600/80">
            {source === "real"
              ? "已调用你配置的大模型接口"
              : "当前使用内置模拟数据，可在设置中切换"}
          </p>
        )}
      </div>

      <Button
        size="icon-xs"
        variant="ghost"
        onClick={dismiss}
        className={cn(
          "shrink-0 -mr-1",
          isFallback
            ? "text-amber-600 hover:bg-amber-100"
            : "text-emerald-600 hover:bg-emerald-100"
        )}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

/**
 * The main event-input card — "刚才发生了什么？"
 */
export function EventInput() {
  const currentEvent = useSparkleStore((s) => s.currentEvent);
  const currentStartTime = useSparkleStore((s) => s.currentStartTime);
  const currentEndTime = useSparkleStore((s) => s.currentEndTime);
  const currentSteps = useSparkleStore((s) => s.currentSteps);
  const isBreakingDown = useSparkleStore((s) => s.isBreakingDown);
  const breakdownStatus = useSparkleStore((s) => s.breakdownStatus);
  const settings = useSparkleStore((s) => s.settings);

  const setCurrentEvent = useSparkleStore((s) => s.setCurrentEvent);
  const setCurrentStartTime = useSparkleStore((s) => s.setCurrentStartTime);
  const setCurrentEndTime = useSparkleStore((s) => s.setCurrentEndTime);
  const breakdownEvent = useSparkleStore((s) => s.breakdownEvent);
  const saveLog = useSparkleStore((s) => s.saveLog);

  const canSave = currentEvent.trim() && currentSteps.length > 0;
  const useReal = settings?.useRealApi && settings?.apiKey;

  return (
    <Card className="border-soft/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground/90">
          <span role="img" aria-label="sparkle" className="text-xl">
            &#10024;
          </span>
          刚才发生了什么？
        </CardTitle>
        <CardDescription>
          记下任何一个瞬间。哪怕它看起来很小，也藏着你没注意到的努力。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event text area */}
        <Textarea
          value={currentEvent}
          onChange={(e) => setCurrentEvent(e.target.value)}
          placeholder="比如：今天出门散了步、给自己做了顿饭、或者只是从床上坐起来了……"
          className="min-h-20 border-soft bg-soft/50 placeholder:text-muted-foreground/60 resize-none"
        />

        {/* Time inputs */}
        <div className="flex items-center gap-3">
          <Clock className="size-4 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Input
              type="time"
              value={currentStartTime}
              onChange={(e) => setCurrentStartTime(e.target.value)}
              className="w-32 h-7 text-xs border-soft bg-soft/50"
            />
            <span>至</span>
            <Input
              type="time"
              value={currentEndTime}
              onChange={(e) => setCurrentEndTime(e.target.value)}
              className="w-32 h-7 text-xs border-soft bg-soft/50"
            />
          </div>
        </div>

        {/* AI breakdown button */}
        <div className="space-y-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!currentEvent.trim() || isBreakingDown}
            onClick={breakdownEvent}
            className="w-full gap-2 bg-soft hover:bg-soft/80 text-soft-foreground"
          >
            {isBreakingDown ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {useReal ? "正在调用 API 提取…" : "正在提取闪光点…"}
              </>
            ) : (
              <>
                {useReal ? (
                  <Zap className="size-4" />
                ) : (
                  <Wand2 className="size-4" />
                )}
                {useReal ? "✨ 提取闪光点 (API)" : "✨ 提取闪光点"}
              </>
            )}
          </Button>

          {/* Subtle hint about current AI source */}
          <p className="text-[11px] text-muted-foreground/60 text-center">
            {useReal
              ? `当前使用：${settings?.modelName ?? "API"}`
              : "当前使用：本地模拟 · 可在设置中切换为真实 API"}
          </p>
        </div>

        {/* Feedback banner */}
        {breakdownStatus !== "idle" && breakdownStatus !== "loading" && (
          <BreakdownFeedback />
        )}

        {/* Editable bright-spot insights */}
        {currentSteps.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-medium text-muted-foreground">
              值得被看见的闪光点（可直接修改或添加）：
            </p>

            {currentSteps.map((step, i) => (
              <BreakdownStepRow
                key={step.id}
                index={i}
                stepId={step.id}
                content={step.content}
              />
            ))}

            <AddStepButton />

            {/* Save button */}
            <Button
              onClick={saveLog}
              disabled={!canSave}
              className="w-full gap-2 bg-warm hover:bg-warm/90 text-warm-foreground transition-all"
            >
              <Save className="size-4" />
              保存记录
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
