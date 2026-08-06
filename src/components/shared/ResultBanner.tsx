"use client";

import { ReactNode } from "react";

interface ResultBannerProps {
  result: "win" | "loss" | "tie" | "bust" | null;
  message?: string;
  children?: ReactNode;
}

const config = {
  win: { text: "You Win!", color: "text-lounge-green border-lounge-green/40 bg-lounge-green/10" },
  loss: { text: "You Lose", color: "text-lounge-red-light border-lounge-red/40 bg-lounge-red/10" },
  tie: { text: "It's a Tie", color: "text-lounge-gold border-lounge-gold/40 bg-lounge-gold/10" },
  bust: { text: "Bust!", color: "text-lounge-red-light border-lounge-red/40 bg-lounge-red/10" },
};

export default function ResultBanner({ result, message, children }: ResultBannerProps) {
  if (!result) return null;
  const { text, color } = config[result];

  return (
    <div className={`animate-slide-up rounded-xl border px-6 py-4 text-center ${color}`}>
      <p className="text-xl font-bold">{message || text}</p>
      {children && <div className="mt-2 text-sm opacity-80">{children}</div>}
    </div>
  );
}
