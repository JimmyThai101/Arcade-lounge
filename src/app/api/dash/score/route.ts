import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!session.user.username) {
    return NextResponse.json(
      { error: "Set a username before syncing Neon Dash times." },
      { status: 400 }
    );
  }

  let body: { time?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const time = body.time;
  if (typeof time !== "number" || !Number.isFinite(time) || time <= 0 || time > 36000) {
    return NextResponse.json({ error: "Invalid time." }, { status: 400 });
  }

  const rounded = Math.round(time * 100) / 100;
  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { dashBestTime: true },
  });

  const prev = existing?.dashBestTime ?? 0;
  if (rounded <= prev) {
    return NextResponse.json({
      ok: true,
      improved: false,
      dashBestTime: prev || null,
    });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { dashBestTime: rounded },
    select: { username: true, dashBestTime: true },
  });

  return NextResponse.json({
    ok: true,
    improved: true,
    dashBestTime: user.dashBestTime,
  });
}
