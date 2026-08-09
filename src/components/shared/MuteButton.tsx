"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted, playClick } from "@/lib/sounds";

export default function MuteButton() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const toggle = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (!next) playClick();
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lounge-border bg-lounge-surface/80 text-lg backdrop-blur-sm transition-all duration-200 hover:border-lounge-gold hover:text-lounge-gold"
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
