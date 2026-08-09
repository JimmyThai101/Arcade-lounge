# Game Lounge

A sleek, casino-inspired mini-game arcade built with Next.js, React, TypeScript, and Tailwind CSS. Seven fully playable games — no real money, just fun.

## Games

- **Make 21** — Wager Jimmycoin, then hit, stay, double down, or split — get close to 21 without going over
- **Rock Paper Scissors** — Classic showdown against the computer
- **High Card** — Draw one card each, highest wins
- **Dice Duel** — Roll two dice, highest total wins
- **Memory Match** — Flip and match pairs in the fewest moves
- **Slots** — Spend Jimmycoin to spin for pairs, triples, and rare jackpots
- **Neon Dash** — Geometry Dash–style endless runner (Chrome dino vibes). Free — no Jimmycoin. Separate survival-time leaderboard.

## Jimmycoin

Fake arcade currency (icon: cowboy-hat dog). Free games award Jimmycoin on wins; Slots and Make 21 spend/wager Jimmycoin. No real money.

## Google sign-in & global leaderboard

Players can **Sign in with Google**, choose a moderated username, and appear on a **global leaderboard** ranked by wins. Sessions persist in the browser (works great on Chromebooks when Chrome stays signed in).

Usernames block slurs and common bypass spellings (leetspeak, separators, stretched letters).

### One-time setup (required for sign-in / leaderboard)

1. Copy env template and fill values:

```bash
cp .env.example .env
```

2. **AUTH_SECRET** — generate a secret:

```bash
openssl rand -base64 32
```

3. **Google OAuth**
   - Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   - Create an OAuth 2.0 Client ID (Web application)
   - Authorized redirect URIs:
     - Local: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://YOUR_DOMAIN/api/auth/callback/google`
   - Put Client ID / Secret in `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

4. **Postgres database** (Neon, Supabase, or Vercel Postgres free tiers work)
   - Set `DATABASE_URL` in `.env` and in Vercel project env vars
   - Push the schema:

```bash
npm run db:push
```

5. Restart the app (`npm run dev`) or redeploy on Vercel.

Until these are set, the site still plays locally — the button shows “Sign-in setup needed” and the leaderboard stays empty.

## Getting Started

```bash
npm install
npm run db:push   # after DATABASE_URL is set
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Auth.js (NextAuth) + Google OAuth
- Prisma + PostgreSQL (global leaderboard)
- localStorage for guest Jimmycoin / session stats
- Web Audio API for optional sound effects

## Features

- Responsive design for desktop and mobile
- Google sign-in with moderated usernames
- Global wins leaderboard
- Persistent guest stats via localStorage
- Mute/unmute sound toggle
- Smooth animations and transitions
- Casino-lounge aesthetic (no real-money gambling)
