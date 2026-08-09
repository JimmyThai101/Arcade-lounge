import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      players: [],
      message: "Neon Dash leaderboard goes live once the database is connected.",
    });
  }

  try {
    const players = await prisma.user.findMany({
      where: {
        username: { not: null },
        dashBestTime: { not: null, gt: 0 },
      },
      orderBy: [{ dashBestTime: "desc" }, { username: "asc" }],
      take: 25,
      select: {
        username: true,
        image: true,
        dashBestTime: true,
      },
    });

    return NextResponse.json({
      configured: true,
      players: players.map((p, index) => ({
        rank: index + 1,
        username: p.username!,
        image: p.image,
        bestTime: p.dashBestTime!,
      })),
    });
  } catch {
    return NextResponse.json({
      configured: false,
      players: [],
      message: "Neon Dash leaderboard temporarily unavailable.",
    });
  }
}
