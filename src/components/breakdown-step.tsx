"use client";

import { useSparkleStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakdownStepProps {
  index: number;
  stepId: string;
  content: string;
  /** If true, renders as a read-only display (past entries) */
  readonly?: boolean;
}

/**
 * A single editable bright-spot insight.
 *
 * RED LINE: Every insight is rendered as an editable Input — never read-only text
 * unless the entire entry is in display mode (past logs).
 */
export function BreakdownStepRow({
  index,
  stepId,
  content,
  readonly = false,
}: BreakdownStepProps) {
  const updateStep = useSparkleStore((s) => s.updateStep);
  const removeStep = useSparkleStore((s) => s.removeStep);

  return (
    <div className="group/step">
      <div className="flex items-start gap-2">
        {/* Number badge */}
        <span
          className={cn(
            "mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
            "bg-warm/15 text-warm"
          )}
        >
          {index + 1}
        </span>

        {/* Editable input — ALWAYS an Input, never static text */}
        {readonly ? (
          <p className="flex-1 py-1 text-sm text-foreground/80">{content}</p>
        ) : (
          <Input
            value={content}
            onChange={(e) => updateStep(stepId, e.target.value)}
            placeholder={`闪光点 ${index + 1}…`}
            className="flex-1 border-soft bg-soft/50 text-sm placeholder:text-muted-foreground/60"
          />
        )}

        {/* Delete button */}
        {!readonly && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => removeStep(stepId)}
            className="shrink-0 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover/step:opacity-100 transition-opacity"
            title="删除此闪光点"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * "Add bright spot" button — always available so the user can add their own.
 */
export function AddStepButton() {
  const addStep = useSparkleStore((s) => s.addStep);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={addStep}
      className="ml-7 text-muted-foreground hover:text-foreground gap-1.5"
    >
      <Plus className="size-3.5" />
      <span className="text-xs">添加闪光点</span>
    </Button>
  );
}
