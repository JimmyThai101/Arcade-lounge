import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      players: [],
      message: "Leaderboard goes live once the database is connected.",
    });
  }

  try {
    const players = await prisma.user.findMany({
      where: {
        username: { not: null },
        gamesPlayed: { gt: 0 },
      },
      orderBy: [{ wins: "desc" }, { gamesPlayed: "desc" }, { username: "asc" }],
      take: 25,
      select: {
        username: true,
        image: true,
        wins: true,
        losses: true,
        ties: true,
        gamesPlayed: true,
      },
    });

    return NextResponse.json({
      configured: true,
      players: players.map((p, index) => ({
        rank: index + 1,
        username: p.username!,
        image: p.image,
        wins: p.wins,
        losses: p.losses,
        ties: p.ties,
        gamesPlayed: p.gamesPlayed,
      })),
    });
  } catch {
    return NextResponse.json({
      configured: false,
      players: [],
      message: "Leaderboard temporarily unavailable.",
    });
  }
}
