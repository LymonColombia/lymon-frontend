import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { UiButtonComponent } from '@/presentation/shared/ui/ui-button/ui-button';
import { UiIconButtonComponent } from '@/presentation/shared/ui/ui-icon-button/ui-icon-button';
import { UiIconComponent } from '@/presentation/shared/ui/ui-icon/ui-icon';
import {
  CHANNELS,
  CHANNEL_ORDER,
  Channel,
  buildDays,
  dayNumber,
  formatDay,
  formatRange,
  todayNumber,
} from './calendar.utils';

export type BookingState = 'pending' | 'confirmed' | 'inhouse' | 'done';

export interface CalendarUnit {
  id: string;
  name: string;
}

export interface CalendarGroup {
  id: string;
  name: string;
  city: string;
  units: CalendarUnit[];
}

export interface CalendarBooking {
  id: string;
  unitId: string;
  guest: string;
  channel: Channel;
  state: BookingState;
  /** `YYYY-MM-DD`, the night the guest arrives. */
  checkIn: string;
  /** `YYYY-MM-DD`, the morning the guest leaves. */
  checkOut: string;
}

interface Bar {
  readonly id: string;
  readonly channel: Channel;
  readonly state: BookingState;
  readonly guest: string;
  readonly sub: string;
  readonly letter: string;
  readonly left: number;
  readonly width: number;
  readonly clippedLeft: boolean;
  readonly clippedRight: boolean;
  readonly label: string;
}

const COL_W = 64;
/** The grid always starts two weeks back so a stay in progress is never cut off. */
const RANGE_START = -14;
const MIN_RANGE_END = 45;
const FIRST_VIEW_OFFSET = -3;

/**
 * Gantt calendar: one row per unit, one column per day, a bar per stay colored
 * by the channel it came from. The grid scrolls sideways; the arrows move it a
 * week at a time and the header reports the dates in view.
 */
@Component({
  selector: 'app-reservation-calendar',
  imports: [UiButtonComponent, UiIconButtonComponent, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-calendar.html',
  styleUrl: './reservation-calendar.css',
})
export class ReservationCalendarComponent {
  readonly groups = input.required<CalendarGroup[]>();
  readonly bookings = input.required<CalendarBooking[]>();
  readonly selectedId = input<string | null>(null);
  readonly loading = input(false);

  readonly bookingSelected = output<string>();
  /** The empty calendar offers to start the first reservation. */
  readonly createRequested = output<void>();
  /** A calendar with only a few units offers to add more. */
  readonly addUnitsRequested = output<void>();

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  private readonly injector = inject(Injector);
  private frame = 0;
  private placed = false;

  protected readonly colW = COL_W;
  protected readonly channels = CHANNELS;
  private readonly today = todayNumber();

  /** First day in view (days from today) and how many fit. */
  protected readonly offset = signal(FIRST_VIEW_OFFSET);
  protected readonly visible = signal(14);
  protected readonly hiddenChannels = signal<ReadonlySet<Channel>>(new Set());

  private readonly resolved = computed(() =>
    this.bookings()
      .map((b) => ({
        booking: b,
        start: dayNumber(b.checkIn) - this.today,
        end: dayNumber(b.checkOut) - this.today,
      }))
      .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > r.start),
  );

  protected readonly resolvedCount = computed(() => this.resolved().length);
  protected readonly notice = signal('');

  protected readonly rangeEnd = computed(() =>
    this.resolved().reduce((max, r) => Math.max(max, r.end + 7), MIN_RANGE_END),
  );

  protected readonly days = computed(() => buildDays(RANGE_START, this.rangeEnd(), this.today));
  protected readonly trackWidth = computed(() => (this.rangeEnd() - RANGE_START) * COL_W);
  protected readonly todayLeft = (0 - RANGE_START) * COL_W;

  protected readonly unitCount = computed(() =>
    this.groups().reduce((n, g) => n + g.units.length, 0),
  );

  /** Bookings that touch the dates in view, whatever the channel filter says. */
  private readonly inWindow = computed(() => {
    const from = this.offset();
    const to = from + this.visible();
    return this.resolved().filter((r) => r.start < to && r.end > from);
  });

  protected readonly chips = computed(() => {
    const window = this.inWindow();
    const hidden = this.hiddenChannels();
    const present = new Set(this.resolved().map((r) => r.booking.channel));
    return CHANNEL_ORDER.filter((c) => c !== 'ot' || present.has('ot')).map((channel) => ({
      channel,
      label: CHANNELS[channel].label,
      count: window.filter((r) => r.booking.channel === channel).length,
      off: hidden.has(channel),
    }));
  });

  protected readonly occupancy = computed(() => {
    const units = this.unitCount();
    if (!units) return null;
    const from = this.offset();
    const to = from + this.visible();
    const nights = this.resolved().reduce(
      (sum, r) => sum + Math.max(0, Math.min(r.end, to) - Math.max(r.start, from)),
      0,
    );
    return Math.min(100, Math.round((nights / (units * (to - from))) * 100));
  });

  protected readonly rangeLabel = computed(() =>
    formatRange(this.today + this.offset(), this.today + this.offset() + this.visible() - 1),
  );

  private readonly barsByUnit = computed(() => {
    const hidden = this.hiddenChannels();
    const end = this.rangeEnd();
    const byUnit = new Map<string, Bar[]>();

    for (const { booking, start, end: stop } of this.resolved()) {
      if (hidden.has(booking.channel) || start >= end || stop <= RANGE_START) continue;

      // A stay begins and ends around midday, so its bar covers half of each end day.
      const from = start + 0.5;
      const to = stop + 0.5;
      const clippedLeft = from < RANGE_START;
      const clippedRight = to > end;
      const visibleFrom = Math.max(from, RANGE_START);
      const visibleTo = Math.min(to, end);
      const gapLeft = clippedLeft ? 0 : 2;
      const gapRight = clippedRight ? 0 : 2;
      const nights = stop - start;

      const bar: Bar = {
        id: booking.id,
        channel: booking.channel,
        state: booking.state,
        guest: booking.guest,
        sub: `${CHANNELS[booking.channel].label} · ${nights} ${nights === 1 ? 'noche' : 'noches'}`,
        letter: CHANNELS[booking.channel].letter,
        left: (visibleFrom - RANGE_START) * COL_W + gapLeft,
        width: (visibleTo - visibleFrom) * COL_W - gapLeft - gapRight,
        clippedLeft,
        clippedRight,
        label: `${booking.guest} · ${CHANNELS[booking.channel].label} · ${formatDay(this.today + start)} a ${formatDay(this.today + stop)} · ${nights} ${nights === 1 ? 'noche' : 'noches'}`,
      };
      byUnit.set(booking.unitId, [...(byUnit.get(booking.unitId) ?? []), bar]);
    }
    return byUnit;
  });

  protected readonly rows = computed(() => {
    const bars = this.barsByUnit();
    return this.groups().map((group) => {
      return {
        id: group.id,
        name: group.name,
        units: group.units.map((unit) => ({ id: unit.id, name: unit.name, bars: bars.get(unit.id) ?? [] })),
      };
    });
  });

  /** No reservations at all: the grid stays as a backdrop under a call to action. */
  protected readonly isZero = computed(() => this.unitCount() > 0 && !this.resolved().length);

  /** Few units: taller rows so the planner does not look sparse. */
  protected readonly roomy = computed(() => this.unitCount() <= 4);

  protected readonly isFew = computed(
    () => this.unitCount() > 0 && this.unitCount() <= 3 && this.resolved().length > 0,
  );

  protected readonly nothingToShow = computed(
    () => this.unitCount() > 0 && this.resolved().length > 0 && this.barsByUnit().size === 0,
  );

  protected readonly emptyMessage = computed(() =>
    this.inWindow().length
      ? 'Ocultaste todos los canales con reservas en estas fechas.'
      : 'No hay reservas en estas fechas.',
  );

  constructor() {
    // The grid only exists once there are units to draw, so place it when it appears.
    effect(() => {
      if (!this.scroller() || this.placed) return;
      this.placed = true;
      afterNextRender(() => this.jumpTo(FIRST_VIEW_OFFSET, false), { injector: this.injector });
    });
  }

  protected connectChannels(): void {
    this.notice.set('La conexión con Booking.com y Airbnb llega pronto. Mientras tanto, crea aquí tus reservas directas.');
  }

  protected toggleChannel(channel: Channel): void {
    this.hiddenChannels.update((set) => {
      const next = new Set(set);
      if (!next.delete(channel)) next.add(channel);
      return next;
    });
  }

  protected previous(): void {
    this.jumpTo(this.offset() - 7);
  }

  protected next(): void {
    this.jumpTo(this.offset() + 7);
  }

  protected goToday(): void {
    this.jumpTo(FIRST_VIEW_OFFSET);
  }

  protected select(id: string): void {
    this.bookingSelected.emit(id);
  }

  /** Reads the scroll position back into the visible window. */
  protected onScroll(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.syncWindow();
    });
  }

  private jumpTo(offset: number, animate = true): void {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    const left = Math.max(0, (offset - RANGE_START) * COL_W);
    const smooth = animate && !this.reducedMotion?.matches;
    el.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    this.syncWindow();
  }

  private syncWindow(): void {
    const el = this.scroller()?.nativeElement;
    if (!el) return;
    const label = el.querySelector<HTMLElement>('.g-lab');
    const labelWidth = label?.offsetWidth ?? 168;
    const offset = RANGE_START + Math.round(el.scrollLeft / COL_W);
    const fits = Math.floor((el.clientWidth - labelWidth) / COL_W);
    const visible = Math.max(1, Math.min(this.rangeEnd() - offset, fits));
    if (offset !== this.offset()) this.offset.set(offset);
    if (visible !== this.visible()) this.visible.set(visible);
  }
}
