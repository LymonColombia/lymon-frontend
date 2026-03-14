import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { Property } from '@/domain/entities/staff.model';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyCardComponent {
  readonly property = input.required<Property>();
  readonly viewUnits = output<string>();

  readonly propertyTypeLabel = computed(() => {
    const rawType = this.property().propertyType;
    if (!rawType) {
      return '';
    }

    const normalizedType = rawType.toLowerCase();
    return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
  });

  onViewUnits(): void {
    this.viewUnits.emit(this.property().id);
  }
}
