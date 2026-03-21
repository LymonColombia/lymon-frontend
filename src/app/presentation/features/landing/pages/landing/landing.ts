import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { HeaderComponent } from '@/presentation/shared/components/header/header.component';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, map } from 'rxjs';

type NavItem = {
  id: string;
  label: string;
};

type ServiceItem = {
  title: string;
  description: string;
  action: string;
};

type PlanItem = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
};

type ComparisonRow = {
  name: string;
  basic: string;
  professional: string;
  enterprise: string;
};

type EcosystemFeature = {
  id: number;
  title: string;
  description: string;
};

type HardwareCategory = {
  title: string;
  description: string;
  brands: string[];
};

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, ButtonComponent, NgOptimizedImage],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements AfterViewInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly isScrolled = signal(false);
  readonly showComparison = signal(false);
  readonly visibleSections = signal<Record<string, boolean>>({});
  readonly currentYear = new Date().getFullYear();

  readonly navItems: NavItem[] = [
    { id: 'servicios', label: 'Servicios' },
    { id: 'soporte', label: 'Soporte' },
    { id: 'gestion', label: 'Gestión' },
    { id: 'equipos', label: 'Equipos' },
  ];

  readonly services: ServiceItem[] = [
    {
      title: 'Soporte Tecnológico',
      description:
        'Asistencia técnica 24/7 con tiempos de respuesta garantizados. Mantenimiento preventivo y correctivo.',
      action: 'Conocer más',
    },
    {
      title: 'Gestión SaaS',
      description:
        'LymonOne, software de gestión hotelera en la nube. Optimiza reservas y experiencia del huésped.',
      action: 'Conocer más',
    },
    {
      title: 'Venta de Hardware',
      description:
        'Equipos de última generación. Computadores, servidores y sistemas de seguridad premium.',
      action: 'Conocer más',
    },
  ];

  readonly plans: PlanItem[] = [
    {
      name: 'Básico',
      price: '$299',
      period: '/mes',
      description: 'Ideal para pequeñas empresas',
      features: ['SLA 8 horas', 'Soporte remoto ilimitado', '1 visita presencial/mes', 'Antivirus corporativo'],
      cta: 'Comenzar',
      popular: false,
    },
    {
      name: 'Profesional',
      price: '$699',
      period: '/mes',
      description: 'Más elegido por empresas en crecimiento',
      features: [
        'SLA 4 horas',
        'Soporte remoto ilimitado',
        '4 visitas presenciales/mes',
        'Suite de seguridad premium',
        'Monitoreo 24/7',
        'Mantenimiento preventivo',
      ],
      cta: 'Comenzar Ahora',
      popular: true,
    },
    {
      name: 'Empresarial',
      price: '$1,499',
      period: '/mes',
      description: 'Soporte enterprise con máxima prioridad',
      features: [
        'SLA 2 horas',
        'Soporte remoto ilimitado',
        'Visitas ilimitadas',
        'Suite completa de seguridad',
        'Monitoreo 24/7',
        'Gerente de cuenta dedicado',
      ],
      cta: 'Contactar Ventas',
      popular: false,
    },
  ];

  readonly comparisonRows: ComparisonRow[] = [
    { name: 'Tiempo de respuesta SLA', basic: '8 horas', professional: '4 horas', enterprise: '2 horas' },
    { name: 'Visitas presenciales', basic: '1/mes', professional: '4/mes', enterprise: 'Ilimitadas' },
    { name: 'Horario de atención', basic: 'Lun-Vie 8-6', professional: '24/7', enterprise: '24/7 Prioritario' },
    { name: 'Descuento en hardware', basic: '5%', professional: '10%', enterprise: '15%' },
    { name: 'Capacitación', basic: '-', professional: 'Trimestral', enterprise: 'Mensual' },
    { name: 'Reportes personalizados', basic: '-', professional: 'Básicos', enterprise: 'Avanzados' },
  ];

  readonly ecosystemFeatures: EcosystemFeature[] = [
    { id: 1, title: 'Multi-propiedad', description: 'Gestión centralizada' },
    { id: 2, title: 'Calendario Unificado', description: 'Vista consolidada' },
    { id: 3, title: 'CRM de Huéspedes', description: 'Perfiles detallados' },
    { id: 4, title: 'Facturación', description: 'Automática y completa' },
    { id: 5, title: 'Channel Manager', description: 'Sincronización OTAs' },
    { id: 6, title: 'App Móvil', description: 'Gestión en movimiento' },
  ];

  readonly stats = [
    { value: '200+', label: 'Propiedades Activas' },
    { value: '50K+', label: 'Reservas Procesadas' },
    { value: '99.9%', label: 'Uptime Garantizado' },
    { value: '24/7', label: 'Soporte Técnico' },
  ];

  readonly hardwareCategories: HardwareCategory[] = [
    {
      title: 'Computadores',
      description: 'Equipos de escritorio y portátiles de última generación',
      brands: ['Dell', 'HP', 'Lenovo', 'Apple'],
    },
    {
      title: 'Servidores y Redes',
      description: 'Infraestructura robusta para tu negocio',
      brands: ['Cisco', 'Ubiquiti', 'HPE', 'Synology'],
    },
    {
      title: 'Seguridad',
      description: 'Cámaras, control de acceso y sistemas integrales',
      brands: ['Hikvision', 'Dahua', 'Axis', 'UniFi'],
    },
  ];

  readonly hardwareBenefits = [
    'Garantía extendida hasta 3 años',
    'Instalación y configuración incluida',
    'Soporte técnico de por vida',
    'Financiamiento flexible',
    'Descuentos corporativos',
    'Trade-in de equipos antiguos',
  ];

  readonly ecosystemNodeStyle = computed(() => {
    return this.ecosystemFeatures.map((feature, index) => {
      const angle = (index * 60 - 90) * (Math.PI / 180);
      const radius = 36;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);

      return {
        ...feature,
        left: `${x}%`,
        top: `${y}%`,
      };
    });
  });

  constructor() {
    fromEvent(this.document.defaultView ?? window, 'scroll')
      .pipe(
        map(() => (this.document.defaultView?.scrollY ?? 0) > 20),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.isScrolled.set(value));

    this.visibleSections.set({
      servicios: false,
      soporte: false,
      gestion: false,
      equipos: false,
      contacto: false,
    });

    this.destroyRef.onDestroy(() => {
      this.sectionObserver?.disconnect();
    });
  }

  private sectionObserver: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    const view = this.document.defaultView;
    if (!view || !('IntersectionObserver' in view)) {
      this.visibleSections.set({
        servicios: true,
        soporte: true,
        gestion: true,
        equipos: true,
        contacto: true,
      });
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const current = this.visibleSections();
        const updated: Record<string, boolean> = { ...current };

        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (id && entry.isIntersecting) {
            updated[id] = true;
          }
        }

        this.visibleSections.set(updated);
      },
      {
        root: null,
        threshold: 0.18,
      },
    );

    const sectionIds = ['servicios', 'soporte', 'gestion', 'equipos', 'contacto'];
    for (const id of sectionIds) {
      const section = this.document.getElementById(id);
      if (section) {
        this.sectionObserver.observe(section);
      }
    }
  }

  scrollToSection(id: string): void {
    const section = this.document.getElementById(id);
    if (!section) {
      return;
    }

    const offset = 80;
    const absoluteTop = section.getBoundingClientRect().top + (this.document.defaultView?.scrollY ?? 0);

    this.document.defaultView?.scrollTo({
      top: absoluteTop - offset,
      behavior: 'smooth',
    });
  }

  toggleComparison(): void {
    this.showComparison.update((value) => !value);
  }

  isSectionVisible(id: string): boolean {
    return this.visibleSections()[id] ?? false;
  }
}
