import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { SidebarComponent } from '@/presentation/tenant/layout/sidebar/sidebar';
import { TenantTopbarComponent } from '@/presentation/tenant/layout/topbar/topbar';
import { resolveCrumb } from '@/presentation/tenant/layout/nav.config';
import { TutorialOverlayComponent } from '@/presentation/tenant/layout/tutorial-overlay/tutorial-overlay';
import { ThemeService } from '@/presentation/tenant/services/theme.service';
import { TutorialService } from '@/presentation/tenant/services/tutorial.service';

const MOBILE_QUERY = '(max-width: 900px)';

@Component({
  selector: 'app-tenant-shell',
  imports: [RouterOutlet, SidebarComponent, TenantTopbarComponent, TutorialOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-shell.html',
  styleUrl: './tenant-shell.css',
  host: {
    class: 'ly-theme',
    '[attr.data-theme]': 'theme()',
    '[class.ly-theme--switching]': 'themeService.switching()',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
})
export class TenantShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly themeService = inject(ThemeService);
  readonly tutorialService = inject(TutorialService);

  protected readonly theme = this.themeService.theme;
  protected readonly menuOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { requireSync: true },
  );

  protected readonly crumb = computed(() => resolveCrumb(this.url()));

  constructor() {
    // The drawer closes after navigating and when the viewport grows past the breakpoint.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.menuOpen.set(false));

    const mobile = globalThis.matchMedia?.(MOBILE_QUERY);
    if (mobile) {
      const onChange = (e: MediaQueryListEvent) => {
        if (!e.matches) this.menuOpen.set(false);
      };
      mobile.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mobile.removeEventListener('change', onChange));
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }
}
