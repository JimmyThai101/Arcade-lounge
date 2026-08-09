"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { PlayingCard } from "@/lib/types";
import { createDeck, drawCard } from "@/lib/utils";
import { recordGameResult } from "@/lib/stats";
import { playDraw, playWin, playLose, playTie } from "@/lib/sounds";
import {
  JIMMYCOIN_EVENT,
  addJimmycoin,
  canAfford,
  getJimmycoin,
  spendJimmycoin,
} from "@/lib/jimmycoin";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";
import PlayingCardComponent from "@/components/shared/PlayingCard";
import ScoreBoard from "@/components/shared/ScoreBoard";
import ResultBanner from "@/components/shared/ResultBanner";
import JimmycoinReward from "@/components/shared/JimmycoinReward";

type Phase = "betting" | "playing" | "finished";
type HandOutcome = "win" | "loss" | "tie" | "bust";

interface PlayerHand {
  cards: PlayingCard[];
  bet: number;
  stood: boolean;
  busted: boolean;
  doubled: boolean;
  outcome: HandOutcome | null;
}

const QUICK_BETS = [1, 5, 10, 25, 50] as const;

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

function emptyHand(bet = 0): PlayerHand {
  return { cards: [], bet, stood: false, busted: false, doubled: false, outcome: null };
}

function compareHand(pTotal: number, cTotal: number, busted: boolean): HandOutcome {
  if (busted || pTotal > 21) return "bust";
  if (cTotal > 21) return "win";
  if (pTotal > cTotal) return "win";
  if (cTotal > pTotal) return "loss";
  return "tie";
}

export default function Make21Game() {
  const [phase, setPhase] = useState<Phase>("betting");
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [hands, setHands] = useState<PlayerHand[]>([emptyHand()]);
  const [activeHand, setActiveHand] = useState(0);
  const [computerHand, setComputerHand] = useState<PlayingCard[]>([]);
  const [result, setResult] = useState<HandOutcome | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);
  const [message, setMessage] = useState("");
  const [coinDelta, setCoinDelta] = useState(0);
  const [balance, setBalance] = useState(0);
  const [wagerInput, setWagerInput] = useState("5");
  const [tableBet, setTableBet] = useState(0);

  useEffect(() => {
    setBalance(getJimmycoin());
    const onChange = (event: Event) => {
      const custom = event as CustomEvent<number>;
      if (typeof custom.detail === "number") setBalance(custom.detail);
      else setBalance(getJimmycoin());
    };
    window.addEventListener(JIMMYCOIN_EVENT, onChange);
    return () => window.removeEventListener(JIMMYCOIN_EVENT, onChange);
  }, []);

  const parsedWager = Number.parseInt(wagerInput, 10);
  const wager =
    Number.isFinite(parsedWager) && parsedWager > 0 ? Math.floor(parsedWager) : 0;
  const canDeal = wager >= 1 && canAfford(wager);

  const startGame = useCallback(() => {
    const amount = Number.parseInt(wagerInput, 10);
    if (!Number.isFinite(amount) || amount < 1) return;
    const bet = Math.floor(amount);
    if (!spendJimmycoin(bet)) return;

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
    setHands([
      { cards: pCards, bet, stood: false, busted: false, doubled: false, outcome: null },
    ]);
    setActiveHand(0);
    setComputerHand(cCards);
    setTableBet(bet);
    setPhase("playing");
    setResult(null);
    setMessage("");
    setCoinDelta(0);
  }, [wagerInput]);

  const finishRound = useCallback((finalHands: PlayerHand[], cHand: PlayingCard[]) => {
    const cTotal = handTotal(cHand);
    const resolved = finalHands.map((hand) => {
      const outcome = compareHand(handTotal(hand.cards), cTotal, hand.busted);
      return { ...hand, outcome };
    });

    let winDelta = 0;
    let lossDelta = 0;
    let tieDelta = 0;
    let returned = 0;
    let totalWagered = 0;

    resolved.forEach((hand) => {
      totalWagered += hand.bet;
      if (hand.outcome === "win") {
        winDelta += 1;
        returned += hand.bet * 2;
        recordGameResult("make-21", "win");
      } else if (hand.outcome === "tie") {
        tieDelta += 1;
        returned += hand.bet;
        recordGameResult("make-21", "tie");
      } else {
        lossDelta += 1;
        recordGameResult("make-21", "loss");
      }
    });

    if (returned > 0) addJimmycoin(returned);

    if (winDelta) setWins((w) => w + winDelta);
    if (lossDelta) setLosses((l) => l + lossDelta);
    if (tieDelta) setTies((t) => t + tieDelta);
    setCoinDelta(returned - totalWagered);

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
    if (!spendJimmycoin(hand.bet)) return;

    playDraw();
    const [card, newDeck] = drawCard(deck);
    const nextCards = [...hand.cards, card];
    const busted = handTotal(nextCards) > 21;
    const nextHands = hands.map((h, i) =>
      i === activeHand
        ? {
            ...h,
            cards: nextCards,
            bet: h.bet * 2,
            doubled: true,
            stood: !busted,
            busted,
          }
        : h
    );
    advanceOrFinish(nextHands, newDeck, activeHand);
  };

  const handleSplit = () => {
    if (phase !== "playing" || deck.length < 2) return;
    const hand = hands[activeHand];
    if (hands.length !== 1 || !isPair(hand.cards)) return;
    if (!spendJimmycoin(hand.bet)) return;

    playDraw();
    const [card1, afterFirst] = drawCard(deck);
    const [card2, afterSecond] = drawCard(afterFirst);

    const splitHands: PlayerHand[] = [
      {
        cards: [hand.cards[0], card1],
        bet: hand.bet,
        stood: false,
        busted: false,
        doubled: false,
        outcome: null,
      },
      {
        cards: [hand.cards[1], card2],
        bet: hand.bet,
        stood: false,
        busted: false,
        doubled: false,
        outcome: null,
      },
    ];

    setDeck(afterSecond);
    setHands(splitHands);
    setActiveHand(0);
  };

  const goToBetting = () => {
    setPhase("betting");
    setResult(null);
    setMessage("");
    setCoinDelta(0);
    setHands([emptyHand()]);
    setComputerHand([]);
  };

  const current = hands[activeHand];
  const canAct = phase === "playing" && current && !current.stood && !current.busted;
  const canDouble =
    canAct && current.cards.length === 2 && !current.doubled && canAfford(current.bet);
  const canSplit =
    canAct &&
    hands.length === 1 &&
    isPair(current.cards) &&
    deck.length >= 2 &&
    canAfford(current.bet);
  const showComputerTotal = phase === "finished";
  const computerTotal = handTotal(computerHand);
  const totalAtRisk = hands.reduce((sum, h) => sum + h.bet, 0);

  return (
    <GameLayout
      title="Make 21"
      subtitle="Wager Jimmycoin, then hit, stay, double down, or split — get close to 21 without going over."
    >
      <div className="space-y-6">
        <ScoreBoard label="Session Score" wins={wins} losses={losses} ties={ties} />

        {phase === "betting" && (
          <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-lounge-border bg-lounge-surface/70 p-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-lounge-gold">Place Your Bet</p>
              <p className="mt-2 text-sm text-gray-400">
                Wager any amount you can afford. Wins pay even money.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Image
                src="/jimmycoin.png"
                alt=""
                width={36}
                height={36}
                className="rounded-full object-cover ring-1 ring-lounge-gold/50"
              />
              <input
                type="number"
                min={1}
                max={balance || undefined}
                step={1}
                value={wagerInput}
                onChange={(e) => setWagerInput(e.target.value)}
                className="w-36 rounded-lg border border-lounge-gold/40 bg-lounge-black/60 px-3 py-2 text-center text-2xl font-bold tabular-nums text-lounge-gold-light outline-none focus:border-lounge-gold"
                aria-label="Jimmycoin wager"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_BETS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={balance < amount}
                  onClick={() => setWagerInput(String(amount))}
                  className="rounded-lg border border-lounge-border bg-lounge-charcoal/60 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-lounge-gold/50 hover:text-lounge-gold disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {amount}
                </button>
              ))}
              <button
                type="button"
                disabled={balance < 1}
                onClick={() => setWagerInput(String(balance))}
                className="rounded-lg border border-lounge-gold/40 bg-lounge-gold/10 px-3 py-1.5 text-xs font-semibold text-lounge-gold transition hover:bg-lounge-gold/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Max
              </button>
            </div>

            <p className="text-center text-xs text-gray-500">
              Balance: {balance} JC
              {wager > balance && wager > 0 ? " · Not enough Jimmycoin" : ""}
              {balance < 1 ? " · Win free games or slots to earn Jimmycoin" : ""}
            </p>

            <div className="flex justify-center">
              <GameButton onClick={startGame} variant="gold" disabled={!canDeal}>
                {balance < 1 ? "Need Jimmycoin" : `Deal Cards (−${wager || 0} JC)`}
              </GameButton>
            </div>
          </div>
        )}

        {phase !== "betting" && (
          <>
            <div className="mx-auto flex max-w-sm items-center justify-between rounded-xl border border-lounge-border bg-lounge-charcoal/50 px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-2 text-gray-400">
                <Image
                  src="/jimmycoin.png"
                  alt=""
                  width={22}
                  height={22}
                  className="rounded-full object-cover ring-1 ring-lounge-gold/40"
                />
                {phase === "playing" ? "At risk" : "Wagered"}
              </span>
              <span className="font-semibold text-lounge-gold-light">
                {totalAtRisk || tableBet} JC
              </span>
            </div>

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
                      {" · "}
                      {hand.bet} JC
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
                  {current ? ` (−${current.bet})` : ""}
                </GameButton>
                <GameButton onClick={handleSplit} variant="gold" disabled={!canSplit}>
                  Split
                  {current ? ` (−${current.bet})` : ""}
                </GameButton>
              </div>
            )}

            {phase === "finished" && (
              <div className="space-y-4">
                <ResultBanner result={result} message={message}>
                  {coinDelta > 0 && <JimmycoinReward amount={coinDelta} />}
                  {coinDelta === 0 && result === "tie" && (
                    <span className="text-sm text-gray-400">Push — wager returned</span>
                  )}
                  {coinDelta === 0 && result !== "tie" && (
                    <span className="text-sm text-gray-400">Broke even</span>
                  )}
                  {coinDelta < 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-lounge-red-light">
                      <Image
                        src="/jimmycoin.png"
                        alt=""
                        width={18}
                        height={18}
                        className="rounded-full object-cover opacity-80"
                      />
                      {coinDelta} Jimmycoin
                    </span>
                  )}
                </ResultBanner>
                <div className="flex justify-center">
                  <GameButton onClick={goToBetting} variant="gold">
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
