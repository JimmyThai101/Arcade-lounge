import type { GameId, GameInfo, AllStats, GameStats } from "./types";

export const GAMES: GameInfo[] = [
  {
    id: "make-21",
    name: "Make 21",
    description: "Draw cards and get as close to 21 as you can without going over.",
    icon: "🃏",
    href: "/games/make-21",
    accent: "red",
  },
  {
    id: "rock-paper-scissors",
    name: "Rock Paper Scissors",
    description: "Classic showdown — pick your move and beat the computer.",
    icon: "✊",
    href: "/games/rock-paper-scissors",
    accent: "gold",
  },
  {
    id: "high-card",
    name: "High Card",
    description: "Draw one card each — highest value takes the round.",
    icon: "🎴",
    href: "/games/high-card",
    accent: "red",
  },
  {
    id: "dice-duel",
    name: "Dice Duel",
    description: "Roll two dice against the computer — highest total wins.",
    icon: "🎲",
    href: "/games/dice-duel",
    accent: "green",
  },
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Flip pairs of cards and match them all in the fewest moves.",
    icon: "🧠",
    href: "/games/memory-match",
    accent: "gold",
  },
];

export const DEFAULT_GAME_STATS: GameStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  ties: 0,
};

export const DEFAULT_ALL_STATS: AllStats = {
  totalGamesPlayed: 0,
  games: {
    "make-21": { ...DEFAULT_GAME_STATS },
    "rock-paper-scissors": { ...DEFAULT_GAME_STATS },
    "high-card": { ...DEFAULT_GAME_STATS },
    "dice-duel": { ...DEFAULT_GAME_STATS },
    "memory-match": { ...DEFAULT_GAME_STATS, bestMoves: undefined, bestTime: undefined },
  },
};

export const STORAGE_KEY = "arcade-lounge-stats";
export const MUTE_KEY = "arcade-lounge-muted";

export const CARD_SUITS = ["♠", "♥", "♦", "♣"] as const;
export const CARD_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export const MEMORY_ICONS = ["🎰", "🎯", "⭐", "💎", "🔔", "🍀", "🎪", "🎭"];

export function getGameById(id: GameId): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}
