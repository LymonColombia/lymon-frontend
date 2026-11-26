import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Stay, calendarDays, calendarRows } from './calendar-bars';

/** Read-only replica of the panel's reservations calendar, used as product imagery. */
@Component({
  selector: 'app-lyhost-calendar',
  templateUrl: './lyhost-calendar.html',
  styleUrl: './lyhost-calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--cols]': 'cols()',
  },
})
export class LyhostCalendarComponent {
  /** First visible day, relative to today. */
  readonly from = input(0);
  readonly cols = input(5);
  readonly stays = input.required<[string, Stay[]][]>();
  readonly showToday = input(false);

  readonly days = computed(() => calendarDays(this.from(), this.cols()));
  readonly rows = computed(() => calendarRows(this.stays(), this.from(), this.cols()));
  readonly todayLeft = computed(
    () => `calc(var(--lab) + (100% - var(--lab)) * ${(0.5 - this.from()) / this.cols()})`,
  );
}
