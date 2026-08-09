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
type HandOutcome = "win" | "loss" | "tie" | "bust";

interface PlayerHand {
  cards: PlayingCard[];
  stood: boolean;
  busted: boolean;
  doubled: boolean;
  outcome: HandOutcome | null;
}

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

function isPair(hand: PlayingCard[]): boolean {
  return hand.length === 2 && hand[0].display === hand[1].display;
}

function emptyHand(): PlayerHand {
  return { cards: [], stood: false, busted: false, doubled: false, outcome: null };
}

function compareHand(pTotal: number, cTotal: number, busted: boolean): HandOutcome {
  if (busted || pTotal > 21) return "bust";
  if (cTotal > 21) return "win";
  if (pTotal > cTotal) return "win";
  if (cTotal > pTotal) return "loss";
  return "tie";
}

export default function Make21Game() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [hands, setHands] = useState<PlayerHand[]>([emptyHand()]);
  const [activeHand, setActiveHand] = useState(0);
  const [computerHand, setComputerHand] = useState<PlayingCard[]>([]);
  const [result, setResult] = useState<HandOutcome | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);
  const [message, setMessage] = useState("");

  const startGame = useCallback(() => {
    let newDeck = createDeck();
    const pCards: PlayingCard[] = [];
    const cCards: PlayingCard[] = [];

    let card: PlayingCard;
    [card, newDeck] = drawCard(newDeck);
    pCards.push(card);
    [card, newDeck] = drawCard(newDeck);
    cCards.push(card);
    [card, newDeck] = drawCard(newDeck);
    pCards.push(card);
    [card, newDeck] = drawCard(newDeck);
    cCards.push(card);

    setDeck(newDeck);
    setHands([{ cards: pCards, stood: false, busted: false, doubled: false, outcome: null }]);
    setActiveHand(0);
    setComputerHand(cCards);
    setPhase("playing");
    setResult(null);
    setMessage("");
  }, []);

  const finishRound = useCallback((finalHands: PlayerHand[], cHand: PlayingCard[]) => {
    const cTotal = handTotal(cHand);
    const resolved = finalHands.map((hand) => {
      const outcome = compareHand(handTotal(hand.cards), cTotal, hand.busted);
      return { ...hand, outcome };
    });

    let winDelta = 0;
    let lossDelta = 0;
    let tieDelta = 0;

    resolved.forEach((hand) => {
      if (hand.outcome === "win") {
        winDelta += 1;
        recordGameResult("make-21", "win");
      } else if (hand.outcome === "tie") {
        tieDelta += 1;
        recordGameResult("make-21", "tie");
      } else {
        lossDelta += 1;
        recordGameResult("make-21", "loss");
      }
    });

    if (winDelta) setWins((w) => w + winDelta);
    if (lossDelta) setLosses((l) => l + lossDelta);
    if (tieDelta) setTies((t) => t + tieDelta);

    let banner: HandOutcome;
    if (winDelta > lossDelta) banner = "win";
    else if (lossDelta > winDelta)
      banner = resolved.every((h) => h.outcome === "bust") ? "bust" : "loss";
    else banner = "tie";

    if (banner === "win") playWin();
    else if (banner === "tie") playTie();
    else playLose();

    const handSummaries = resolved.map((hand, i) => {
      const label = resolved.length > 1 ? `Hand ${i + 1}` : "You";
      const total = handTotal(hand.cards);
      if (hand.outcome === "bust") return `${label} busted (${total})`;
      if (hand.outcome === "win") return `${label} ${total} wins`;
      if (hand.outcome === "loss") return `${label} ${total} loses`;
      return `${label} ${total} ties`;
    });

    const msg =
      resolved.length > 1
        ? `${handSummaries.join(" · ")} · Computer: ${cTotal}`
        : cTotal > 21
          ? `Computer busted (${cTotal}). ${handSummaries[0]}`
          : resolved[0].outcome === "bust"
            ? `You went over 21 (${handTotal(resolved[0].cards)}). Computer: ${cTotal}`
            : `You: ${handTotal(resolved[0].cards)} · Computer: ${cTotal}`;

    setHands(resolved);
    setResult(banner);
    setMessage(msg);
    setPhase("finished");
  }, []);

  const computerTurn = useCallback(
    (currentDeck: PlayingCard[], finalHands: PlayerHand[], cHand: PlayingCard[]) => {
      let d = currentDeck;
      const comp = [...cHand];
      const allBusted = finalHands.every((h) => h.busted);

      if (!allBusted) {
        while (computerShouldDraw(handTotal(comp)) && d.length > 0) {
          const [card, rest] = drawCard(d);
          comp.push(card);
          d = rest;
        }
      }

      setDeck(d);
      setComputerHand(comp);
      finishRound(finalHands, comp);
    },
    [finishRound]
  );

  const advanceOrFinish = (
    nextHands: PlayerHand[],
    nextDeck: PlayingCard[],
    fromIndex: number
  ) => {
    const nextIndex = nextHands.findIndex(
      (h, i) => i > fromIndex && !h.stood && !h.busted
    );

    if (nextIndex !== -1) {
      setHands(nextHands);
      setDeck(nextDeck);
      setActiveHand(nextIndex);
      return;
    }

    setHands(nextHands);
    setDeck(nextDeck);
    computerTurn(nextDeck, nextHands, computerHand);
  };

  const handleDraw = () => {
    if (phase !== "playing" || deck.length === 0) return;
    playDraw();

    const [card, newDeck] = drawCard(deck);
    const nextHands = hands.map((h, i) =>
      i === activeHand ? { ...h, cards: [...h.cards, card] } : h
    );
    const total = handTotal(nextHands[activeHand].cards);

    if (total > 21) {
      nextHands[activeHand] = { ...nextHands[activeHand], busted: true };
      advanceOrFinish(nextHands, newDeck, activeHand);
    } else {
      setHands(nextHands);
      setDeck(newDeck);
    }
  };

  const handleStay = () => {
    if (phase !== "playing") return;
    const nextHands = hands.map((h, i) =>
      i === activeHand ? { ...h, stood: true } : h
    );
    advanceOrFinish(nextHands, deck, activeHand);
  };

  const handleDoubleDown = () => {
    if (phase !== "playing" || deck.length === 0) return;
    const hand = hands[activeHand];
    if (hand.cards.length !== 2 || hand.doubled) return;

    playDraw();
    const [card, newDeck] = drawCard(deck);
    const nextCards = [...hand.cards, card];
    const busted = handTotal(nextCards) > 21;
    const nextHands = hands.map((h, i) =>
      i === activeHand
        ? { ...h, cards: nextCards, doubled: true, stood: !busted, busted }
        : h
    );
    advanceOrFinish(nextHands, newDeck, activeHand);
  };

  const handleSplit = () => {
    if (phase !== "playing" || deck.length < 2) return;
    const hand = hands[activeHand];
    if (hands.length !== 1 || !isPair(hand.cards)) return;

    playDraw();
    const [card1, afterFirst] = drawCard(deck);
    const [card2, afterSecond] = drawCard(afterFirst);

    const splitHands: PlayerHand[] = [
      { cards: [hand.cards[0], card1], stood: false, busted: false, doubled: false, outcome: null },
      { cards: [hand.cards[1], card2], stood: false, busted: false, doubled: false, outcome: null },
    ];

    setDeck(afterSecond);
    setHands(splitHands);
    setActiveHand(0);
  };

  const current = hands[activeHand];
  const canAct = phase === "playing" && current && !current.stood && !current.busted;
  const canDouble = canAct && current.cards.length === 2 && !current.doubled;
  const canSplit = canAct && hands.length === 1 && isPair(current.cards) && deck.length >= 2;
  const showComputerTotal = phase === "finished";
  const computerTotal = handTotal(computerHand);

  return (
    <GameLayout
      title="Make 21"
      subtitle="Hit, stay, double down, or split pairs — get close to 21 without going over."
    >
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

            <div className={hands.length > 1 ? "grid gap-4 sm:grid-cols-2" : "space-y-2"}>
              {hands.map((hand, handIndex) => {
                const total = handTotal(hand.cards);
                const isActive = phase === "playing" && handIndex === activeHand;
                return (
                  <div
                    key={handIndex}
                    className={`space-y-2 rounded-xl p-3 transition-colors ${
                      isActive
                        ? "border border-lounge-gold/40 bg-lounge-gold/5"
                        : hands.length > 1
                          ? "border border-lounge-border/40 bg-lounge-charcoal/30"
                          : ""
                    }`}
                  >
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      {hands.length > 1 ? `Hand ${handIndex + 1}` : "Your Hand"}
                      {" · "}
                      {total}
                      {hand.doubled && " · Doubled"}
                      {hand.busted && " · Bust"}
                      {hand.outcome === "win" && " · Win"}
                      {hand.outcome === "loss" && " · Loss"}
                      {hand.outcome === "tie" && " · Tie"}
                      {isActive && " · Playing"}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {hand.cards.map((card, i) => (
                        <PlayingCardComponent key={i} card={card} animate small />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {phase === "playing" && (
              <div className="flex flex-wrap justify-center gap-3">
                <GameButton onClick={handleDraw} disabled={!canAct}>
                  Draw
                </GameButton>
                <GameButton onClick={handleStay} variant="secondary" disabled={!canAct}>
                  Stay
                </GameButton>
                <GameButton onClick={handleDoubleDown} variant="gold" disabled={!canDouble}>
                  Double Down
                </GameButton>
                <GameButton onClick={handleSplit} variant="gold" disabled={!canSplit}>
                  Split
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
