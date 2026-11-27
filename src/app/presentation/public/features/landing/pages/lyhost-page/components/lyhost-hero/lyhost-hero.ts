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
import { Router } from '@angular/router';
import { ButtonComponent } from '@/presentation/shared/components/button/button';
import { LyhostCalendarComponent } from '../lyhost-calendar/lyhost-calendar';
import { Stay } from '../lyhost-calendar/calendar-bars';
import { landingText } from '../../i18n/lyhost-i18n';

type CursorSpot = 'rest' | 'start' | 'end' | 'guest' | 'confirm';

/** One frame of the hero walkthrough: someone books room 204 for Ana Restrepo. */
interface DemoState {
  on: boolean;
  cur: CursorSpot;
  down: boolean;
  click: number;
  sel: number;
  drawer: boolean;
  focus: boolean;
  typed: string;
  chip: boolean;
  press: boolean;
  booked: boolean;
  fade: boolean;
  toast: boolean;
  k2: number;
}

const DEMO_START: DemoState = {
  on: false,
  cur: 'rest',
  down: false,
  click: 0,
  sel: 0,
  drawer: false,
  focus: false,
  typed: '',
  chip: false,
  press: false,
  booked: false,
  fade: false,
  toast: false,
  k2: 0,
};

const GUEST_NAME = 'Ana Restrepo';
/** Row of Hab. 204 in the calendar, and the hero's row height (matches --row-h in lyhost-hero.css). */
const DEMO_ROW = 4;
const ROW_CONTENT = 46;
/** Row plus its 1px divider. */
const ROW_HEIGHT = ROW_CONTENT + 1;
/** Bars are 28px tall, centred in the row. */
const BAR_TOP = (ROW_CONTENT - 28) / 2;

@Component({
  selector: 'app-lyhost-hero',
  imports: [ButtonComponent, LyhostCalendarComponent],
  templateUrl: './lyhost-hero.html',
  styleUrls: ['../../lyhost-theme.css', './lyhost-hero.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'fitHero()',
  },
})
export class LyhostHeroComponent {
  private readonly router = inject(Router);
  /** Hero copy and the demo panel's labels. */
  readonly h = landingText('hero');
  private readonly calendar = landingText('calendar');

  private readonly fitEl = viewChild.required<ElementRef<HTMLElement>>('fit');
  private readonly mainEl = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly guestEl = viewChild.required<ElementRef<HTMLElement>>('guest');
  private readonly confirmEl = viewChild.required<ElementRef<HTMLElement>>('confirm');

  private timers: ReturnType<typeof setTimeout>[] = [];
  private raf = 0;
  private raf2 = 0;

  /** Count-up progress of the hero figures (0 → 1). */
  readonly k = signal(0);
  readonly demo = signal<DemoState>(DEMO_START);
  /** Narrow frames show 6 days from today instead of 10 from sáb 14 nov. */
  readonly compact = signal(false);
  readonly fit = signal({ s: 1, h: 0, w: 0 });
  /** The walkthrough loops forever, so it gets a pause button. */
  readonly paused = signal(false);
  readonly reducedMotion = signal(false);

  readonly from = computed(() => (this.compact() ? 0 : -2));
  readonly cols = computed(() => (this.compact() ? 6 : 10));
  readonly rangeLabel = computed(() => (this.compact() ? this.h().panel.rangeCompact : this.h().panel.rangeWide));
  /** Column where the new booking starts (jue 19, afternoon arrival). */
  private readonly s0 = computed(() => 3 - this.from() + 0.5);

  readonly occupancy = computed(() => `${Math.round(74 * this.k() + 4 * this.demo().k2)} %`);
  readonly directCount = computed(() => {
    const d = this.demo();
    return String(6 + (d.booked && !d.fade ? 1 : 0));
  });

  readonly fitOuterHeight = computed(() => {
    const f = this.fit();
    return f.s < 1 && f.h ? `${f.h}px` : null;
  });
  readonly fitInnerWidth = computed(() => {
    const f = this.fit();
    return f.s < 1 && f.w ? `${Math.round(f.w / f.s)}px` : null;
  });
  readonly fitInnerTransform = computed(() => {
    const f = this.fit();
    return f.s < 1 && f.w ? `scale(${f.s})` : null;
  });

  readonly cursorTransform = computed(() => {
    const p = this.spot(this.demo().cur);
    return `translate(${Math.round(p.x)}px,${Math.round(p.y)}px)`;
  });
  readonly rippleClass = computed(() => {
    const c = this.demo().click;
    if (c === 0) return 'ripple';
    // Alternate the two keyframes so each click restarts the ripple
    return c % 2 ? 'ripple ripple-a' : 'ripple ripple-b';
  });

  readonly selTop = `${DEMO_ROW * ROW_HEIGHT + BAR_TOP}px`;
  readonly selLeft = computed(() => `calc(var(--lab) + (100% - var(--lab)) * ${this.s0() / this.cols()} + 2px)`);
  readonly selWidth = computed(() => this.barWidth(this.demo().sel));
  readonly newWidth = computed(() => this.barWidth(4));
  readonly newClipsRight = computed(() => 4 > this.cols() - this.s0());

  readonly stays = computed<[string, Stay[]][]>(() => [
    [`${this.calendar().room} 101`, [[-2, 2, 'bk', 'Daniel Ospina'], [0, 1, 'ly', 'Valentina Ruiz'], [2, 4, 'bk', 'Lucas Schmidt'], [7, 3, 'ab', 'Emma Laurent']]],
    [`${this.calendar().room} 102`, [[-1, 4, 'ab', 'Sofía Marín'], [4, 2, 'ly', 'Julián Vélez']]],
    [`${this.calendar().room} 104`, [[-4, 3, 'bk', 'Mariana López'], [1, 5, 'ab', 'Noah Fischer']]],
    [`${this.calendar().room} 201`, [[-3, 2, 'ly', 'Carlos Restrepo'], [3, 3, 'bk', 'Lucía Fernández'], [6, 1, 'ly', 'Diego Zapata']]],
    [`${this.calendar().room} 204`, [[-5, 4, 'ly', 'Laura Henao'], [0, 3, 'ly', 'Santiago Arango'], [7, 4, 'ab', 'Ethan Clark']]],
    [`${this.calendar().room} 305`, [[-3, 3, 'ab', 'Mia Johnson'], [0, 4, 'bk', 'Felipe Montoya'], [6, 2, 'ly', 'Daniela Correa']]],
  ]);


  constructor() {
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      cancelAnimationFrame(this.raf);
      cancelAnimationFrame(this.raf2);
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  /** Freeze the walkthrough on its current frame, or start it again from the top. */
  toggleDemo(): void {
    if (this.paused()) {
      this.paused.set(false);
      this.runDemo();
      return;
    }
    this.paused.set(true);
    this.clearTimers();
  }

  /** Scale the product frame so the whole hero fits the first screen. */
  fitHero(): void {
    const el = this.fitEl().nativeElement;
    const inner = el.firstElementChild as HTMLElement | null;
    if (!inner) return;
    const w = el.offsetWidth;
    const compact = w < 600;
    if (compact !== this.compact()) this.compact.set(compact);
    if (window.innerWidth < 861) {
      if (this.fit().s !== 1) this.fit.set({ s: 1, h: 0, w: 0 });
      return;
    }
    let top = 0;
    for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
    // offsetHeight ignores the scale transform
    const natural = inner.offsetHeight;
    const avail = window.innerHeight - top - 24;
    const s = Math.round(Math.max(0.55, Math.min(1, avail / natural)) * 1000) / 1000;
    const h = Math.ceil(natural * s);
    const f = this.fit();
    if (Math.abs(f.s - s) > 0.002 || Math.abs(f.h - h) > 1 || Math.abs(f.w - w) > 1) this.fit.set({ s, h, w });
  }

  private start(): void {
    this.fitHero();
    this.at(80, () => this.fitHero());
    this.at(400, () => this.fitHero());

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.reducedMotion.set(true);
      this.k.set(1);
      this.demo.set({ ...DEMO_START, booked: true, k2: 1 });
      return;
    }

    this.at(2300, () => this.runDemo());

    // Count the hero figures up once, after the frame lands
    let t0: number | null = null;
    const step = (ts: number) => {
      t0 ??= ts;
      const p = Math.min(1, Math.max(0, (ts - t0 - 650) / 1100));
      this.k.set(1 - Math.pow(1 - p, 3));
      if (p < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  private runDemo(): void {
    const d = (patch: Partial<DemoState>) => this.patch(patch);
    this.at(0, () => this.demo.update((dm) => ({ ...DEMO_START, on: true, click: dm.click })));
    this.at(900, () => d({ cur: 'start' }));
    this.at(1800, () => this.demo.update((dm) => ({ ...dm, down: true, click: dm.click + 1, sel: 1 })));
    this.at(2050, () => d({ cur: 'end' }));
    this.at(2150, () => d({ sel: 4 }));
    this.at(2900, () => d({ down: false }));
    this.at(3200, () => d({ drawer: true }));
    this.at(3900, () => d({ cur: 'guest' }));
    this.at(4750, () => {
      this.click();
      d({ focus: true });
    });
    for (let n = 1; n <= GUEST_NAME.length; n++) {
      this.at(4950 + n * 75, () => d({ typed: GUEST_NAME.slice(0, n) }));
    }
    this.at(6050, () => d({ chip: true }));
    this.at(6500, () => d({ cur: 'confirm' }));
    this.at(7350, () => {
      this.click();
      d({ press: true });
    });
    this.at(7600, () => d({ press: false, drawer: false, focus: false, sel: 0, booked: true }));
    this.at(7750, () => {
      d({ toast: true });
      this.tweenK2(1, 900);
    });
    this.at(8100, () => d({ cur: 'rest' }));
    this.at(9900, () => d({ toast: false }));
    this.at(13200, () => {
      d({ fade: true });
      this.tweenK2(0, 500);
    });
    this.at(13800, () => {
      this.timers = [];
      if (!this.paused()) this.runDemo();
    });
  }

  private click(): void {
    this.demo.update((dm) => ({ ...dm, down: true, click: dm.click + 1 }));
    this.at(160, () => this.patch({ down: false }));
  }

  private tweenK2(to: number, dur: number): void {
    const from = this.demo().k2;
    let t0: number | null = null;
    const step = (ts: number) => {
      t0 ??= ts;
      const p = Math.min(1, (ts - t0) / dur);
      this.patch({ k2: from + (to - from) * (1 - Math.pow(1 - p, 3)) });
      if (p < 1) this.raf2 = requestAnimationFrame(step);
    };
    cancelAnimationFrame(this.raf2);
    this.raf2 = requestAnimationFrame(step);
  }

  /** Where the cursor goes, measured from the real layout (offsets ignore the 3D tilt). */
  private spot(name: CursorSpot): { x: number; y: number } {
    const m = this.mainEl()?.nativeElement;
    const b = m?.querySelector<HTMLElement>('app-lyhost-calendar .body');
    if (!m || !b) return { x: 0, y: 0 };
    const rel = (el: HTMLElement) => {
      let x = 0;
      let y = 0;
      for (let n: HTMLElement | null = el; n && n !== m; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      return { x, y };
    };
    const lab = b.querySelector<HTMLElement>('.lab')?.offsetWidth ?? 96;
    const bp = rel(b);
    const colW = (b.offsetWidth - lab) / this.cols();
    const rowY = bp.y + DEMO_ROW * ROW_HEIGHT + ROW_HEIGHT / 2;
    if (name === 'start') return { x: bp.x + lab + colW * (this.s0() + 0.1), y: rowY };
    if (name === 'end') return { x: bp.x + lab + colW * Math.min(this.cols() - 0.2, this.s0() + 3.4), y: rowY };
    if (name === 'guest') {
      const g = this.guestEl().nativeElement;
      const p = rel(g);
      return { x: p.x + 110, y: p.y + g.offsetHeight - 14 };
    }
    if (name === 'confirm') {
      const c = this.confirmEl().nativeElement;
      const p = rel(c);
      return { x: p.x + c.offsetWidth * 0.55, y: p.y + c.offsetHeight * 0.6 };
    }
    return { x: m.offsetWidth - 90, y: m.offsetHeight - 60 };
  }

  private barWidth(nights: number): string {
    const room = this.cols() - this.s0();
    return `calc((100% - var(--lab)) * ${Math.min(nights, room) / this.cols()} - ${nights > room ? 2 : 4}px)`;
  }

  private patch(p: Partial<DemoState>): void {
    this.demo.update((dm) => ({ ...dm, ...p }));
  }

  private at(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
