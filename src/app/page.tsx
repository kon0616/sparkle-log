"use client";

import { useEffect, useState } from "react";
import { useSparkleStore } from "@/lib/store";
import { EventInput } from "@/components/event-input";
import { DiaryList } from "@/components/diary-list";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function Home() {
  const loadSettings = useSparkleStore((s) => s.loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full px-4 py-8 gap-8">
      {/* Brand header */}
      <header className="relative flex items-center justify-center pb-2">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">
            <span role="img" aria-label="sparkle" className="mr-1.5">
              &#10024;
            </span>
            Sparkle Log
          </h1>
          <p className="text-sm text-muted-foreground">
            闪光日记 — 每一个微小的行动，都值得被看见
          </p>
        </div>

        {/* Settings gear */}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-0 text-muted-foreground hover:text-foreground"
          title="设置"
        >
          <Settings className="size-4" />
        </Button>
      </header>

      {/* Event input card */}
      <EventInput />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground/60">过往记录</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Diary stream */}
      <DiaryList />

      {/* Settings panel */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
