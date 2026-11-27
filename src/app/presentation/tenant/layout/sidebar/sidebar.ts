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
import { filter, map, startWith } from 'rxjs';

import { GetTenantProfileUseCase } from '@/domain/tenant/tenant/use-cases/get-tenant-profile.use-case';
import { TokenService } from '@/infrastructure/tenant/services/token.service';
import { UserSessionService } from '@/infrastructure/tenant/services/user-session.service';
import { UiAvatarComponent } from '@/presentation/shared/ui/ui-avatar/ui-avatar';
import { UiButtonComponent } from '@/presentation/shared/ui/ui-button/ui-button';
import { UiDialogComponent } from '@/presentation/shared/ui/ui-dialog/ui-dialog';
import { UiIconComponent } from '@/presentation/shared/ui/ui-icon/ui-icon';
import { UiLogoComponent } from '@/presentation/shared/ui/ui-logo/ui-logo';
import { UiMenuComponent } from '@/presentation/shared/ui/ui-menu/ui-menu';
import { UiMenuItemComponent } from '@/presentation/shared/ui/ui-menu/ui-menu-item';
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
    UiAvatarComponent,
    UiButtonComponent,
    UiDialogComponent,
    UiIconComponent,
    UiLogoComponent,
    UiMenuComponent,
    UiMenuItemComponent,
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

  readonly mobileOpen = input(false);

  protected readonly home = HOME_NAV;
  protected readonly groups = NAV_GROUPS;

  protected readonly collapsedByUser = signal(true);
  protected readonly expanded = computed(() => !this.collapsedByUser() || this.mobileOpen());
  /** Every group starts open, as in the design; the user folds what they don't need. */
  protected readonly openGroups = signal<ReadonlySet<string>>(new Set(NAV_GROUPS.map((g) => g.id)));
  /** True while the logo plays its pinch after the rail opens. */
  protected readonly logoKick = signal(false);
  private kickTimer?: ReturnType<typeof setTimeout>;
  protected readonly profileOpen = signal(false);
  protected readonly logoutOpen = signal(false);

  protected readonly tenantName = signal('');
  protected readonly displayName = computed(() => this.tenantName().trim() || 'Mi cuenta');
  /** Admins hold the account (they registered the tenant); staff log in under it. */
  protected readonly isOwner = computed(() => this.userSession.currentUser()?.role !== 'STAFF');
  protected readonly roleLabel = computed(() =>
    this.isOwner() ? 'Titular de la cuenta' : 'Miembro del equipo',
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
      // On error the row falls back to "Mi cuenta"; the rail stays usable.
      .subscribe({ next: (res) => this.tenantName.set(res.data?.name ?? ''), error: () => undefined });

    // The drawer opening on mobile plays the logo too.
    effect(() => {
      if (this.mobileOpen()) this.playLogoKick();
    });

    this.destroyRef.onDestroy(() => clearTimeout(this.kickTimer));
  }

  protected toggleRail(): void {
    if (this.expanded()) {
      this.collapsedByUser.set(true);
      return;
    }
    // Ignore a second click while the opening is still playing.
    if (this.logoKick()) return;
    this.expandRail();
  }

  private expandRail(): void {
    this.collapsedByUser.set(false);
    this.playLogoKick();
  }

  private playLogoKick(): void {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.logoKick.set(true);
    clearTimeout(this.kickTimer);
    // 450ms pinch plus 4 × 40ms stagger, with a little slack.
    this.kickTimer = setTimeout(() => this.logoKick.set(false), 650);
  }

  protected isOpen(group: NavGroup): boolean {
    return this.openGroups().has(group.id);
  }

  /** From the collapsed rail a group icon expands the rail and opens its pages. */
  protected toggleGroup(group: NavGroup): void {
    if (!this.expanded()) {
      this.openGroups.update((set) => new Set(set).add(group.id));
      this.expandRail();
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
