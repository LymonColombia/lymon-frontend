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
  selector: '[tenantPageMeta]',
  standalone: true,
})
export class TenantPageMetaDirective {}

@Directive({
  selector: '[tenantPageActions]',
  standalone: true,
})
export class TenantPageActionsDirective {}

@Directive({
  selector: '[tenantPageIcon]',
  standalone: true,
})
export class TenantPageIconDirective {}

@Component({
  selector: 'app-tenant-page-layout',
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
  templateUrl: './tenant-page-layout.html',
  styleUrl: './tenant-page-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantPageLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly iconName = input<string | null>(null);
  readonly breadcrumbItems = input<readonly BreadcrumbItem[]>([]);
  readonly backLink = input<string | null>(null);
  readonly backLabel = input<string>('Volver');

  private readonly metaSlot = contentChild(TenantPageMetaDirective);
  private readonly actionsSlot = contentChild(TenantPageActionsDirective);
  private readonly iconSlot = contentChild(TenantPageIconDirective);

  readonly hasMeta = computed(() => Boolean(this.metaSlot()));
  readonly hasActions = computed(() => Boolean(this.actionsSlot()));
  readonly hasRightContent = computed(() => this.hasMeta() || this.hasActions());
  readonly hasCustomIcon = computed(() => Boolean(this.iconSlot()));
}
