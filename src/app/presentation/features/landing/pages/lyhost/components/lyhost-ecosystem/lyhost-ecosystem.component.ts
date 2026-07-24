import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCalendarCheckFill,
  bootstrapPeopleFill,
  bootstrapClockFill,
  bootstrapCashStack,
  bootstrapStarFill,
  bootstrapBarChartFill,
} from '@ng-icons/bootstrap-icons';

const COLOR_PRIMARY = '#2ec094';

const ORBIT_MS = 22000;
const TRIP_MS = 1800;
const GAP_MS = 1400;
const CYCLE_MS = (TRIP_MS + GAP_MS) * 2;

const RADIUS = 128;
const CX = 180;
const CY = 180;

const NODE_DEFS = [
  { label: 'Reservas', baseAngle: 0, accent: '#2ec094', icon: 'bootstrapCalendarCheckFill', cycleOffset: 0 },
  { label: 'Huéspedes', baseAngle: 60, accent: '#3b82f6', icon: 'bootstrapPeopleFill', cycleOffset: 600 },
  { label: 'Turnos', baseAngle: 120, accent: '#f59e0b', icon: 'bootstrapClockFill', cycleOffset: 1200 },
  { label: 'Finanzas', baseAngle: 180, accent: '#10b981', icon: 'bootstrapCashStack', cycleOffset: 1800 },
  { label: 'Experiencias', baseAngle: 240, accent: '#8b5cf6', icon: 'bootstrapStarFill', cycleOffset: 2400 },
  { label: 'Reportes', baseAngle: 300, accent: '#ef4444', icon: 'bootstrapBarChartFill', cycleOffset: 3000 },
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
    result.push({ x: lerp(CX, nx, p1), y: lerp(CY, ny, p1), opacity: alpha(p1), color: COLOR_PRIMARY });

    if (t > TRIP_MS * 0.38) {
      const p2 = (t - TRIP_MS * 0.38) / TRIP_MS;
      result.push({
        x: lerp(CX, nx, p2),
        y: lerp(CY, ny, p2),
        opacity: alpha(p2) * phaseAlpha,
        color: COLOR_PRIMARY,
      });
    }
  }

  const inStart = TRIP_MS + GAP_MS;
  if (t >= inStart && t < inStart + TRIP_MS) {
    const tIn = t - inStart;
    const phaseAlpha = tIn > TRIP_MS * 0.82 ? (TRIP_MS - tIn) / (TRIP_MS * 0.18) : 1;

    const p1 = tIn / TRIP_MS;
    result.push({ x: lerp(nx, CX, p1), y: lerp(ny, CY, p1), opacity: alpha(p1), color: COLOR_PRIMARY });

    if (tIn > TRIP_MS * 0.38) {
      const p2 = (tIn - TRIP_MS * 0.38) / TRIP_MS;
      result.push({
        x: lerp(nx, CX, p2),
        y: lerp(ny, CY, p2),
        opacity: alpha(p2) * phaseAlpha,
        color: COLOR_PRIMARY,
      });
    }
  }

  return result;
}

@Component({
  selector: 'app-lyhost-ecosystem',
  standalone: true,
  imports: [NgIconComponent],
  providers: [
    provideIcons({
      bootstrapCalendarCheckFill,
      bootstrapPeopleFill,
      bootstrapClockFill,
      bootstrapCashStack,
      bootstrapStarFill,
      bootstrapBarChartFill,
    }),
  ],
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
    'Reservas y disponibilidad',
    'Historial de huéspedes',
    'Turnos y equipo',
    'Finanzas',
    'Experiencias para tus visitantes',
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
