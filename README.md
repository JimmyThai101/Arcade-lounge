# Game Lounge

A sleek, casino-inspired mini-game arcade built with Next.js, React, TypeScript, and Tailwind CSS. Six fully playable games — no real money, no accounts, just fun.

## Games

- **Make 21** — Wager Jimmycoin, then hit, stay, double down, or split — get close to 21 without going over
- **Rock Paper Scissors** — Classic showdown against the computer
- **High Card** — Draw one card each, highest wins
- **Dice Duel** — Roll two dice, highest total wins
- **Memory Match** — Flip and match pairs in the fewest moves
- **Slots** — Spend Jimmycoin to spin for pairs, triples, and rare jackpots

## Jimmycoin

Fake arcade currency (icon: cowboy-hat dog). Free games award Jimmycoin on wins; Slots costs Jimmycoin to play and can pay out on matches. No real money.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- localStorage for stats and high scores
- Web Audio API for optional sound effects

## Features

- Responsive design for desktop and mobile
- Persistent stats via localStorage
- Mute/unmute sound toggle
- Smooth animations and transitions
- Casino-lounge aesthetic (no gambling mechanics)
