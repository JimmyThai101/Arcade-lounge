import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Result = "win" | "loss" | "tie";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!session.user.username) {
    return NextResponse.json(
      { error: "Set a username before syncing stats." },
      { status: 400 }
    );
  }

  let body: { result?: Result };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = body.result;
  if (result !== "win" && result !== "loss" && result !== "tie") {
    return NextResponse.json({ error: "Invalid result." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      gamesPlayed: { increment: 1 },
      wins: result === "win" ? { increment: 1 } : undefined,
      losses: result === "loss" ? { increment: 1 } : undefined,
      ties: result === "tie" ? { increment: 1 } : undefined,
    },
    select: {
      username: true,
      wins: true,
      losses: true,
      ties: true,
      gamesPlayed: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
