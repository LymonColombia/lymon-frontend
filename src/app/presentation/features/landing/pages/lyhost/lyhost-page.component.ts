import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  signal,
} from '@angular/core';
import { FooterComponent } from '@/presentation/shared/components/footer/footer.component';
import { LyhostNavComponent } from './components/lyhost-nav/lyhost-nav.component';
import { LyhostHeroComponent } from './components/lyhost-hero/lyhost-hero.component';
import { LyhostPlansComponent } from './components/lyhost-plans/lyhost-plans.component';
import { LyhostFeaturesComponent } from './components/lyhost-features/lyhost-features.component';
import { LyhostEcosystemComponent } from './components/lyhost-ecosystem/lyhost-ecosystem.component';

@Component({
  selector: 'app-lyhost-page',
  standalone: true,
  imports: [
    LyhostNavComponent,
    LyhostHeroComponent,
    LyhostPlansComponent,
    LyhostFeaturesComponent,
    LyhostEcosystemComponent,
    FooterComponent,
  ],
  templateUrl: './lyhost-page.component.html',
  styleUrl: './lyhost-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.scroll-reveal-enabled]': 'scrollRevealEnabled()',
  },
})
export class LyhostPageComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('revealSection')
  readonly revealSections?: QueryList<ElementRef<HTMLElement>>;

  readonly scrollRevealEnabled = signal(false);
  readonly visibleSections = signal<Set<string>>(new Set());

  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    this.scrollRevealEnabled.set(true);

    this.observer = new IntersectionObserver(
      (entries) => {
        const nextVisible = new Set(this.visibleSections());
        let changed = false;

        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const sectionId = (entry.target as HTMLElement).dataset['sectionId'];
          if (!sectionId || nextVisible.has(sectionId)) {
            continue;
          }

          nextVisible.add(sectionId);
          changed = true;
          this.observer?.unobserve(entry.target);
        }

        if (changed) {
          this.visibleSections.set(nextVisible);
        }
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -12% 0px',
      },
    );

    this.revealSections?.forEach((sectionRef) => {
      this.observer?.observe(sectionRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  isVisible(sectionId: string): boolean {
    return this.visibleSections().has(sectionId);
  }
}
