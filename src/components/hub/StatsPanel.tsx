"use client";

import { useEffect, useState } from "react";
import { loadStats } from "@/lib/stats";
import { GAMES } from "@/lib/constants";
import type { AllStats } from "@/lib/types";
import { formatDashTime, formatTime } from "@/lib/utils";

export default function StatsPanel() {
  const [stats, setStats] = useState<AllStats | null>(null);

  useEffect(() => {
    setStats(loadStats());
  }, []);

  if (!stats) return null;

  const hasActivity = stats.totalGamesPlayed > 0;

  return (
    <section className="animate-fade-in rounded-2xl border border-lounge-border bg-lounge-surface/50 p-5 backdrop-blur-sm">
      <h2 className="mb-4 font-display text-lg font-semibold text-lounge-gold">
        Your Stats
      </h2>

      {!hasActivity ? (
        <p className="text-sm text-gray-500">
          No games played yet — pick a game to get started!
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-lounge-charcoal/60 px-4 py-2">
            <span className="text-sm text-gray-400">Total games played</span>
            <span className="font-semibold text-white">{stats.totalGamesPlayed}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {GAMES.map((game) => {
              const gs = stats.games[game.id];
              if (gs.gamesPlayed === 0) return null;

              return (
                <div
                  key={game.id}
                  className="rounded-lg border border-lounge-border/50 bg-lounge-charcoal/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span>{game.icon}</span>
                    <span className="text-sm font-medium text-gray-300">{game.name}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
                    <span>{gs.gamesPlayed} played</span>
                    {gs.wins + gs.losses + gs.ties > 0 && (
                      <span>
                        {gs.wins}W / {gs.losses}L
                        {gs.ties > 0 ? ` / ${gs.ties}T` : ""}
                      </span>
                    )}
                    {game.id === "memory-match" && gs.bestMoves !== undefined && (
                      <span>
                        Best: {gs.bestMoves} moves
                        {gs.bestTime !== undefined && ` · ${formatTime(gs.bestTime)}`}
                      </span>
                    )}
                    {game.id === "neon-dash" && gs.bestTime !== undefined && (
                      <span>Best survival: {formatDashTime(gs.bestTime)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
