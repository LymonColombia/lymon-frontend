import {AfterViewInit,ChangeDetectionStrategy,Component,DestroyRef,ElementRef,ViewChild,ViewEncapsulation,computed,effect,inject,output,signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as Leaflet from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

export interface MapPickerLocation {
  lat: number;
  lng: number;
  address: string;
}

interface MapPickerState {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface GeoSearchShowLocationEvent {
  location: { x: number; y: number; label: string };
  marker: L.Marker;
}

interface NominatimReverseResult {
  display_name: string;
}


const INITIAL_STATE: MapPickerState = { address: '', lat: null, lng: null };
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const DEFAULT_CENTER: L.LatLngExpression = [4.711, -74.072];
const DEFAULT_ZOOM = 6;

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [],
  templateUrl: './map-picker.html',
  styleUrl: './map-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapPickerComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer!: ElementRef<HTMLDivElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly provider = new OpenStreetMapProvider();

  private map: Leaflet.Map | null = null;
  private marker: Leaflet.Marker | null = null;

  readonly locationChanged = output<MapPickerLocation | null>();

  private readonly state = signal<MapPickerState>(INITIAL_STATE);

  readonly selectedAddress = computed(() => this.state().address);
  readonly selectedLat = computed(() => this.state().lat);
  readonly selectedLng = computed(() => this.state().lng);
  readonly hasSelection = computed(() => {
    const { address, lat, lng } = this.state();
    return Boolean(address) && lat !== null && lng !== null;
  });

 
  constructor() {
    this.destroyRef.onDestroy(() => this.teardown());

    effect(() => {
      const { address, lat, lng } = this.state();

      if (lat !== null && lng !== null && address) {
        this.locationChanged.emit({ lat, lng, address });
        console.log('Emitiendo ubicación:', { lat, lng, address });
      } else {
        this.locationChanged.emit(null);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }


  private initMap(): void {
    this.configureDefaultIcon();

    this.map = Leaflet.map(this.mapContainer.nativeElement, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.addSearchControl();

    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  private addSearchControl(): void {
    if (!this.map) return;

    const SearchControlCtor = GeoSearchControl as unknown as new (
      options: Record<string, unknown>,
    ) => Leaflet.Control;

    this.map.addControl(
      new SearchControlCtor({
        provider: this.provider,
        style: 'bar',
        showMarker: true,
        showPopup: false,
        marker: { draggable: true },
        autoComplete: true,
        autoCompleteDelay: 250,
        searchLabel: 'Buscar dirección...',
        notFoundMessage: 'No se encontraron resultados',
        keepResult: true,
        updateMap: true,
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        zoomLevel: 17,
      }),
    );

    this.map.on('geosearch/showlocation', this.onShowLocation);
    this.map.on('geosearch/resultcleared', this.onResultCleared);
  }


  private readonly onShowLocation = (event: unknown): void => {
    const { location, marker } = event as GeoSearchShowLocationEvent;
    if (!location) return;

    this.marker = marker;
    this.marker.off('dragend').on('dragend', this.onMarkerDragEnd);

    this.state.set({ address: location.label, lat: location.y, lng: location.x });
  };

  private readonly onMarkerDragEnd = (): void => {
    if (!this.marker) return;
    const { lat, lng } = this.marker.getLatLng();
    this.reverseGeocode(lat, lng);
  };

  private readonly onResultCleared = (): void => {
    this.marker = null;
    this.state.set(INITIAL_STATE);
  };

 
  private async reverseGeocode(lat: number, lng: number): Promise<void> {
   
    this.state.update((prev) => ({ ...prev, lat, lng }));

    try {
      const result = await firstValueFrom(
        this.http.get<NominatimReverseResult>(NOMINATIM_REVERSE_URL, {
          params: { lat: lat.toString(), lon: lng.toString(), format: 'json' },
        }),
      );
      this.state.update((prev) => ({ ...prev, address: result.display_name }));
    } catch {
      console.warn('No se pudo obtener la dirección para las coordenadas dadas.');
    }
  }

  
  private teardown(): void {
    this.marker = null;
    this.map?.remove();
    this.map = null;
  }

  private configureDefaultIcon(): void {
    const proto = Leaflet.Icon.Default.prototype as Leaflet.Icon.Default & { _getIconUrl?: unknown };
    delete proto._getIconUrl;

    Leaflet.Icon.Default.mergeOptions({
      iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
      iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
      shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
    });
  }
}