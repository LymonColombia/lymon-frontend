import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxArrowRight,
  bootstrapCalendar2Check,
  bootstrapChevronDoubleRight,
  bootstrapChevronDown,
  bootstrapGear,
  bootstrapGrid,
  bootstrapHouseDoor,
  bootstrapPeople,
} from '@ng-icons/bootstrap-icons';
import { filter, map, startWith } from 'rxjs';

import { GetTenantProfileUseCase } from '@/domain/tenant/tenant/use-cases/get-tenant-profile.use-case';
import { TokenService } from '@/infrastructure/tenant/services/token.service';
import { UserSessionService } from '@/infrastructure/tenant/services/user-session.service';
import { UiAvatarComponent } from '@/presentation/shared/ui/ui-avatar/ui-avatar';
import { UiButtonComponent } from '@/presentation/shared/ui/ui-button/ui-button';
import { UiDialogComponent } from '@/presentation/shared/ui/ui-dialog/ui-dialog';
import { UiMenuComponent } from '@/presentation/shared/ui/ui-menu/ui-menu';
import { UiMenuItemComponent } from '@/presentation/shared/ui/ui-menu/ui-menu-item';
import { ThemeService } from '@/presentation/tenant/services/theme.service';
import { HOME_NAV, NAV_GROUPS, NavGroup, groupOfUrl } from '@/presentation/tenant/layout/nav.config';

/**
 * Floating navigation rail. Collapsed it shows icons; expanded it shows the
 * labels and opens each group onto its pages. Below 900px it becomes a drawer
 * driven by the shell through `mobileOpen`.
 */
@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIcon,
    UiAvatarComponent,
    UiButtonComponent,
    UiDialogComponent,
    UiMenuComponent,
    UiMenuItemComponent,
  ],
  providers: [
    provideIcons({
      bootstrapBoxArrowRight,
      bootstrapCalendar2Check,
      bootstrapChevronDoubleRight,
      bootstrapChevronDown,
      bootstrapGear,
      bootstrapGrid,
      bootstrapHouseDoor,
      bootstrapPeople,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly getTenantProfile = inject(GetTenantProfileUseCase);
  private readonly userSession = inject(UserSessionService);
  private readonly tokenService = inject(TokenService);
  private readonly themeService = inject(ThemeService);

  readonly mobileOpen = input(false);

  protected readonly home = HOME_NAV;
  protected readonly groups = NAV_GROUPS;

  protected readonly collapsedByUser = signal(true);
  protected readonly expanded = computed(() => !this.collapsedByUser() || this.mobileOpen());
  protected readonly openGroups = signal<ReadonlySet<string>>(new Set());
  protected readonly profileOpen = signal(false);
  protected readonly logoutOpen = signal(false);

  protected readonly tenantName = signal('');
  protected readonly tenantEmail = signal('');
  protected readonly displayName = computed(() => this.tenantName().trim() || 'Mi cuenta');
  protected readonly displayEmail = computed(() => this.tenantEmail().trim());

  protected readonly logoSuffix = computed(() => (this.themeService.theme() === 'dark' ? '-white' : ''));
  protected readonly markSrc = computed(() =>
    this.themeService.theme() === 'dark' ? '/images/lyhost-mark-dark.svg' : '/images/lyhost-mark.svg',
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { requireSync: true },
  );

  protected readonly currentGroupId = computed(() => groupOfUrl(this.url())?.id ?? null);

  constructor() {
    // The group that holds the current page is always open.
    effect(() => {
      const id = this.currentGroupId();
      if (id) this.openGroups.update((set) => new Set(set).add(id));
    });

    this.getTenantProfile
      .execute()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.tenantName.set(res.data?.name ?? '');
          this.tenantEmail.set(res.data?.email ?? this.userSession.currentUser()?.email ?? '');
        },
        error: () => this.tenantEmail.set(this.userSession.currentUser()?.email ?? ''),
      });
  }

  protected toggleRail(): void {
    this.collapsedByUser.update((v) => !v);
  }

  protected isOpen(group: NavGroup): boolean {
    return this.openGroups().has(group.id);
  }

  /** From the collapsed rail a group icon expands the rail and opens its pages. */
  protected toggleGroup(group: NavGroup): void {
    if (!this.expanded()) {
      this.collapsedByUser.set(false);
      this.openGroups.update((set) => new Set(set).add(group.id));
      return;
    }

    this.openGroups.update((set) => {
      const next = new Set(set);
      if (!next.delete(group.id)) next.add(group.id);
      return next;
    });
  }

  protected goToSettings(): void {
    void this.router.navigateByUrl('/admin/settings');
  }

  protected confirmLogout(): void {
    this.logoutOpen.set(false);
    this.tokenService.clear();
    this.userSession.clear();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
