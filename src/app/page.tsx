import { GAMES } from "@/lib/constants";
import GameCard from "@/components/hub/GameCard";
import StatsPanel from "@/components/hub/StatsPanel";
import Leaderboard from "@/components/hub/Leaderboard";
import JimmycoinBadge from "@/components/shared/JimmycoinBadge";

export default function HomePage() {
  return (
    <div className="bg-lounge-gradient min-h-screen">
      <div className="fixed top-4 left-4 z-50">
        <JimmycoinBadge />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-10 pt-16 sm:px-6 sm:pb-16 sm:pt-20">
        <header className="mb-12 text-center animate-fade-in">
          <div className="mb-2 inline-block rounded-full border border-lounge-gold/30 bg-lounge-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lounge-gold">
            Arcade Lounge
          </div>
          <h1 className="font-display mt-4 text-5xl font-bold tracking-wide text-white sm:text-6xl">
            Game Lounge
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Win free games to earn Jimmycoin — spend them on Slots.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Sign in with Google to claim a username and flex on the global leaderboard.
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-lounge-gold/50 to-transparent" />
        </header>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        <Leaderboard />
        <StatsPanel />

        <footer className="mt-12 text-center text-xs text-gray-600">
          For fun only — Jimmycoin is fake currency. No real money, no gambling.
        </footer>
      </div>
    </div>
  );
}
