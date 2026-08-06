"use client";

import type { PlayingCard as PlayingCardType } from "@/lib/types";
import { isRedSuit } from "@/lib/utils";

interface PlayingCardProps {
  card?: PlayingCardType;
  faceDown?: boolean;
  className?: string;
  animate?: boolean;
  small?: boolean;
}

export default function PlayingCard({
  card,
  faceDown = false,
  className = "",
  animate = false,
  small = false,
}: PlayingCardProps) {
  const size = small ? "h-24 w-16 sm:h-28 sm:w-20" : "h-32 w-20 sm:h-36 sm:w-24";

  if (faceDown || !card) {
    return (
      <div
        className={`${size} flex items-center justify-center rounded-lg border-2 border-lounge-gold/30 bg-gradient-to-br from-lounge-red/80 to-lounge-red text-2xl shadow-lg ${animate ? "animate-deal" : ""} ${className}`}
      >
        <span className="text-lounge-gold opacity-60">✦</span>
      </div>
    );
  }

  const red = isRedSuit(card.suit);

  return (
    <div
      className={`${size} flex flex-col items-center justify-between rounded-lg border border-gray-300/20 bg-white p-2 shadow-lg ${animate ? "animate-deal" : ""} ${className}`}
    >
      <span className={`text-sm font-bold ${red ? "text-red-600" : "text-gray-900"}`}>
        {card.display}
        {card.suit}
      </span>
      <span className={`text-2xl ${red ? "text-red-600" : "text-gray-900"}`}>
        {card.suit}
      </span>
      <span className={`text-sm font-bold rotate-180 ${red ? "text-red-600" : "text-gray-900"}`}>
        {card.display}
        {card.suit}
      </span>
    </div>
  );
}
