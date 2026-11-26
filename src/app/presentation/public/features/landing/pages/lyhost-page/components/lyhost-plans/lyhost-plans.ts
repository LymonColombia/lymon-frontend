import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@/presentation/shared/components/button/button';

interface PlanColumn {
  name: string;
  subtitle: string;
  price: string;
  note: string;
  features: string[];
  cta: string;
  featured: boolean;
}

@Component({
  selector: 'app-lyhost-plans',
  imports: [ButtonComponent],
  templateUrl: './lyhost-plans.html',
  styleUrls: ['../../lyhost-theme.css', './lyhost-plans.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  private readonly router = inject(Router);

  // ponytail: landing copy is marketing text from the design; checkout reads PLANS from the domain
  readonly columns: PlanColumn[] = [
    {
      name: 'LyHost One',
      subtitle: 'Para propietarios independientes',
      price: '$ 124.999',
      note: 'COP / mes',
      features: [
        'Hasta 5 propiedades',
        'Hasta 2 usuarios',
        'Habitaciones ilimitadas',
        'Gestión básica de inventario',
        'Registro de auditoría',
        '2 experiencias activas',
        'Roles y turnos básicos',
      ],
      cta: 'Adquirir One',
      featured: false,
    },
    {
      name: 'LyHost Plus',
      subtitle: 'Para equipos en crecimiento',
      price: '$ 179.999',
      note: 'COP / mes · todo lo de One, y además',
      features: [
        'Hasta 20 propiedades',
        'Hasta 10 usuarios',
        'CRM integrado',
        'Reportes y analíticas',
        'Gestión financiera básica',
        'Soporte prioritario',
      ],
      cta: 'Adquirir Plus',
      featured: true,
    },
    {
      name: 'LyHost Prime',
      subtitle: 'Solución completa sin límites',
      price: '$ 280.000',
      note: 'COP / mes · todo incluido',
      features: [
        'Propiedades ilimitadas',
        'Usuarios ilimitados',
        'Habitaciones ilimitadas',
        'Soporte 24/7',
        'Capacitación personalizada',
      ],
      cta: 'Adquirir Prime',
      featured: false,
    },
  ];

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
