import type { AllStats, GameId, GameStats } from "./types";
import { DEFAULT_ALL_STATS, STORAGE_KEY } from "./constants";
import { addJimmycoin, WIN_REWARDS } from "./jimmycoin";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadStats(): AllStats {
  if (!isBrowser()) return DEFAULT_ALL_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ALL_STATS;
    const parsed = JSON.parse(raw) as AllStats;
    return {
      ...DEFAULT_ALL_STATS,
      ...parsed,
      games: {
        ...DEFAULT_ALL_STATS.games,
        ...parsed.games,
      },
    };
  } catch {
    return DEFAULT_ALL_STATS;
  }
}

export function saveStats(stats: AllStats): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function recordGameResult(
  gameId: GameId,
  result: "win" | "loss" | "tie"
): GameStats {
  const stats = loadStats();
  const game = { ...stats.games[gameId] };
  game.gamesPlayed += 1;
  if (result === "win") game.wins += 1;
  else if (result === "loss") game.losses += 1;
  else game.ties += 1;
  stats.totalGamesPlayed += 1;
  stats.games[gameId] = game;
  saveStats(stats);

  if (result === "win" && gameId in WIN_REWARDS) {
    addJimmycoin(WIN_REWARDS[gameId as keyof typeof WIN_REWARDS]);
  }

  return game;
}

export function recordMemoryBest(moves: number, timeSeconds: number): void {
  const stats = loadStats();
  const game = { ...stats.games["memory-match"] };
  game.gamesPlayed += 1;
  game.wins += 1;
  if (game.bestMoves === undefined || moves < game.bestMoves) {
    game.bestMoves = moves;
  }
  if (game.bestTime === undefined || timeSeconds < game.bestTime) {
    game.bestTime = timeSeconds;
  }
  stats.totalGamesPlayed += 1;
  stats.games["memory-match"] = game;
  saveStats(stats);
  addJimmycoin(WIN_REWARDS["memory-match"]);
}

export function incrementGamesPlayed(gameId: GameId): void {
  const stats = loadStats();
  stats.games[gameId].gamesPlayed += 1;
  stats.totalGamesPlayed += 1;
  saveStats(stats);
}
