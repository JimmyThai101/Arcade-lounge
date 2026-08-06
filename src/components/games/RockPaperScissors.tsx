"use client";

import { useState } from "react";
import type { RPSChoice } from "@/lib/types";
import { recordGameResult } from "@/lib/stats";
import { playWin, playLose, playTie } from "@/lib/sounds";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import ScoreBoard from "@/components/shared/ScoreBoard";
import ResultBanner from "@/components/shared/ResultBanner";

const CHOICES: { id: RPSChoice; icon: string; label: string }[] = [
  { id: "rock", icon: "✊", label: "Rock" },
  { id: "paper", icon: "✋", label: "Paper" },
  { id: "scissors", icon: "✌️", label: "Scissors" },
];

function getWinner(player: RPSChoice, computer: RPSChoice): "win" | "loss" | "tie" {
  if (player === computer) return "tie";
  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) {
    return "win";
  }
  return "loss";
}

export default function RockPaperScissorsGame() {
  const [playerChoice, setPlayerChoice] = useState<RPSChoice | null>(null);
  const [computerChoice, setComputerChoice] = useState<RPSChoice | null>(null);
  const [result, setResult] = useState<"win" | "loss" | "tie" | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);

  const play = (choice: RPSChoice) => {
    if (revealing) return;

    setPlayerChoice(choice);
    setComputerChoice(null);
    setResult(null);
    setRevealing(true);

    const options: RPSChoice[] = ["rock", "paper", "scissors"];
    const computer = options[Math.floor(Math.random() * 3)];

    setTimeout(() => {
      setComputerChoice(computer);
      const outcome = getWinner(choice, computer);
      setResult(outcome);

      if (outcome === "win") {
        playWin();
        setWins((w) => w + 1);
      } else if (outcome === "loss") {
        playLose();
        setLosses((l) => l + 1);
      } else {
        playTie();
        setTies((t) => t + 1);
      }
      recordGameResult("rock-paper-scissors", outcome);
      setRevealing(false);
    }, 800);
  };

  const reset = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  const getIcon = (choice: RPSChoice) =>
    CHOICES.find((c) => c.id === choice)?.icon ?? "❓";

  return (
    <GameLayout title="Rock Paper Scissors" subtitle="Pick your move and beat the computer.">
      <div className="space-y-6">
        <ScoreBoard label="Session Score" wins={wins} losses={losses} ties={ties} />

        <div className="flex items-center justify-center gap-8 py-6">
          <div className="text-center">
            <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">You</p>
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-2xl border border-lounge-border bg-lounge-surface text-5xl transition-all duration-300 ${
                playerChoice ? "animate-flip-in border-lounge-gold/40" : ""
              }`}
            >
              {playerChoice ? getIcon(playerChoice) : "?"}
            </div>
          </div>

          <span className="text-2xl text-gray-600">VS</span>

          <div className="text-center">
            <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">Computer</p>
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-2xl border border-lounge-border bg-lounge-surface text-5xl transition-all duration-300 ${
                computerChoice ? "animate-flip-in border-lounge-red/40" : revealing ? "animate-shake" : ""
              }`}
            >
              {computerChoice ? getIcon(computerChoice) : revealing ? "..." : "?"}
            </div>
          </div>
        </div>

        {result && (
          <ResultBanner
            result={result}
            message={
              result === "win"
                ? "You Win!"
                : result === "loss"
                  ? "You Lose"
                  : "It's a Tie!"
            }
          />
        )}

        {!result ? (
          <div className="flex flex-wrap justify-center gap-3">
            {CHOICES.map((c) => (
              <GameButton
                key={c.id}
                onClick={() => play(c.id)}
                disabled={revealing}
                variant="gold"
                className="min-w-[100px]"
              >
                {c.icon} {c.label}
              </GameButton>
            ))}
          </div>
        ) : (
          <div className="flex justify-center">
            <GameButton onClick={reset} variant="gold">
              Play Again
            </GameButton>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
