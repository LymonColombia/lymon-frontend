import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-location-map',
  imports: [],
  templateUrl: './location-map.html',
  styleUrl: './location-map.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationMap {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly zoom = input<number>(15);
  readonly label = input<string>('Location');

  private readonly sanitizer = inject(DomSanitizer);

  private readonly coords = computed(() => ({
    lat: this.clamp(this.latitude(), -90, 90),
    lng: this.clamp(this.longitude(), -180, 180),
    zoom: this.clamp(this.zoom(), 1, 21),
  }));

  readonly mapEmbedUrl = computed((): SafeResourceUrl => {
    const { lat, lng, zoom } = this.coords();
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly mapExternalUrl = computed(() => {
    const { lat, lng } = this.coords();
    return `https://www.google.com/maps?q=${lat},${lng}`;
  });

  private clamp(value: number, min: number, max: number): number {
    return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;
  }
}