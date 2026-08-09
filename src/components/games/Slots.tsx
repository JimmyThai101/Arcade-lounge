"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { randomInt } from "@/lib/utils";
import { recordGameResult } from "@/lib/stats";
import {
  SLOT_PAYOUTS,
  SLOT_SPIN_COST,
  addJimmycoin,
  canAfford,
  getJimmycoin,
  spendJimmycoin,
  JIMMYCOIN_EVENT,
} from "@/lib/jimmycoin";
import { playRoll, playWin, playLose, playMatch, playJackpot } from "@/lib/sounds";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import ScoreBoard from "@/components/shared/ScoreBoard";
import ResultBanner from "@/components/shared/ResultBanner";
import JimmycoinReward from "@/components/shared/JimmycoinReward";

const CONFETTI_COLORS = ["#d4af37", "#f0c75e", "#c41e3a", "#e63950", "#ffffff"];

function JackpotCelebration({ active }: { active: boolean }) {
  if (!active) return null;

  const pieces = Array.from({ length: 36 }, (_, i) => {
    const left = `${(i * 17) % 100}%`;
    const drift = `${((i % 7) - 3) * 28}px`;
    const delay = `${(i % 10) * 0.05}s`;
    const duration = `${2 + (i % 5) * 0.15}s`;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const size = 6 + (i % 4) * 2;
    return { left, drift, delay, duration, color, size, i };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <div className="animate-jackpot-flash absolute inset-0 bg-gradient-to-b from-lounge-gold/30 via-lounge-red/20 to-transparent" />
      {pieces.map((p) => (
        <span
          key={p.i}
          className="animate-confetti absolute top-0 rounded-sm"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            ["--drift" as string]: p.drift,
            ["--fall-delay" as string]: p.delay,
            ["--fall-duration" as string]: p.duration,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="animate-jackpot-burst text-center">
          <p className="font-display text-5xl font-bold tracking-[0.15em] text-lounge-gold drop-shadow-[0_0_24px_rgba(212,175,55,0.8)] sm:text-7xl">
            JACKPOT
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.35em] text-lounge-gold-light sm:text-base">
            Triple 7s
          </p>
        </div>
      </div>
    </div>
  );
}

/** Near-flat weights across many symbols; 7 is intentionally scarce */
const REEL_WEIGHTS = {
  "●": 10,
  "▲": 10,
  "♣": 10,
  "◆": 9,
  "★": 9,
  "♦": 9,
  "♠": 9,
  "♥": 9,
  "✦": 8,
  "◎": 8,
  "◇": 8,
  "△": 8,
  "7": 1,
} as const;

type Symbol = keyof typeof REEL_WEIGHTS;

const REEL_COUNT = 3;
const SPIN_TICKS = [12, 16, 20];

function buildWeightedPool(): Symbol[] {
  const pool: Symbol[] = [];
  (Object.keys(REEL_WEIGHTS) as Symbol[]).forEach((symbol) => {
    for (let i = 0; i < REEL_WEIGHTS[symbol]; i++) pool.push(symbol);
  });
  return pool;
}

const WEIGHTED_POOL = buildWeightedPool();

function pickSymbol(): Symbol {
  return WEIGHTED_POOL[randomInt(0, WEIGHTED_POOL.length - 1)];
}

type SlotTier = "jackpot" | "triple" | "pair" | "loss";

function evaluate(reels: Symbol[]): {
  tier: SlotTier;
  result: "win" | "loss";
  payout: number;
  message: string;
} {
  const [a, b, c] = reels;

  if (a === b && b === c) {
    if (a === "7") {
      return {
        tier: "jackpot",
        result: "win",
        payout: SLOT_PAYOUTS.jackpot,
        message: `Triple 7s — jackpot! +${SLOT_PAYOUTS.jackpot} Jimmycoin`,
      };
    }
    return {
      tier: "triple",
      result: "win",
      payout: SLOT_PAYOUTS.triple,
      message: `Three ${a}s — big win! +${SLOT_PAYOUTS.triple} Jimmycoin`,
    };
  }

  // Only adjacent pairs count (harder than any two matching)
  if (a === b || b === c) {
    return {
      tier: "pair",
      result: "win",
      payout: SLOT_PAYOUTS.pair,
      message: `Adjacent pair — +${SLOT_PAYOUTS.pair} Jimmycoin`,
    };
  }

  return {
    tier: "loss",
    result: "loss",
    payout: 0,
    message: "No luck this spin — try again.",
  };
}

function Reel({
  symbol,
  spinning,
  delayClass,
  jackpotGlow,
}: {
  symbol: Symbol;
  spinning: boolean;
  delayClass: string;
  jackpotGlow?: boolean;
}) {
  return (
    <div
      className={`flex h-24 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-lounge-gold/40 bg-lounge-charcoal shadow-inner sm:h-28 sm:w-20 ${
        spinning ? `animate-slot-spin ${delayClass}` : "animate-deal"
      } ${jackpotGlow ? "animate-jackpot-reel border-lounge-gold" : ""}`}
    >
      <span
        className={`select-none font-display text-4xl font-bold sm:text-5xl ${
          symbol === "7"
            ? "text-lounge-red-light"
            : symbol === "★" || symbol === "✦"
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
  const [reels, setReels] = useState<Symbol[]>(["★", "●", "▲"]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<"win" | "loss" | null>(null);
  const [message, setMessage] = useState("");
  const [payout, setPayout] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [balance, setBalance] = useState(0);
  const [jackpotCelebrate, setJackpotCelebrate] = useState(false);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBalance(getJimmycoin());
    const onChange = (event: Event) => {
      const custom = event as CustomEvent<number>;
      if (typeof custom.detail === "number") setBalance(custom.detail);
      else setBalance(getJimmycoin());
    };
    window.addEventListener(JIMMYCOIN_EVENT, onChange);
    return () => {
      window.removeEventListener(JIMMYCOIN_EVENT, onChange);
      timersRef.current.forEach(clearInterval);
      if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    };
  }, []);

  const affordable = canAfford(SLOT_SPIN_COST);

  const spin = () => {
    if (spinning) return;
    if (!spendJimmycoin(SLOT_SPIN_COST)) return;

    timersRef.current.forEach(clearInterval);
    timersRef.current = [];

    setSpinning(true);
    setResult(null);
    setMessage("");
    setPayout(0);
    setJackpotCelebrate(false);
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
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
            setPayout(outcome.payout);

            if (outcome.payout > 0) {
              addJimmycoin(outcome.payout);
            }

            if (outcome.result === "win") {
              if (outcome.tier === "jackpot") {
                playJackpot();
                setJackpotCelebrate(true);
                celebrateTimerRef.current = setTimeout(() => {
                  setJackpotCelebrate(false);
                }, 3000);
              } else {
                playWin();
              }
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
    <GameLayout
      title="Slots"
      subtitle={`Spend ${SLOT_SPIN_COST} Jimmycoin to spin. Win free games to earn more.`}
    >
      <JackpotCelebration active={jackpotCelebrate} />
      <div className="space-y-6">
        <ScoreBoard label="Session Score" wins={wins} losses={losses} />

        <div className="mx-auto flex max-w-sm items-center justify-between rounded-xl border border-lounge-border bg-lounge-charcoal/50 px-4 py-3 text-sm">
          <span className="inline-flex items-center gap-2 text-gray-400">
            <Image
              src="/jimmycoin.png"
              alt=""
              width={22}
              height={22}
              className="rounded-full object-cover ring-1 ring-lounge-gold/40"
            />
            Spin cost
          </span>
          <span className="font-semibold text-lounge-gold-light">{SLOT_SPIN_COST} JC</span>
        </div>

        <div
          className={`mx-auto max-w-sm rounded-2xl border bg-lounge-surface/80 p-6 shadow-xl ${
            jackpotCelebrate
              ? "border-lounge-gold animate-pulse-gold"
              : "border-lounge-border"
          }`}
        >
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
                jackpotGlow={jackpotCelebrate}
              />
            ))}
          </div>
          <div className="mt-4 space-y-1 text-center text-xs text-gray-500">
            <p>Adjacent pair = {SLOT_PAYOUTS.pair} JC</p>
            <p>Three of a kind = {SLOT_PAYOUTS.triple} JC</p>
            <p>Triple 7s jackpot = {SLOT_PAYOUTS.jackpot} JC</p>
          </div>
        </div>

        {result && !spinning && (
          <ResultBanner result={result} message={message}>
            {payout > 0 && <JimmycoinReward amount={payout} />}
          </ResultBanner>
        )}

        {!affordable && !spinning && (
          <p className="text-center text-sm text-gray-400">
            You need {SLOT_SPIN_COST} Jimmycoin to spin. Win free games on the hub to earn more
            {balance > 0 ? ` (you have ${balance}).` : "."}
          </p>
        )}

        <div className="flex justify-center">
          <GameButton onClick={spin} variant="gold" disabled={spinning || !affordable}>
            {spinning
              ? "Spinning…"
              : !affordable
                ? "Need Jimmycoin"
                : hasSpun
                  ? `Spin Again (−${SLOT_SPIN_COST})`
                  : `Pull Lever (−${SLOT_SPIN_COST})`}
          </GameButton>
        </div>
      </div>
    </GameLayout>
  );
}
