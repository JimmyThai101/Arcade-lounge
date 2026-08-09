export type GameId =
  | "make-21"
  | "rock-paper-scissors"
  | "high-card"
  | "dice-duel"
  | "memory-match"
  | "slots";

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  href: string;
  accent: "red" | "gold" | "green";
}

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  highScore?: number;
  bestMoves?: number;
  bestTime?: number;
}

export interface AllStats {
  totalGamesPlayed: number;
  games: Record<GameId, GameStats>;
}

export type RPSChoice = "rock" | "paper" | "scissors";

export interface PlayingCard {
  suit: "♠" | "♥" | "♦" | "♣";
  value: number;
  display: string;
}

export type GamePhase = "idle" | "playing" | "revealing" | "finished";
