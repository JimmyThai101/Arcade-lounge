"use client";

import { ReactNode } from "react";
import BackToHub from "./BackToHub";
import MuteButton from "./MuteButton";

interface GameLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function GameLayout({ title, subtitle, children }: GameLayoutProps) {
  return (
    <div className="bg-lounge-gradient min-h-screen">
      <MuteButton />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <BackToHub className="mb-6" />
        <header className="mb-8 text-center animate-fade-in">
          <h1 className="font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-400 sm:text-base">{subtitle}</p>
          )}
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
