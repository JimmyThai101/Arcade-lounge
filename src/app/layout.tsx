import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/auth/Providers";
import TopControls from "@/components/shared/TopControls";

export const metadata: Metadata = {
  title: "Game Lounge",
  description: "Pick a game and play — a sleek arcade lounge with seven fun mini-games.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <TopControls />
          {children}
        </Providers>
      </body>
    </html>
  );
}
