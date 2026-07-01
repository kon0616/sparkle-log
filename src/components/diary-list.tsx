"use client";

import { useEffect, useState } from "react";
import { useSparkleStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreakdownStepRow } from "./breakdown-step";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarDays, Clock, Trash2, Loader2 } from "lucide-react";

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "今天";
  if (isYesterday(d)) return "昨天";
  return format(d, "M月d日 EEEE", { locale: zhCN });
}

/**
 * Diary stream — all saved entries grouped by date, newest first.
 */
export function DiaryList() {
  const logs = useSparkleStore((s) => s.logs);
  const loading = useSparkleStore((s) => s.loading);
  const loadLogs = useSparkleStore((s) => s.loadLogs);
  const deleteLog = useSparkleStore((s) => s.deleteLog);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    await deleteLog(id);
    setDeletingId(null);
  };

  // Group logs by date
  const grouped = logs.reduce<Record<string, (typeof logs)[number][]>>(
    (acc, log) => {
      const label = dateLabel(log.date);
      if (!acc[label]) acc[label] = [];
      acc[label].push(log);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse border-soft/50">
            <CardContent className="p-6 space-y-3">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-3/4 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <span className="text-4xl" role="img" aria-label="notebook">
          &#128214;
        </span>
        <p className="text-muted-foreground text-sm">
          还没有记录。写下你的第一个瞬间吧。
        </p>
        <p className="text-muted-foreground/60 text-xs">
          哪怕只是「今天从床上坐起来了」，也值得被看见。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([label, entries]) => (
        <section key={label}>
          {/* Date header */}
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">
              {label}
            </h2>
          </div>

          {/* Entries for this date */}
          <div className="space-y-3">
            {entries.map((entry) => {
              const isDeleting = deletingId === entry.id;
              return (
                <Card
                  key={entry.id}
                  className="border-soft/60 shadow-none hover:shadow-sm transition-shadow group/log"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1.5">
                        <CardTitle className="text-sm font-normal text-foreground/80 leading-relaxed">
                          {entry.originalEvent}
                        </CardTitle>
                        {/* Time block */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span>
                            {entry.startTime} — {entry.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={isDeleting}
                        onClick={() =>
                          entry.id != null && handleDelete(entry.id)
                        }
                        className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover/log:opacity-100 transition-all shrink-0"
                        title="删除记录"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 pb-4">
                    {entry.breakdownSteps.map((step, i) => (
                      <BreakdownStepRow
                        key={step.id}
                        index={i}
                        stepId={step.id}
                        content={step.content}
                        readonly
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
