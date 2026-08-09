"use client";

import { useState } from "react";
import type { PlayingCard } from "@/lib/types";
import { createDeck, drawCard } from "@/lib/utils";
import { recordGameResult } from "@/lib/stats";
import { playFlip, playWin, playLose, playTie } from "@/lib/sounds";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import PlayingCardComponent from "@/components/shared/PlayingCard";
import ScoreBoard from "@/components/shared/ScoreBoard";
import ResultBanner from "@/components/shared/ResultBanner";
import JimmycoinReward from "@/components/shared/JimmycoinReward";
import { WIN_REWARDS } from "@/lib/jimmycoin";

export default function HighCardGame() {
  const [playerCard, setPlayerCard] = useState<PlayingCard | null>(null);
  const [computerCard, setComputerCard] = useState<PlayingCard | null>(null);
  const [result, setResult] = useState<"win" | "loss" | "tie" | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);

  const play = () => {
    if (revealing) return;

    setPlayerCard(null);
    setComputerCard(null);
    setResult(null);
    setRevealing(true);
    playFlip();

    const deck = createDeck();
    const [pCard, deck2] = drawCard(deck);
    const [cCard] = drawCard(deck2);

    setTimeout(() => {
      setPlayerCard(pCard);
      playFlip();
    }, 400);

    setTimeout(() => {
      setComputerCard(cCard);

      let outcome: "win" | "loss" | "tie";
      if (pCard.value > cCard.value) {
        outcome = "win";
        playWin();
        setWins((w) => w + 1);
      } else if (cCard.value > pCard.value) {
        outcome = "loss";
        playLose();
        setLosses((l) => l + 1);
      } else {
        outcome = "tie";
        playTie();
        setTies((t) => t + 1);
      }

      setResult(outcome);
      recordGameResult("high-card", outcome);
      setRevealing(false);
    }, 900);
  };

  const reset = () => {
    setPlayerCard(null);
    setComputerCard(null);
    setResult(null);
  };

  const hasPlayed = playerCard !== null;

  return (
    <GameLayout title="High Card" subtitle="Draw one card each — highest value wins.">
      <div className="space-y-6">
        <ScoreBoard label="Session Score" wins={wins} losses={losses} ties={ties} />

        <div className="flex items-end justify-center gap-8 py-6">
          <div className="text-center">
            <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">You</p>
            <PlayingCardComponent
              card={playerCard ?? undefined}
              faceDown={!playerCard}
              animate={!!playerCard}
            />
          </div>

          <span className="mb-12 text-2xl text-gray-600">VS</span>

          <div className="text-center">
            <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">Computer</p>
            <PlayingCardComponent
              card={computerCard ?? undefined}
              faceDown={!computerCard}
              animate={!!computerCard}
            />
          </div>
        </div>

        {result && (
          <ResultBanner
            result={result}
            message={
              result === "win"
                ? `Your ${playerCard?.display}${playerCard?.suit} beats ${computerCard?.display}${computerCard?.suit}!`
                : result === "loss"
                  ? `${computerCard?.display}${computerCard?.suit} beats your ${playerCard?.display}${playerCard?.suit}`
                  : `Both drew ${playerCard?.display}${playerCard?.suit} — Tie!`
            }
          >
            {result === "win" && <JimmycoinReward amount={WIN_REWARDS["high-card"]} />}
          </ResultBanner>
        )}

        <div className="flex justify-center">
          {!hasPlayed || result ? (
            <GameButton
              onClick={result ? () => { reset(); play(); } : play}
              variant="gold"
              disabled={revealing}
            >
              {hasPlayed ? "Play Again" : "Draw Cards"}
            </GameButton>
          ) : null}
        </div>
      </div>
    </GameLayout>
  );
}
