import { GAMES } from "@/lib/constants";
import GameCard from "@/components/hub/GameCard";
import StatsPanel from "@/components/hub/StatsPanel";
import MuteButton from "@/components/shared/MuteButton";

export default function HomePage() {
  return (
    <div className="bg-lounge-gradient min-h-screen">
      <MuteButton />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="mb-12 text-center animate-fade-in">
          <div className="mb-2 inline-block rounded-full border border-lounge-gold/30 bg-lounge-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lounge-gold">
            Arcade Lounge
          </div>
          <h1 className="font-display mt-4 text-5xl font-bold tracking-wide text-white sm:text-6xl">
            Game Lounge
          </h1>
          <p className="mt-3 text-lg text-gray-400">Pick a game and play.</p>
          <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-lounge-gold/50 to-transparent" />
        </header>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        <StatsPanel />

        <footer className="mt-12 text-center text-xs text-gray-600">
          For fun only — no real money, no accounts, no gambling.
        </footer>
      </div>
    </div>
  );
}
