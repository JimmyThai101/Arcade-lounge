"use client";

import { useState } from "react";
import { randomInt } from "@/lib/utils";
import { recordGameResult } from "@/lib/stats";
import { playRoll, playWin, playLose, playTie } from "@/lib/sounds";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import ScoreBoard from "@/components/shared/ScoreBoard";
import ResultBanner from "@/components/shared/ResultBanner";

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const dots: Record<number, number[][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
  };

  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 border-gray-300/30 bg-white shadow-lg sm:h-20 sm:w-20 ${
        rolling ? "animate-roll" : "animate-deal"
      }`}
    >
      <div className="grid h-12 w-12 grid-cols-3 grid-rows-3 gap-0.5 sm:h-14 sm:w-14">
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const show = dots[value]?.some(([r, c]) => r === row && c === col);
          return (
            <div key={i} className="flex items-center justify-center">
              {show && <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiceGroup({
  dice,
  rolling,
  label,
}: {
  dice: [number, number];
  rolling: boolean;
  label: string;
}) {
  return (
    <div className="text-center">
      <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <div className="flex gap-2 justify-center">
        <DiceFace value={dice[0]} rolling={rolling} />
        <DiceFace value={dice[1]} rolling={rolling} />
      </div>
      {!rolling && (
        <p className="mt-2 text-lg font-bold text-lounge-gold">
          Total: {dice[0] + dice[1]}
        </p>
      )}
    </div>
  );
}

export default function DiceDuelGame() {
  const [playerDice, setPlayerDice] = useState<[number, number]>([1, 1]);
  const [computerDice, setComputerDice] = useState<[number, number]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<"win" | "loss" | "tie" | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    setResult(null);
    playRoll();

    let ticks = 0;
    const interval = setInterval(() => {
      setPlayerDice([randomInt(1, 6), randomInt(1, 6)]);
      setComputerDice([randomInt(1, 6), randomInt(1, 6)]);
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        const p: [number, number] = [randomInt(1, 6), randomInt(1, 6)];
        const c: [number, number] = [randomInt(1, 6), randomInt(1, 6)];
        setPlayerDice(p);
        setComputerDice(c);
        setRolling(false);
        setHasRolled(true);

        const pTotal = p[0] + p[1];
        const cTotal = c[0] + c[1];
        let outcome: "win" | "loss" | "tie";
        if (pTotal > cTotal) {
          outcome = "win";
          playWin();
          setWins((w) => w + 1);
        } else if (cTotal > pTotal) {
          outcome = "loss";
          playLose();
          setLosses((l) => l + 1);
        } else {
          outcome = "tie";
          playTie();
          setTies((t) => t + 1);
        }
        setResult(outcome);
        recordGameResult("dice-duel", outcome);
      }
    }, 100);
  };

  return (
    <GameLayout title="Dice Duel" subtitle="Roll two dice — highest combined total wins.">
      <div className="space-y-6">
        <ScoreBoard label="Session Score" wins={wins} losses={losses} ties={ties} />

        <div className="flex items-start justify-center gap-8 py-6">
          <DiceGroup dice={playerDice} rolling={rolling} label="You" />
          <span className="mt-10 text-2xl text-gray-600">VS</span>
          <DiceGroup dice={computerDice} rolling={rolling} label="Computer" />
        </div>

        {result && !rolling && (
          <ResultBanner
            result={result}
            message={
              result === "win"
                ? `${playerDice[0] + playerDice[1]} beats ${computerDice[0] + computerDice[1]}!`
                : result === "loss"
                  ? `${computerDice[0] + computerDice[1]} beats ${playerDice[0] + playerDice[1]}`
                  : `Both rolled ${playerDice[0] + playerDice[1]} — Tie!`
            }
          />
        )}

        <div className="flex justify-center">
          <GameButton onClick={roll} variant="gold" disabled={rolling}>
            {hasRolled ? "Roll Again" : "Roll Dice"}
          </GameButton>
        </div>
      </div>
    </GameLayout>
  );
}
