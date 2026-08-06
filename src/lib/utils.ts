import type { PlayingCard } from "./types";
import { CARD_SUITS, CARD_VALUES } from "./constants";

export function cardNumericValue(value: string): number {
  if (value === "A") return 11;
  if (value === "K" || value === "Q" || value === "J") return 10;
  return parseInt(value, 10);
}

export function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of CARD_SUITS) {
    for (const value of CARD_VALUES) {
      deck.push({
        suit,
        value: cardNumericValue(value),
        display: value,
      });
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawCard(deck: PlayingCard[]): [PlayingCard, PlayingCard[]] {
  const [card, ...rest] = deck;
  return [card, rest];
}

export function isRedSuit(suit: string): boolean {
  return suit === "♥" || suit === "♦";
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
