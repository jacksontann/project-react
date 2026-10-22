import { useMemo } from 'react';
import { createRandom } from 'lib/random';
import { cn } from 'lib/cn';
import { FLOORS, UNITS_PER_FACADE } from './tower';

/**
 * Static SVG night scene. Shown instantly on first paint, while the WebGL scene streams in,
 * and permanently when WebGL is unavailable. Deterministic so it never "flickers" between loads.
 */
export function ScenePoster({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_28%_100%,#161c2e_0%,#0a0c13_45%,#06070a_75%)]" />
      <Skyline />
      <Tower />
    </div>
  );
}

const FLOOR_H = 20;
const BAY_W = 20;
const BODY_X = 16;
const BODY_TOP = 70;
const BODY_W = BAY_W * UNITS_PER_FACADE;
const BODY_H = FLOOR_H * FLOORS;
const SIDE_W = 34;

function Tower() {
  const windows = useMemo(() => {
    const random = createRandom(7);
    return Array.from({ length: FLOORS * UNITS_PER_FACADE * 2 }, () => random() < 0.36);
  }, []);

  const podiumTop = BODY_TOP + BODY_H;

  return (
    <svg
      viewBox="0 0 140 620"
      className={cn(
        'absolute left-1/2 top-[6svh] h-[32svh] -translate-x-1/2',
        'sm:bottom-0 sm:left-[8%] sm:top-auto sm:h-[78vh] sm:translate-x-0',
        'lg:left-[24%] lg:h-[88vh]',
      )}
    >
      <defs>
        <filter id="poster-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="poster-front" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#151a26" />
          <stop offset="1" stopColor="#0c0f17" />
        </linearGradient>
      </defs>

      {/* Mast + beacon */}
      <line x1="56" x2="56" y1="18" y2="54" stroke="#2a3142" strokeWidth="1.5" />
      <circle cx="56" cy="16" r="2.4" fill="#ff4d4d" filter="url(#poster-glow)" />
      {/* Crown */}
      <rect x={BODY_X + 8} y="52" width={BODY_W - 16} height="18" fill="#10141e" />
      <polygon
        points={`${BODY_X + BODY_W - 8},52 ${BODY_X + BODY_W - 8 + SIDE_W * 0.6},46 ${BODY_X + BODY_W - 8 + SIDE_W * 0.6},64 ${BODY_X + BODY_W - 8},70`}
        fill="#0a0d14"
      />

      {/* Front facade */}
      <rect x={BODY_X} y={BODY_TOP} width={BODY_W} height={BODY_H} fill="url(#poster-front)" />
      {/* Side facade, foreshortened */}
      <polygon
        points={`${BODY_X + BODY_W},${BODY_TOP} ${BODY_X + BODY_W + SIDE_W},${BODY_TOP - 10} ${BODY_X + BODY_W + SIDE_W},${podiumTop - 10} ${BODY_X + BODY_W},${podiumTop}`}
        fill="#090b11"
      />

      {Array.from({ length: FLOORS }, (_, f) => {
        const y = BODY_TOP + (FLOORS - 1 - f) * FLOOR_H;
        return (
          <g key={f}>
            <line
              x1={BODY_X}
              x2={BODY_X + BODY_W}
              y1={y + FLOOR_H}
              y2={y + FLOOR_H}
              stroke="#1f2533"
              strokeWidth="0.8"
            />
            {Array.from({ length: UNITS_PER_FACADE }, (_, u) => {
              const lit = windows[f * UNITS_PER_FACADE * 2 + u];
              return (
                <rect
                  key={u}
                  x={BODY_X + u * BAY_W + 3}
                  y={y + 5}
                  width={BAY_W - 6}
                  height={FLOOR_H - 9}
                  rx="0.6"
                  fill={lit ? '#ffb547' : '#121725'}
                  filter={lit ? 'url(#poster-glow)' : undefined}
                />
              );
            })}
            {Array.from({ length: UNITS_PER_FACADE }, (_, u) => {
              const lit = windows[f * UNITS_PER_FACADE * 2 + UNITS_PER_FACADE + u];
              const step = SIDE_W / UNITS_PER_FACADE;
              const x0 = BODY_X + BODY_W + u * step + 1.6;
              const slope = -10 / SIDE_W;
              const yTop = y + 5 + slope * (x0 - BODY_X - BODY_W);
              return (
                <polygon
                  key={`s${u}`}
                  points={`${x0},${yTop} ${x0 + step - 3.2},${yTop + slope * (step - 3.2)} ${x0 + step - 3.2},${yTop + slope * (step - 3.2) + FLOOR_H - 9} ${x0},${yTop + FLOOR_H - 9}`}
                  fill={lit ? '#e8a347' : '#0e121c'}
                  opacity={lit ? 0.85 : 1}
                />
              );
            })}
          </g>
        );
      })}

      {/* Podium + lobby glow */}
      <rect x={BODY_X - 6} y={podiumTop} width={BODY_W + 12} height="50" fill="#0b0e15" />
      <rect
        x={BODY_X + 18}
        y={podiumTop + 22}
        width={BODY_W - 36}
        height="22"
        fill="#ffd9a0"
        opacity="0.75"
        filter="url(#poster-glow)"
      />
    </svg>
  );
}

function Skyline() {
  const buildings = useMemo(() => {
    const random = createRandom(42);
    let x = 0;
    const list: Array<{ x: number; w: number; h: number; lights: Array<[number, number]> }> = [];
    while (x < 2400) {
      const w = 40 + random() * 90;
      const h = 60 + random() * 200;
      const lights: Array<[number, number]> = [];
      for (let ly = 300 - h + 10; ly < 290; ly += 14) {
        for (let lx = x + 6; lx < x + w - 8; lx += 12) {
          if (random() < 0.12) lights.push([lx, ly]);
        }
      }
      list.push({ x, w, h, lights });
      x += w + 4 + random() * 18;
    }
    return list;
  }, []);

  return (
    <svg
      viewBox="0 0 2400 300"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 h-[34vh] w-full opacity-80"
    >
      {buildings.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={300 - b.h} width={b.w} height={b.h} fill="#080a10" />
          {b.lights.map(([lx, ly]) => (
            <rect
              key={`${lx}-${ly}`}
              x={lx}
              y={ly}
              width="5"
              height="6"
              fill="#d89a4a"
              opacity="0.55"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
