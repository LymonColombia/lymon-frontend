import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as L from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

export interface AddressLocationValue {
  address: string;
  lat: number | null;
  lng: number | null;
}

export interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export interface NominatimResult {
  display_name: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
}

interface GeosearchResult {
  x: number;
  y: number;
  label: string;
  raw: NominatimResult;
}

@Component({
  selector: 'app-address-map-picker',
  standalone: true,
  imports: [],
  templateUrl: './address-map-picker.html',
  styleUrl: './address-map-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressMapPickerComponent),
      multi: true,
    },
  ],
})
export class AddressMapPickerComponent implements ControlValueAccessor, OnDestroy {
  private readonly provider = new OpenStreetMapProvider({
    params: { addressdetails: 1, limit: 6, 'accept-language': 'es' },
  });

  private readonly markerIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-pin"></div>',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  });

  private map?: L.Map;
  private marker?: L.Marker;
  private pendingCenter?: L.LatLngExpression;
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private resizeObserver?: ResizeObserver;
  private onChange: (value: AddressLocationValue) => void = () => {};
  private onTouched: () => void = () => {};

  readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  readonly addressText = signal('');
  readonly suggestions = signal<GeosearchResult[]>([]);
  readonly isSearching = signal(false);
  readonly hasNoResults = signal(false);
  readonly error = signal<string | null>(null);

  readonly geocodeResult = output<NominatimResult>();

  constructor() {
    afterNextRender(() => {
      this.initMap();
      this.setupResizeObserver();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  writeValue(value: AddressLocationValue | null): void {
    this.addressText.set(value?.address ?? '');
    this.error.set(null);
    this.suggestions.set([]);
    this.hasNoResults.set(false);

    if (value?.lat != null && value?.lng != null) {
      if (this.map) {
        this.updateMarker(value.lat, value.lng);
      } else {
        this.pendingCenter = [value.lat, value.lng];
      }
    }
  }

  registerOnChange(fn: (value: AddressLocationValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onAddressInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.addressText.set(value);
    this.error.set(null);
    this.hasNoResults.set(false);
    this.suggestions.set([]);
    this.onTouched();

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (!value || value.trim().length < 3) {
      this.isSearching.set(false);
      return;
    }

    this.isSearching.set(true);
    this.searchTimeout = setTimeout(() => {
      void this.search(value.trim());
    }, 350);
  }

  onInputFocus(): void {
    this.onTouched();
  }

  onInputBlur(): void {
    setTimeout(() => {
      this.suggestions.set([]);
      this.hasNoResults.set(false);
    }, 150);
  }

  selectSuggestion(result: GeosearchResult): void {
    this.addressText.set(result.label);
    this.suggestions.set([]);
    this.hasNoResults.set(false);
    this.error.set(null);

    const lat = result.y;
    const lng = result.x;
    this.updateMarker(lat, lng);
    this.emitValue(result.label, lat, lng);
    this.geocodeResult.emit(result.raw);
  }

  private async search(query: string): Promise<void> {
    try {
      const results = (await this.provider.search({ query })) as GeosearchResult[];
      this.suggestions.set(results);
      this.hasNoResults.set(results.length === 0);
    } catch {
      this.error.set('Error al buscar la dirección. Intentá de nuevo.');
      this.suggestions.set([]);
      this.hasNoResults.set(false);
    } finally {
      this.isSearching.set(false);
    }
  }

  private initMap(): void {
    const container = this.mapContainer().nativeElement;
    this.map = L.map(container).setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      this.updateMarker(lat, lng);
      void this.resolvePosition(lat, lng);
    });

    if (this.pendingCenter) {
      const latLng = L.latLng(this.pendingCenter);
      this.updateMarker(latLng.lat, latLng.lng);
      this.pendingCenter = undefined;
    }
  }

  private setupResizeObserver(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container || this.resizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize();
    });
    this.resizeObserver.observe(container);
  }

  private updateMarker(lat: number, lng: number): void {
    if (!this.map) return;

    this.map.setView([lat, lng], 16);

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
      return;
    }

    this.marker = L.marker([lat, lng], { draggable: true, icon: this.markerIcon })
      .addTo(this.map)
      .on('dragend', (event: L.LeafletEvent) => {
        const movedMarker = event.target as L.Marker;
        const { lat: newLat, lng: newLng } = movedMarker.getLatLng();
        void this.resolvePosition(newLat, newLng);
      });
  }

  private async resolvePosition(lat: number, lng: number): Promise<void> {
    try {
      const url = `${this.provider.reverseUrl}?${this.provider.getParamString({
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'es',
      })}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('reverse geocoding failed');

      const data = (await response.json()) as NominatimResult;
      const address = data.display_name ?? '';

      this.addressText.set(address);
      this.emitValue(address, lat, lng);
      if (data.address || address) {
        this.geocodeResult.emit(data);
      }
    } catch {
      this.error.set('No se encontró dirección para el punto. Completá los datos manualmente.');
      this.addressText.set('');
      this.emitValue('', lat, lng);
    }
  }

  private emitValue(address: string, lat: number, lng: number): void {
    this.onChange({ address, lat, lng });
  }
}
