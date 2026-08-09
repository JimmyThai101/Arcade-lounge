"use client";

import { useEffect, useRef, useState } from "react";
import { randomInt } from "@/lib/utils";
import { recordGameResult } from "@/lib/stats";
import { playRoll, playWin, playLose, playMatch } from "@/lib/sounds";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import ScoreBoard from "@/components/shared/ScoreBoard";
import ResultBanner from "@/components/shared/ResultBanner";

const SYMBOLS = ["7", "★", "◆", "●", "▲", "♣"] as const;
type Symbol = (typeof SYMBOLS)[number];

const REEL_COUNT = 3;
const SPIN_TICKS = [10, 14, 18];

function pickSymbol(): Symbol {
  return SYMBOLS[randomInt(0, SYMBOLS.length - 1)];
}

function evaluate(reels: Symbol[]): { result: "win" | "loss"; message: string } {
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    if (reels[0] === "7") {
      return { result: "win", message: "Triple 7s — jackpot!" };
    }
    return { result: "win", message: `Three ${reels[0]}s — you win!` };
  }
  if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    return { result: "win", message: "A pair lands — small win!" };
  }
  return { result: "loss", message: "No match — try again." };
}

function Reel({
  symbol,
  spinning,
  delayClass,
}: {
  symbol: Symbol;
  spinning: boolean;
  delayClass: string;
}) {
  return (
    <div
      className={`flex h-24 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-lounge-gold/40 bg-lounge-charcoal shadow-inner sm:h-28 sm:w-20 ${
        spinning ? `animate-slot-spin ${delayClass}` : "animate-deal"
      }`}
    >
      <span
        className={`select-none font-display text-4xl font-bold sm:text-5xl ${
          symbol === "7"
            ? "text-lounge-red-light"
            : symbol === "★"
              ? "text-lounge-gold"
              : "text-white"
        }`}
      >
        {symbol}
      </span>
    </div>
  );
}

export default function SlotsGame() {
  const [reels, setReels] = useState<Symbol[]>(["7", "★", "◆"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [message, setMessage] = useState("");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearInterval);
    };
  }, []);

  const spin = () => {
    if (spinning) return;

    timersRef.current.forEach(clearInterval);
    timersRef.current = [];

    setSpinning(true);
    setResult(null);
    setMessage("");
    playRoll();

    const finalReels: Symbol[] = [pickSymbol(), pickSymbol(), pickSymbol()];
    let stopped = 0;

    SPIN_TICKS.forEach((ticks, reelIndex) => {
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        setReels((prev) => {
          const next = [...prev] as Symbol[];
          next[reelIndex] = count >= ticks ? finalReels[reelIndex] : pickSymbol();
          return next;
        });

        if (count >= ticks) {
          clearInterval(interval);
          playMatch();
          stopped += 1;

          if (stopped === REEL_COUNT) {
            setSpinning(false);
            setHasSpun(true);
            const outcome = evaluate(finalReels);
            setResult(outcome.result);
            setMessage(outcome.message);
            if (outcome.result === "win") {
              playWin();
              setWins((w) => w + 1);
            } else {
              playLose();
              setLosses((l) => l + 1);
            }
            recordGameResult("slots", outcome.result);
          }
        }
      }, 90);
      timersRef.current.push(interval);
    });
  };

  return (
    <GameLayout title="Slots" subtitle="Spin three reels — match a pair or three of a kind to win.">
      <div className="space-y-6">
        <ScoreBoard label="Session Score" wins={wins} losses={losses} />

        <div className="mx-auto max-w-sm rounded-2xl border border-lounge-border bg-lounge-surface/80 p-6 shadow-xl">
          <div className="mb-4 text-center text-xs uppercase tracking-[0.25em] text-lounge-gold">
            Lucky Reels
          </div>
          <div className="flex items-center justify-center gap-3 rounded-xl border border-lounge-border/60 bg-lounge-black/60 px-4 py-5">
            {reels.map((symbol, i) => (
              <Reel
                key={i}
                symbol={symbol}
                spinning={spinning}
                delayClass={`stagger-${i + 1}`}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-gray-500">
            Pair = win · Triple = bigger win · Triple 7s = jackpot
          </p>
        </div>

        {result && !spinning && <ResultBanner result={result} message={message} />}

        <div className="flex justify-center">
          <GameButton onClick={spin} variant="gold" disabled={spinning}>
            {spinning ? "Spinning…" : hasSpun ? "Spin Again" : "Pull Lever"}
          </GameButton>
        </div>
      </div>
    </GameLayout>
  );
}
