"use client";

import { useCallback, useEffect, useState } from "react";
import { MEMORY_ICONS } from "@/lib/constants";
import { recordMemoryBest, loadStats } from "@/lib/stats";
import { playFlip, playMatch, playWin } from "@/lib/sounds";
import { formatTime, shuffle } from "@/lib/utils";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import ResultBanner from "@/components/shared/ResultBanner";
import JimmycoinReward from "@/components/shared/JimmycoinReward";
import { WIN_REWARDS } from "@/lib/jimmycoin";

interface MemoryCard {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

function createBoard(): MemoryCard[] {
  const pairs = MEMORY_ICONS.flatMap((icon, i) => [
    { id: i * 2, icon, flipped: false, matched: false },
    { id: i * 2 + 1, icon, flipped: false, matched: false },
  ]);
  return shuffle(pairs);
}

export default function MemoryMatchGame() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [locked, setLocked] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | undefined>();
  const [bestTime, setBestTime] = useState<number | undefined>();

  const startGame = useCallback(() => {
    setCards(createBoard());
    setFlippedIndices([]);
    setMoves(0);
    setSeconds(0);
    setPlaying(true);
    setFinished(false);
    setLocked(false);
  }, []);

  useEffect(() => {
    const stats = loadStats();
    const mm = stats.games["memory-match"];
    if (mm.bestMoves !== undefined) setBestMoves(mm.bestMoves);
    if (mm.bestTime !== undefined) setBestTime(mm.bestTime);
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (!playing || finished) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [playing, finished]);

  const handleFlip = (index: number) => {
    if (locked || !playing || finished) return;
    const card = cards[index];
    if (card.flipped || card.matched) return;
    if (flippedIndices.length >= 2) return;

    playFlip();
    const newFlipped = [...flippedIndices, index];
    const newCards = cards.map((c, i) =>
      i === index ? { ...c, flipped: true } : c
    );
    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);

      const [a, b] = newFlipped;
      if (newCards[a].icon === newCards[b].icon) {
        playMatch();
        setTimeout(() => {
          const matched = newCards.map((c, i) =>
            i === a || i === b ? { ...c, matched: true } : c
          );
          setCards(matched);
          setFlippedIndices([]);
          setLocked(false);

          if (matched.every((c) => c.matched)) {
            setFinished(true);
            setPlaying(false);
            playWin();
            recordMemoryBest(moves + 1, seconds);
            setBestMoves((prev) =>
              prev === undefined || moves + 1 < prev ? moves + 1 : prev
            );
            setBestTime((prev) =>
              prev === undefined || seconds < prev ? seconds : prev
            );
          }
        }, 500);
      } else {
        setTimeout(() => {
          const reset = newCards.map((c, i) =>
            i === a || i === b ? { ...c, flipped: false } : c
          );
          setCards(reset);
          setFlippedIndices([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  return (
    <GameLayout title="Memory Match" subtitle="Flip pairs and match them all in the fewest moves.">
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="rounded-lg border border-lounge-border bg-lounge-surface/60 px-4 py-2 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-500">Moves</p>
            <p className="text-xl font-bold text-white">{moves}</p>
          </div>
          <div className="rounded-lg border border-lounge-border bg-lounge-surface/60 px-4 py-2 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-500">Time</p>
            <p className="text-xl font-bold text-white">{formatTime(seconds)}</p>
          </div>
          {(bestMoves !== undefined || bestTime !== undefined) && (
            <div className="rounded-lg border border-lounge-gold/30 bg-lounge-gold/10 px-4 py-2 text-center">
              <p className="text-xs uppercase tracking-widest text-lounge-gold">Best</p>
              <p className="text-sm font-bold text-lounge-gold-light">
                {bestMoves !== undefined && `${bestMoves} moves`}
                {bestMoves !== undefined && bestTime !== undefined && " · "}
                {bestTime !== undefined && formatTime(bestTime)}
              </p>
            </div>
          )}
        </div>

        <div className="perspective-1000 grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => handleFlip(index)}
              disabled={card.matched || card.flipped || locked}
              className={`card-flip relative aspect-square w-full rounded-xl ${
                card.flipped || card.matched ? "flipped" : ""
              } ${card.matched ? "opacity-60" : ""}`}
              aria-label={card.flipped || card.matched ? card.icon : "Hidden card"}
            >
              <div className="card-face flex items-center justify-center rounded-xl border-2 border-lounge-gold/30 bg-gradient-to-br from-lounge-red/80 to-lounge-red">
                <span className="text-lounge-gold/60 text-xl">✦</span>
              </div>
              <div className="card-face card-back flex items-center justify-center rounded-xl border-2 border-lounge-gold/40 bg-lounge-surface text-2xl sm:text-3xl">
                {card.icon}
              </div>
            </button>
          ))}
        </div>

        {finished && (
          <div className="space-y-4">
            <ResultBanner
              result="win"
              message={`Completed in ${moves} moves · ${formatTime(seconds)}`}
            >
              <JimmycoinReward amount={WIN_REWARDS["memory-match"]} />
            </ResultBanner>
            <div className="flex justify-center">
              <GameButton onClick={startGame} variant="gold">
                Play Again
              </GameButton>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
