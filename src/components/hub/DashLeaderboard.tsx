"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { formatDashTime } from "@/lib/utils";

interface DashPlayer {
  rank: number;
  username: string;
  image: string | null;
  bestTime: number;
}

interface DashLeaderboardResponse {
  configured: boolean;
  players: DashPlayer[];
  message?: string;
}

export default function DashLeaderboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashLeaderboardResponse | null>(null);

  const load = () => {
    fetch("/api/leaderboard/dash")
      .then((r) => r.json())
      .then((json: DashLeaderboardResponse) => setData(json))
      .catch(() =>
        setData({
          configured: false,
          players: [],
          message: "Could not load Neon Dash leaderboard.",
        })
      );
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [session?.user?.username]);

  return (
    <section className="mb-10 animate-fade-in rounded-2xl border border-violet-400/25 bg-violet-950/20 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-violet-300">
            Neon Dash — Time Leaderboard
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Separate from wins — ranked by longest survival time. Free play, no Jimmycoin.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-xs text-gray-500 hover:text-violet-300"
        >
          Refresh
        </button>
      </div>

      {!data ? (
        <p className="text-sm text-gray-500">Loading times…</p>
      ) : !data.configured ? (
        <p className="text-sm text-gray-500">
          {data.message || "Leaderboard unlocks after sign-in is configured."}
        </p>
      ) : data.players.length === 0 ? (
        <p className="text-sm text-gray-500">
          No times yet — sign in, set a username, and survive a Neon Dash run.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-violet-400/20 text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-2 font-medium">Player</th>
                <th className="pb-2 font-medium text-right">Best time</th>
              </tr>
            </thead>
            <tbody>
              {data.players.map((player) => {
                const isYou =
                  !!session?.user?.username &&
                  session.user.username.toLowerCase() === player.username.toLowerCase();
                return (
                  <tr
                    key={player.username}
                    className={`border-b border-violet-400/10 ${isYou ? "bg-violet-500/10" : ""}`}
                  >
                    <td className="py-2.5 pr-2 tabular-nums text-gray-400">{player.rank}</td>
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        {player.image ? (
                          <Image
                            src={player.image}
                            alt=""
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-900/60 text-[10px] text-violet-200">
                            {player.username.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`font-medium ${isYou ? "text-violet-200" : "text-white"}`}
                        >
                          {player.username}
                          {isYou ? " (you)" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-violet-200">
                      {formatDashTime(player.bestTime)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
