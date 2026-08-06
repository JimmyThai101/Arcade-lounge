"use client";

import { ReactNode } from "react";

interface ScoreBoardProps {
  label: string;
  wins: number;
  losses: number;
  ties?: number;
  extra?: ReactNode;
}

export default function ScoreBoard({ label, wins, losses, ties = 0, extra }: ScoreBoardProps) {
  return (
    <div className="rounded-xl border border-lounge-border bg-lounge-surface/60 px-4 py-3 text-center backdrop-blur-sm">
      <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-lounge-green">
          W <strong className="text-base">{wins}</strong>
        </span>
        <span className="text-gray-600">|</span>
        <span className="text-lounge-red-light">
          L <strong className="text-base">{losses}</strong>
        </span>
        {ties > 0 && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-gray-400">
              T <strong className="text-base">{ties}</strong>
            </span>
          </>
        )}
      </div>
      {extra && <div className="mt-2 text-xs text-gray-400">{extra}</div>}
    </div>
  );
}
