import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapChevronLeft, bootstrapChevronRight } from '@ng-icons/bootstrap-icons';
import { MEDIA_FALLBACK_IMAGE } from '@/presentation/shared/utils/media.util';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapChevronLeft, bootstrapChevronRight })],
  templateUrl: './image-carousel.html',
  styleUrl: './image-carousel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageCarouselComponent {
  readonly images = input<readonly string[]>([]);
  readonly alt = input<string>('');
  readonly showThumbnails = input<boolean>(false);

  private static readonly AUTOPLAY_INTERVAL_MS = 1400;

  private readonly requestedIndex = signal(0);
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopAutoplay());
  }

  protected readonly slides = computed<readonly string[]>(() => {
    const images = this.images();
    return images.length > 0 ? images : [MEDIA_FALLBACK_IMAGE];
  });

  protected readonly currentIndex = computed(() =>
    Math.min(this.requestedIndex(), this.slides().length - 1),
  );

  protected readonly hasMultiple = computed(() => this.slides().length > 1);

  protected readonly trackTransform = computed(() => `translateX(-${this.currentIndex() * 100}%)`);

  protected select(index: number): void {
    this.requestedIndex.set(index);
  }

  protected prev(event: Event): void {
    event.stopPropagation();
    this.goTo(this.currentIndex() - 1);
  }

  protected next(event: Event): void {
    event.stopPropagation();
    this.goTo(this.currentIndex() + 1);
  }

  play(): void {
    if (!this.hasMultiple()) return;
    this.stopAutoplay();
    this.autoplayTimer = setInterval(
      () => this.goTo(this.currentIndex() + 1),
      ImageCarouselComponent.AUTOPLAY_INTERVAL_MS,
    );
  }

  stop(): void {
    this.stopAutoplay();
    this.requestedIndex.set(0);
  }

  private goTo(index: number): void {
    const count = this.slides().length;
    this.requestedIndex.set((index + count) % count);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer !== null) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
}
