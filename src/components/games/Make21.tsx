"use client";

import { useCallback, useState } from "react";
import type { PlayingCard } from "@/lib/types";
import { createDeck, drawCard } from "@/lib/utils";
import { recordGameResult } from "@/lib/stats";
import { playDraw, playWin, playLose, playTie } from "@/lib/sounds";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import PlayingCardComponent from "@/components/shared/PlayingCard";
import ScoreBoard from "@/components/shared/ScoreBoard";
import ResultBanner from "@/components/shared/ResultBanner";

type Phase = "idle" | "playing" | "finished";

function handTotal(hand: PlayingCard[]): number {
  let total = hand.reduce((sum, c) => sum + c.value, 0);
  let aces = hand.filter((c) => c.display === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function computerShouldDraw(total: number): boolean {
  return total < 17;
}

export default function Make21Game() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [computerHand, setComputerHand] = useState<PlayingCard[]>([]);
  const [result, setResult] = useState<"win" | "loss" | "tie" | "bust" | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);
  const [message, setMessage] = useState("");

  const startGame = useCallback(() => {
    let newDeck = createDeck();
    const pHand: PlayingCard[] = [];
    const cHand: PlayingCard[] = [];

    let card: PlayingCard;
    [card, newDeck] = drawCard(newDeck);
    pHand.push(card);
    [card, newDeck] = drawCard(newDeck);
    cHand.push(card);
    [card, newDeck] = drawCard(newDeck);
    pHand.push(card);
    [card, newDeck] = drawCard(newDeck);
    cHand.push(card);

    setDeck(newDeck);
    setPlayerHand(pHand);
    setComputerHand(cHand);
    setPhase("playing");
    setResult(null);
    setMessage("");
  }, []);

  const finishGame = useCallback(
    (pHand: PlayingCard[], cHand: PlayingCard[], playerBust = false) => {
      const pTotal = handTotal(pHand);
      const cTotal = handTotal(cHand);

      let gameResult: "win" | "loss" | "tie" | "bust";
      let msg = `You: ${pTotal} · Computer: ${cTotal}`;

      if (playerBust || pTotal > 21) {
        gameResult = "bust";
        msg = `You went over 21 (${pTotal}). Computer: ${cTotal}`;
        playLose();
        recordGameResult("make-21", "loss");
        setLosses((l) => l + 1);
      } else if (cTotal > 21) {
        gameResult = "win";
        msg = `Computer busted (${cTotal}). You: ${pTotal}`;
        playWin();
        recordGameResult("make-21", "win");
        setWins((w) => w + 1);
      } else if (pTotal > cTotal) {
        gameResult = "win";
        playWin();
        recordGameResult("make-21", "win");
        setWins((w) => w + 1);
      } else if (cTotal > pTotal) {
        gameResult = "loss";
        playLose();
        recordGameResult("make-21", "loss");
        setLosses((l) => l + 1);
      } else {
        gameResult = "tie";
        playTie();
        recordGameResult("make-21", "tie");
        setTies((t) => t + 1);
      }

      setResult(gameResult);
      setMessage(msg);
      setPhase("finished");
    },
    []
  );

  const computerTurn = useCallback(
    (currentDeck: PlayingCard[], pHand: PlayingCard[], cHand: PlayingCard[]) => {
      let d = currentDeck;
      const comp = [...cHand];

      while (computerShouldDraw(handTotal(comp)) && d.length > 0) {
        const [card, rest] = drawCard(d);
        comp.push(card);
        d = rest;
      }

      setDeck(d);
      setComputerHand(comp);
      finishGame(pHand, comp);
    },
    [finishGame]
  );

  const handleDraw = () => {
    if (phase !== "playing" || deck.length === 0) return;
    playDraw();

    const [card, newDeck] = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);

    if (handTotal(newHand) > 21) {
      finishGame(newHand, computerHand, true);
    }
  };

  const handleStay = () => {
    if (phase !== "playing") return;
    computerTurn(deck, playerHand, computerHand);
  };

  const playerTotal = handTotal(playerHand);
  const computerTotal = handTotal(computerHand);
  const showComputerTotal = phase === "finished";

  return (
    <GameLayout title="Make 21" subtitle="Get as close to 21 as you can without going over.">
      <div className="space-y-6">
        <ScoreBoard label="Session Score" wins={wins} losses={losses} ties={ties} />

        {phase === "idle" && (
          <div className="flex justify-center py-12">
            <GameButton onClick={startGame} variant="gold">
              Deal Cards
            </GameButton>
          </div>
        )}

        {phase !== "idle" && (
          <>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Computer {showComputerTotal && `· ${computerTotal}`}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {computerHand.map((card, i) => (
                  <PlayingCardComponent
                    key={i}
                    card={phase === "playing" && i === 1 ? undefined : card}
                    faceDown={phase === "playing" && i === 1}
                    animate
                    small
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Your Hand · {playerTotal}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {playerHand.map((card, i) => (
                  <PlayingCardComponent key={i} card={card} animate small />
                ))}
              </div>
            </div>

            {phase === "playing" && (
              <div className="flex justify-center gap-3">
                <GameButton onClick={handleDraw}>Draw</GameButton>
                <GameButton onClick={handleStay} variant="secondary">
                  Stay
                </GameButton>
              </div>
            )}

            {phase === "finished" && (
              <div className="space-y-4">
                <ResultBanner result={result} message={message} />
                <div className="flex justify-center">
                  <GameButton onClick={startGame} variant="gold">
                    Play Again
                  </GameButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </GameLayout>
  );
}
