"use client";

import Link from "next/link";
import type { GameInfo } from "@/lib/types";
import { playClick } from "@/lib/sounds";

const accentStyles = {
  red: {
    border: "border-lounge-red/30 hover:border-lounge-red/60",
    glow: "card-glow-red",
    badge: "text-lounge-red-light",
    button: "bg-lounge-red/20 text-lounge-red-light group-hover:bg-lounge-red group-hover:text-white",
  },
  gold: {
    border: "border-lounge-gold/30 hover:border-lounge-gold/60",
    glow: "card-glow-gold",
    badge: "text-lounge-gold",
    button: "bg-lounge-gold/20 text-lounge-gold-light group-hover:bg-lounge-gold group-hover:text-black",
  },
  green: {
    border: "border-lounge-green/30 hover:border-lounge-green/60",
    glow: "card-glow-green",
    badge: "text-lounge-green",
    button: "bg-lounge-green/20 text-lounge-green group-hover:bg-lounge-green group-hover:text-black",
  },
  purple: {
    border: "border-violet-400/30 hover:border-violet-400/60",
    glow: "card-glow-purple",
    badge: "text-violet-300",
    button: "bg-violet-500/20 text-violet-200 group-hover:bg-violet-500 group-hover:text-white",
  },
};

const staggerDelays = ["0.05s", "0.1s", "0.15s", "0.2s", "0.25s", "0.3s", "0.35s"];

interface GameCardProps {
  game: GameInfo;
  index: number;
}

export default function GameCard({ game, index }: GameCardProps) {
  const style = accentStyles[game.accent];

  return (
    <Link
      href={game.href}
      onClick={() => playClick()}
      className={`group animate-slide-up opacity-0 flex flex-col rounded-2xl border bg-lounge-surface/70 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${style.border} ${style.glow}`}
      style={{ animationFillMode: "forwards", animationDelay: staggerDelays[index] ?? "0s" }}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-4xl">{game.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-widest ${style.badge}`}>
          Play
        </span>
      </div>
      <h3 className="font-display text-xl font-bold text-white">{game.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">
        {game.description}
      </p>
      <div className="mt-4">
        <span
          className={`inline-block rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${style.button}`}
        >
          Play →
        </span>
      </div>
    </Link>
  );
}
