"use client";

import { useState } from "react";
import Link from "next/link";
import { Expand, LayoutDashboard, Minimize, MonitorPlay, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PresentationToolbar({ presentMode }: { presentMode: boolean }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      return;
    }

    await document.exitFullscreen();
    setIsFullscreen(false);
  }

  return (
    <div className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-slate-950/85 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={presentMode ? "/showcase" : "/showcase?mode=present"}>
          <Button variant={presentMode ? "secondary" : "default"} size="sm">
            <MonitorPlay className="mr-2 h-4 w-4" />
            {presentMode ? "Mode normal" : "Present mode"}
          </Button>
        </Link>
        <Button size="sm" variant="outline" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </Button>
        <a href="#metrics">
          <Button variant="ghost" size="sm">
            Metrics
          </Button>
        </a>
        <a href="#impact">
          <Button variant="ghost" size="sm">
            Impact
          </Button>
        </a>
        <a href="#story">
          <Button variant="ghost" size="sm">
            Story
          </Button>
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <div className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
          <Sparkles className="mr-2 inline h-3.5 w-3.5" />
          Pitch-ready controls
        </div>
      </div>
    </div>
  );
}
