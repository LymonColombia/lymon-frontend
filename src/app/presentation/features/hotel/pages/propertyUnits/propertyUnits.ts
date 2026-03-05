import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { SidebarComponent } from '@/presentation/shared/components/sidebar/sidebar';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { Unit } from '@/domain/entities/staff.model';

@Component({
  selector: 'app-property-units',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarComponent, DecimalPipe],
  templateUrl: './propertyUnits.html',
  styleUrl: './propertyUnits.css',
})
export class PropertyUnitsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly propertyId = signal<string | null>(null);
  readonly propertyName = signal<string>('Propiedad');
  readonly propertyType = signal<string | null>(null);
  readonly units = signal<Unit[]>([]);

  ngOnInit(): void {
    const pid = this.route.snapshot.queryParamMap.get('propertyId');
    if (!pid) {
      this.router.navigate(['/properties']);
      return;
    }
    this.propertyId.set(pid);

    // Resolve property name
    this.getPropertiesUseCase.execute().subscribe({
      next: (props) => {
        const found = props.find((p) => p.id === pid);
        if (found) {
          this.propertyName.set(found.name);
          this.propertyType.set(found.propertyType);
        }
      },
      error: () => {},
    });

    // Load units
    this.getUnitsUseCase.execute(pid).subscribe({
      next: (units) => {
        this.units.set(units);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las unidades. Inténtalo de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  navigateToCreateUnit(): void {
    this.router.navigate(['/create-room'], {
      queryParams: { propertyId: this.propertyId() },
    });
  }

  goBack(): void {
    this.router.navigate(['/properties']);
  }
}
