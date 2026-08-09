"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadStats, recordDashRun } from "@/lib/stats";
import { formatDashTime } from "@/lib/utils";
import { playClick, playLose, playWin } from "@/lib/sounds";
import GameLayout from "@/components/shared/GameLayout";
import GameButton from "@/components/shared/GameButton";

type Phase = "ready" | "playing" | "dead";

type ObstacleKind = "spike" | "block" | "saw";

interface Obstacle {
  kind: ObstacleKind;
  x: number;
  w: number;
  h: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const GRAVITY = 2200;
const JUMP_VEL = -720;
const GROUND_Y_RATIO = 0.78;
const PLAYER_SIZE = 34;

export default function NeonDashGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("ready");
  const timeRef = useRef(0);
  const bestRef = useRef<number | undefined>(undefined);
  const speedRef = useRef(320);
  const playerYRef = useRef(0);
  const velYRef = useRef(0);
  const onGroundRef = useRef(true);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const spawnTimerRef = useRef(0);
  const lastTsRef = useRef(0);
  const bgOffsetRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("ready");
  const [liveTime, setLiveTime] = useState(0);
  const [runTime, setRunTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | undefined>(undefined);
  const [isNewBest, setIsNewBest] = useState(false);

  const resetWorld = useCallback((width: number, height: number) => {
    const groundY = height * GROUND_Y_RATIO;
    playerYRef.current = groundY - PLAYER_SIZE;
    velYRef.current = 0;
    onGroundRef.current = true;
    obstaclesRef.current = [];
    particlesRef.current = [];
    spawnTimerRef.current = 0.9;
    speedRef.current = 320;
    timeRef.current = 0;
    bgOffsetRef.current = 0;
    lastTsRef.current = 0;
    void width;
  }, []);

  const jump = useCallback(() => {
    if (phaseRef.current === "ready") {
      phaseRef.current = "playing";
      setPhase("playing");
      setIsNewBest(false);
      playClick();
      const canvas = canvasRef.current;
      if (canvas) resetWorld(canvas.clientWidth, canvas.clientHeight);
      if (onGroundRef.current) {
        velYRef.current = JUMP_VEL;
        onGroundRef.current = false;
      }
      return;
    }
    if (phaseRef.current !== "playing") return;
    if (!onGroundRef.current) return;
    velYRef.current = JUMP_VEL;
    onGroundRef.current = false;
    playClick();
  }, [resetWorld]);

  const die = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    phaseRef.current = "dead";
    setPhase("dead");
    const t = timeRef.current;
    setRunTime(t);
    const prevBest = bestRef.current;
    const newBest = recordDashRun(t);
    bestRef.current = newBest;
    setBestTime(newBest);
    setIsNewBest(prevBest === undefined || t > prevBest);
    if (prevBest === undefined || t > prevBest) playWin();
    else playLose();
  }, []);

  useEffect(() => {
    const stats = loadStats();
    const best = stats.games["neon-dash"]?.bestTime;
    bestRef.current = best;
    setBestTime(best);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        if (phaseRef.current === "dead") return;
        jump();
      }
      if (phaseRef.current === "dead" && (e.code === "Enter" || e.code === "Space")) {
        // handled by button / click restart
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(220, Math.floor(Math.min(420, w * 0.55)));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (phaseRef.current !== "playing") {
        resetWorld(w, h);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const spawnObstacle = (w: number, groundY: number) => {
      const roll = Math.random();
      let kind: ObstacleKind = "spike";
      if (roll > 0.72) kind = "block";
      else if (roll > 0.45) kind = "saw";

      if (kind === "spike") {
        obstaclesRef.current.push({ kind, x: w + 20, w: 28, h: 28 });
      } else if (kind === "saw") {
        const count = Math.random() > 0.5 ? 2 : 3;
        obstaclesRef.current.push({ kind, x: w + 20, w: 22 * count, h: 22 });
      } else {
        const h = 40 + Math.floor(Math.random() * 50);
        obstaclesRef.current.push({ kind, x: w + 20, w: 36, h });
      }
      void groundY;
    };

    const drawBg = (w: number, h: number, groundY: number) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#1a0b2e");
      g.addColorStop(0.55, "#2d1b4e");
      g.addColorStop(1, "#12081f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 2;
      const offset = bgOffsetRef.current;
      for (let i = 0; i < 6; i++) {
        const size = 80 + i * 40;
        const x = ((i * 140 - offset * (0.2 + i * 0.05)) % (w + size)) - size;
        const y = 30 + (i % 3) * 50;
        ctx.strokeRect(x, y, size, size * 0.7);
      }
      ctx.restore();

      // ground
      ctx.fillStyle = "#1e1033";
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = "#a78bfa";
      ctx.shadowColor = "#8b5cf6";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(w, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawPlayer = (x: number, y: number) => {
      ctx.save();
      ctx.shadowColor = "#39ff14";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(x, y, PLAYER_SIZE, PLAYER_SIZE);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#7dd3fc";
      ctx.fillRect(x + 7, y + 7, PLAYER_SIZE - 14, PLAYER_SIZE - 14);
      ctx.fillStyle = "#4c1d95";
      ctx.fillRect(x + 13, y + 13, PLAYER_SIZE - 26, PLAYER_SIZE - 26);
      ctx.restore();
    };

    const drawObstacle = (o: Obstacle, groundY: number) => {
      const top = groundY - o.h;
      if (o.kind === "spike" || o.kind === "saw") {
        const spikes = o.kind === "saw" ? Math.max(2, Math.round(o.w / 22)) : 1;
        const sw = o.w / spikes;
        for (let i = 0; i < spikes; i++) {
          const sx = o.x + i * sw;
          ctx.beginPath();
          ctx.moveTo(sx, groundY);
          ctx.lineTo(sx + sw / 2, top);
          ctx.lineTo(sx + sw, groundY);
          ctx.closePath();
          ctx.fillStyle = "#0a0612";
          ctx.fill();
          ctx.strokeStyle = "#f8fafc";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        ctx.fillStyle = "#12081f";
        ctx.fillRect(o.x, top, o.w, o.h);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#c4b5fd";
        ctx.shadowBlur = 10;
        ctx.strokeRect(o.x, top, o.w, o.h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(167,139,250,0.35)";
        ctx.strokeRect(o.x + 6, top + 6, o.w - 12, o.h - 12);
      }
    };

    const collides = (px: number, py: number, o: Obstacle, groundY: number) => {
      const pad = 4;
      const player = {
        x: px + pad,
        y: py + pad,
        w: PLAYER_SIZE - pad * 2,
        h: PLAYER_SIZE - pad * 2,
      };
      if (o.kind === "block") {
        const box = { x: o.x + 2, y: groundY - o.h + 2, w: o.w - 4, h: o.h - 2 };
        return (
          player.x < box.x + box.w &&
          player.x + player.w > box.x &&
          player.y < box.y + box.h &&
          player.y + player.h > box.y
        );
      }
      // triangle approx as lower center rect
      const box = {
        x: o.x + o.w * 0.2,
        y: groundY - o.h * 0.75,
        w: o.w * 0.6,
        h: o.h * 0.75,
      };
      return (
        player.x < box.x + box.w &&
        player.x + player.w > box.x &&
        player.y < box.y + box.h &&
        player.y + player.h > box.y
      );
    };

    const loop = (ts: number) => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const groundY = cssH * GROUND_Y_RATIO;
      const playerX = cssW * 0.18;

      if (!lastTsRef.current) lastTsRef.current = ts;
      let dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      dt = Math.min(dt, 0.033);

      if (phaseRef.current === "playing") {
        timeRef.current += dt;
        setLiveTime(timeRef.current);
        speedRef.current = Math.min(620, 320 + timeRef.current * 12);
        bgOffsetRef.current += speedRef.current * dt;

        velYRef.current += GRAVITY * dt;
        playerYRef.current += velYRef.current * dt;
        if (playerYRef.current >= groundY - PLAYER_SIZE) {
          playerYRef.current = groundY - PLAYER_SIZE;
          velYRef.current = 0;
          onGroundRef.current = true;
        } else {
          onGroundRef.current = false;
        }

        spawnTimerRef.current -= dt;
        if (spawnTimerRef.current <= 0) {
          spawnObstacle(cssW, groundY);
          const gap = Math.max(0.55, 1.35 - timeRef.current * 0.03);
          spawnTimerRef.current = gap + Math.random() * 0.35;
        }

        obstaclesRef.current = obstaclesRef.current
          .map((o) => ({ ...o, x: o.x - speedRef.current * dt }))
          .filter((o) => o.x + o.w > -40);

        // trail particles
        if (Math.random() > 0.4) {
          particlesRef.current.push({
            x: playerX + 4,
            y: playerYRef.current + PLAYER_SIZE * 0.5,
            vx: -80 - Math.random() * 60,
            vy: (Math.random() - 0.5) * 40,
            life: 0.35 + Math.random() * 0.25,
          });
        }
        particlesRef.current = particlesRef.current
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            life: p.life - dt,
          }))
          .filter((p) => p.life > 0);

        for (const o of obstaclesRef.current) {
          if (collides(playerX, playerYRef.current, o, groundY)) {
            die();
            break;
          }
        }
      }

      drawBg(cssW, cssH, groundY);

      for (const p of particlesRef.current) {
        ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.fillStyle = "#39ff14";
        ctx.fillRect(p.x, p.y, 6, 6);
        ctx.globalAlpha = 1;
      }

      for (const o of obstaclesRef.current) drawObstacle(o, groundY);
      drawPlayer(playerX, playerYRef.current);

      // HUD
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.fillText(`TIME ${formatDashTime(timeRef.current)}`, 16, 28);
      if (bestRef.current !== undefined) {
        ctx.fillStyle = "rgba(196,181,253,0.9)";
        ctx.fillText(`BEST ${formatDashTime(bestRef.current)}`, 16, 48);
      }

      if (phaseRef.current === "ready") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, cssW, cssH);
        ctx.fillStyle = "#c4b5fd";
        ctx.font = "700 22px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText("NEON DASH", cssW / 2, cssH * 0.38);
        ctx.font = "500 14px system-ui, sans-serif";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText("Tap / Space to jump — survive as long as you can", cssW / 2, cssH * 0.48);
        ctx.textAlign = "left";
      }

      if (phaseRef.current === "dead") {
        ctx.fillStyle = "rgba(10,6,18,0.45)";
        ctx.fillRect(0, 0, cssW, cssH);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [die, resetWorld]);

  const restart = () => {
    const canvas = canvasRef.current;
    if (canvas) resetWorld(canvas.clientWidth, canvas.clientHeight);
    phaseRef.current = "ready";
    setPhase("ready");
    setLiveTime(0);
    setRunTime(0);
    setIsNewBest(false);
    lastTsRef.current = 0;
  };

  return (
    <GameLayout
      title="Neon Dash"
      subtitle="Chrome-dino vibes, Geometry Dash look — free run, no Jimmycoin. Jump to survive."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-violet-300">Time</p>
            <p className="font-semibold text-white">
              {formatDashTime(phase === "playing" ? liveTime : runTime || liveTime)}
            </p>
          </div>
          <div className="rounded-lg border border-lounge-border bg-lounge-surface/60 px-4 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Best</p>
            <p className="font-semibold text-violet-200">
              {bestTime !== undefined ? formatDashTime(bestTime) : "—"}
            </p>
          </div>
        </div>

        <div
          ref={wrapRef}
          className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-violet-400/30 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
          onPointerDown={() => {
            if (phase === "dead") return;
            jump();
          }}
        >
          <canvas ref={canvasRef} className="block w-full touch-none" />
        </div>

        {phase === "dead" && (
          <div className="space-y-3 text-center animate-slide-up">
            <p className="text-lg font-bold text-white">
              Crashed at {formatDashTime(runTime)}
              {isNewBest ? " — New best!" : ""}
            </p>
            <p className="text-sm text-gray-400">
              Sign in with a username to appear on the Neon Dash time leaderboard.
            </p>
            <GameButton onClick={restart} variant="gold">
              Run Again
            </GameButton>
          </div>
        )}

        {phase === "ready" && (
          <div className="flex justify-center">
            <GameButton onClick={jump} variant="gold">
              Start Run
            </GameButton>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
