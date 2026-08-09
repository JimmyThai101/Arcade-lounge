"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface LeaderboardPlayer {
  rank: number;
  username: string;
  image: string | null;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
}

interface LeaderboardResponse {
  configured: boolean;
  players: LeaderboardPlayer[];
  message?: string;
}

export default function Leaderboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  const load = () => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((json: LeaderboardResponse) => setData(json))
      .catch(() =>
        setData({
          configured: false,
          players: [],
          message: "Could not load leaderboard.",
        })
      );
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [session?.user?.wins, session?.user?.username]);

  return (
    <section className="mb-10 animate-fade-in rounded-2xl border border-lounge-border bg-lounge-surface/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-lounge-gold">Global Leaderboard</h2>
          <p className="mt-1 text-xs text-gray-500">
            Sign in with Google, pick a clean username, and climb the wins chart.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="text-xs text-gray-500 hover:text-lounge-gold"
        >
          Refresh
        </button>
      </div>

      {!data ? (
        <p className="text-sm text-gray-500">Loading standings…</p>
      ) : !data.configured ? (
        <p className="text-sm text-gray-500">
          {data.message || "Leaderboard unlocks after Google sign-in is configured."}
        </p>
      ) : data.players.length === 0 ? (
        <p className="text-sm text-gray-500">
          No ranked players yet — sign in, set a username, and win some games.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-lounge-border/80 text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-2 font-medium">#</th>
                <th className="pb-2 pr-2 font-medium">Player</th>
                <th className="pb-2 pr-2 font-medium text-right">W</th>
                <th className="pb-2 pr-2 font-medium text-right">L</th>
                <th className="pb-2 pr-2 font-medium text-right">T</th>
                <th className="pb-2 font-medium text-right">Played</th>
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
                    className={`border-b border-lounge-border/40 ${
                      isYou ? "bg-lounge-gold/10" : ""
                    }`}
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
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-lounge-charcoal text-[10px] text-gray-400">
                            {player.username.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className={`font-medium ${isYou ? "text-lounge-gold-light" : "text-white"}`}>
                          {player.username}
                          {isYou ? " (you)" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums text-lounge-green">
                      {player.wins}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums text-lounge-red-light">
                      {player.losses}
                    </td>
                    <td className="py-2.5 pr-2 text-right tabular-nums text-gray-400">
                      {player.ties}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-gray-300">
                      {player.gamesPlayed}
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
