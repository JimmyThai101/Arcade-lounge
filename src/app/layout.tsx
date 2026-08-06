import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Lounge",
  description: "Pick a game and play — a sleek arcade lounge with five fun mini-games.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
