import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

const ORBIT_MS = 22000;
const TRIP_MS = 1800;
const GAP_MS = 1400;
const CYCLE_MS = (TRIP_MS + GAP_MS) * 2;

const RADIUS = 128;
const CX = 170;
const CY = 170;

const NODE_DEFS = [
  { label: 'Airbnb', baseAngle: 0, accent: '#FF5A5F', cycleOffset: 0 },
  { label: 'Booking', baseAngle: 180, accent: '#003580', cycleOffset: 0 },
] as const;

function getPos(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * RADIUS, y: CY + Math.sin(rad) * RADIUS };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function alpha(t: number) {
  if (t < 0.2) return t / 0.2;
  if (t > 0.8) return (1 - t) / 0.2;
  return 1;
}

type Particle = { x: number; y: number; opacity: number; color: string };

type OrbitNode = (typeof NODE_DEFS)[number] & {
  x: number;
  y: number;
  particles: Particle[];
};

function computeParticles(nx: number, ny: number, elapsed: number, cycleOffset: number): Particle[] {
  const t = ((elapsed + cycleOffset) % CYCLE_MS + CYCLE_MS) % CYCLE_MS;
  const result: Particle[] = [];

  if (t < TRIP_MS) {
    const phaseAlpha = t > TRIP_MS * 0.82 ? (TRIP_MS - t) / (TRIP_MS * 0.18) : 1;

    const p1 = t / TRIP_MS;
    result.push({ x: lerp(CX, nx, p1), y: lerp(CY, ny, p1), opacity: alpha(p1), color: '#009A44' });

    if (t > TRIP_MS * 0.38) {
      const p2 = (t - TRIP_MS * 0.38) / TRIP_MS;
      result.push({
        x: lerp(CX, nx, p2),
        y: lerp(CY, ny, p2),
        opacity: alpha(p2) * phaseAlpha,
        color: '#009A44',
      });
    }
  }

  const inStart = TRIP_MS + GAP_MS;
  if (t >= inStart && t < inStart + TRIP_MS) {
    const tIn = t - inStart;
    const phaseAlpha = tIn > TRIP_MS * 0.82 ? (TRIP_MS - tIn) / (TRIP_MS * 0.18) : 1;

    const p1 = tIn / TRIP_MS;
    result.push({ x: lerp(nx, CX, p1), y: lerp(ny, CY, p1), opacity: alpha(p1), color: '#6CC24A' });

    if (tIn > TRIP_MS * 0.38) {
      const p2 = (tIn - TRIP_MS * 0.38) / TRIP_MS;
      result.push({
        x: lerp(nx, CX, p2),
        y: lerp(ny, CY, p2),
        opacity: alpha(p2) * phaseAlpha,
        color: '#6CC24A',
      });
    }
  }

  return result;
}

@Component({
  selector: 'app-lyhost-ecosystem',
  standalone: true,
  imports: [],
  templateUrl: './lyhost-ecosystem.component.html',
  styleUrl: './lyhost-ecosystem.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostEcosystemComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  orbitDeg = 0;
  elapsed = 0;

  private startAt: number | null = null;
  private rafId = 0;

  readonly checklistItems = [
    'Sincronización en tiempo real',
    'Calendario unificado',
    'Precios dinámicos',
    'Reportes consolidados',
  ];

  get nodes(): OrbitNode[] {
    return NODE_DEFS.map((cfg) => {
      const { x, y } = getPos(this.orbitDeg + cfg.baseAngle);
      const particles = computeParticles(x, y, this.elapsed, cfg.cycleOffset);
      return { ...cfg, x, y, particles };
    });
  }

  ngOnInit(): void {
    const tick = (timestamp: number) => {
      this.startAt ??= timestamp;

      const elapsed = timestamp - this.startAt;
      this.orbitDeg = ((elapsed / ORBIT_MS) * 360) % 360;
      this.elapsed = elapsed;
      this.cdr.markForCheck();
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
  }

  readonly cx = CX;
  readonly cy = CY;
  readonly radius = RADIUS;
}
