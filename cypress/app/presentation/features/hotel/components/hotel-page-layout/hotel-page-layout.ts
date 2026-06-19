import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  contentChild,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapChevronLeft } from '@ng-icons/bootstrap-icons';

import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '@/presentation/shared/components/breadcrumb/breadcrumb.component';

@Directive({
  selector: '[hotelPageMeta]',
  standalone: true,
})
export class HotelPageMetaDirective {}

@Directive({
  selector: '[hotelPageActions]',
  standalone: true,
})
export class HotelPageActionsDirective {}

@Directive({
  selector: '[hotelPageIcon]',
  standalone: true,
})
export class HotelPageIconDirective {}

@Component({
  selector: 'app-hotel-page-layout',
  standalone: true,
  host: {
    '[attr.title]': 'null',
  },
  imports: [
    RouterLink,
    FooterComponent,
    BreadcrumbComponent,
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapChevronLeft })],
  templateUrl: './hotel-page-layout.html',
  styleUrl: './hotel-page-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelPageLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly iconName = input<string | null>(null);
  readonly breadcrumbItems = input<readonly BreadcrumbItem[]>([]);
  readonly backLink = input<string | null>(null);
  readonly backLabel = input<string>('Volver');

  private readonly metaSlot = contentChild(HotelPageMetaDirective);
  private readonly actionsSlot = contentChild(HotelPageActionsDirective);
  private readonly iconSlot = contentChild(HotelPageIconDirective);

  readonly hasMeta = computed(() => Boolean(this.metaSlot()));
  readonly hasActions = computed(() => Boolean(this.actionsSlot()));
  readonly hasRightContent = computed(() => this.hasMeta() || this.hasActions());
  readonly hasCustomIcon = computed(() => Boolean(this.iconSlot()));
}
