import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { LyhostCalendarComponent } from '../lyhost-calendar/lyhost-calendar';
import { Stay } from '../lyhost-calendar/calendar-bars';
import { LyhostBadgeComponent } from '../lyhost-badge/lyhost-badge';

type ModuleId = 'res' | 'guests' | 'shifts' | 'fin' | 'exp';

interface LandingModule {
  id: ModuleId;
  title: string;
  text: string;
}

/** What each module's walkthrough has done so far. */
interface WalkState {
  ropen?: boolean;
  paid?: boolean;
  focus?: boolean;
  q?: string;
  hover?: boolean;
  gopen?: boolean;
  drag?: boolean;
  hot?: boolean;
  assigned?: boolean;
  published?: boolean;
}

interface Walkthrough {
  on: boolean;
  cur: { x: number; y: number };
  down: boolean;
  click: number;
  toast: string;
  toastOn: boolean;
  s: WalkState;
}

const MODULES: LandingModule[] = [
  {
    id: 'res',
    title: 'Reservas y disponibilidad',
    text: 'Todas tus reservas y habitaciones en un calendario. Sabes qué está ocupado, quién llega hoy y qué falta por pagar.',
  },
  {
    id: 'guests',
    title: 'Historial de huéspedes',
    text: 'Cada persona que se queda contigo, con sus estadías y preferencias.',
  },
  {
    id: 'shifts',
    title: 'Turnos y equipo',
    text: 'Arma los turnos de recepción, limpieza y mantenimiento, y sabe quién cubre cada uno.',
  },
  {
    id: 'fin',
    title: 'Finanzas',
    text: 'Ingresos, gastos y pagos pendientes de cada propiedad, actualizados al instante.',
  },
  {
    id: 'exp',
    title: 'Experiencias para tus visitantes',
    text: 'Publica tours y actividades, controla sus cupos y súmalos a la estadía de tus huéspedes.',
  },
];

const SEARCH_QUERY = 'Santi';
const REDUCED_STATE: WalkState = {
  ropen: true,
  paid: true,
  q: SEARCH_QUERY,
  gopen: true,
  assigned: true,
  published: true,
};

@Component({
  selector: 'app-lyhost-features',
  imports: [LyhostCalendarComponent, LyhostBadgeComponent],
  templateUrl: './lyhost-features.html',
  styleUrls: ['../../lyhost-theme.css', './lyhost-features.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyhostFeaturesComponent {
  private readonly bandEl = viewChild.required<ElementRef<HTMLElement>>('band');
  private readonly pbEl = viewChild.required<ElementRef<HTMLElement>>('pb');
  private observer: IntersectionObserver | null = null;

  private timers: ReturnType<typeof setTimeout>[] = [];
  private reduceMotion = false;

  readonly modules = MODULES;
  readonly activeIndex = signal(0);
  /** Modules advance on their own until the visitor picks one. */
  readonly auto = signal(true);
  readonly inView = signal(false);
  readonly autoRun = computed(() => this.auto() && this.inView());
  readonly current = computed(() => MODULES[this.activeIndex()]);

  readonly walk = signal<Walkthrough>({
    on: false,
    cur: { x: 0, y: 0 },
    down: false,
    click: 0,
    toast: '',
    toastOn: false,
    s: {},
  });
  readonly s = computed(() => this.walk().s);
  readonly query = computed(() => this.s().q ?? '');
  readonly cursorTransform = computed(() => {
    const c = this.walk().cur;
    return `translate(${Math.round(c.x)}px,${Math.round(c.y)}px)`;
  });
  readonly rippleClass = computed(() => {
    const c = this.walk().click;
    return c === 0 ? 'ripple' : c % 2 ? 'ripple ripple-a' : 'ripple ripple-b';
  });

  readonly stays: [string, Stay[]][] = [
    ['Hab. 101', [[0, 1, 'ly', 'Valentina Ruiz', 'bar'], [2, 4, 'bk', 'Lucas Schmidt']]],
    ['Hab. 102', [[-1, 4, 'ab', 'Sofía Marín']]],
    ['Hab. 204', [[0, 3, 'ly', 'Santiago Arango'], [3, 2, 'bk', 'Lena Novak']]],
  ];

  readonly revenueWeeks = [3.9, 4.6, 5.24, 4.7].map((value, i) => ({
    spot: `w${i + 1}`,
    height: Math.round((value / 5.24) * 100),
    current: i === 2,
  }));

  constructor() {
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      this.observer?.disconnect();
    });
  }

  /** Pause or resume the auto-advancing tour; picking a module also pauses it. */
  toggleTour(): void {
    if (this.auto()) {
      this.clearTimers();
      this.auto.set(false);
      return;
    }
    this.auto.set(true);
    this.goTo(this.activeIndex(), false);
  }

  select(index: number): void {
    this.goTo(index, true);
  }

  onProgressEnd(event: AnimationEvent): void {
    if (event.target !== event.currentTarget) return;
    this.goTo((this.activeIndex() + 1) % MODULES.length, false);
  }

  private start(): void {
    this.reduceMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (this.reduceMotion) {
      this.auto.set(false);
      this.patch({ s: REDUCED_STATE });
      return;
    }
    // Auto-advance the modules only while the band is on screen
    this.observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        if (visible === this.inView()) return;
        this.inView.set(visible);
        if (visible) this.at(60, () => this.runModule(this.current().id));
        else this.clearTimers();
      },
      { threshold: 0.35 },
    );
    this.observer.observe(this.bandEl().nativeElement);
  }

  /** Switch module and play its walkthrough once the new panel has rendered. */
  private goTo(index: number, manual: boolean): void {
    if (manual) this.auto.set(false);
    this.activeIndex.set(index);
    this.clearTimers();
    if (this.reduceMotion) return;
    this.at(60, () => this.runModule(MODULES[index].id));
  }

  private runModule(id: ModuleId): void {
    const at = (ms: number, fn: () => void) => this.at(ms, fn);
    const s = (state: WalkState) => this.patchState(state);
    this.clearTimers();
    this.walk.update((w) => ({ ...w, on: true, down: false, toastOn: false, s: {} }));
    at(40, () => this.move('rest'));

    if (id === 'res') {
      at(500, () => this.move('bar'));
      at(1300, () => {
        this.click();
        s({ ropen: true });
      });
      at(2000, () => this.move('pay'));
      at(2850, () => this.click());
      at(3050, () => {
        s({ paid: true });
        this.toast('Pago registrado · $ 260.000');
      });
      at(3600, () => this.move('rest'));
    } else if (id === 'guests') {
      at(500, () => this.move('search'));
      at(1300, () => {
        this.click();
        s({ focus: true });
      });
      for (let n = 1; n <= SEARCH_QUERY.length; n++) {
        at(1450 + n * 95, () => s({ q: SEARCH_QUERY.slice(0, n) }));
      }
      at(2300, () => this.move('vg'));
      at(3000, () => s({ hover: true }));
      at(3150, () => this.click());
      at(3350, () => s({ gopen: true, focus: false, hover: false }));
      at(3900, () => this.move('rest'));
    } else if (id === 'shifts') {
      at(500, () => this.move('chip'));
      at(1300, () => {
        this.patch({ down: true });
        s({ drag: true });
      });
      at(1450, () => this.move('slot'));
      at(2050, () => s({ hot: true }));
      at(2350, () => {
        this.walk.update((w) => ({ ...w, down: false, click: w.click + 1 }));
        s({ drag: false, hot: false, assigned: true });
        this.toast('Turno de noche del miércoles cubierto');
      });
      at(3000, () => this.move('rest'));
    } else if (id === 'fin') {
      at(500, () => this.move('w3'));
      at(1300, () => s({ hover: true }));
      at(2700, () => {
        s({ hover: false });
        this.move('export');
      });
      at(3500, () => this.click());
      at(3650, () => this.toast('Reporte de diciembre listo'));
      at(4100, () => this.move('rest'));
    } else {
      at(500, () => this.move('sw'));
      at(1300, () => this.click());
      at(1450, () => {
        s({ published: true });
        this.toast('Experiencia publicada');
      });
      at(2100, () => this.move('rest'));
    }
  }

  private move(name: string): void {
    this.patch({ cur: this.spot(name) });
  }

  /** Centre of a `[data-spot]` element inside the panel body, or the resting corner. */
  private spot(name: string): { x: number; y: number } {
    const b = this.pbEl().nativeElement;
    const br = b.getBoundingClientRect();
    const rest = { x: br.width - 56, y: br.height - 72 };
    if (name === 'rest') return rest;
    const el = b.querySelector(`[data-spot="${name}"]`);
    if (!el) return rest;
    const r = el.getBoundingClientRect();
    return { x: r.left - br.left + r.width * 0.5, y: r.top - br.top + r.height * 0.55 };
  }

  private click(): void {
    this.walk.update((w) => ({ ...w, down: true, click: w.click + 1 }));
    this.at(160, () => this.patch({ down: false }));
  }

  private toast(text: string): void {
    this.patch({ toast: text, toastOn: true });
    this.at(2600, () => this.patch({ toastOn: false }));
  }

  private patch(p: Partial<Walkthrough>): void {
    this.walk.update((w) => ({ ...w, ...p }));
  }

  private patchState(state: WalkState): void {
    this.walk.update((w) => ({ ...w, s: { ...w.s, ...state } }));
  }

  private at(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
