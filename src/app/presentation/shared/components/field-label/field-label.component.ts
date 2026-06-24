import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HotelTooltipComponent } from '@/presentation/features/hotel/components/hotel-tooltip/hotel-tooltip';

@Component({
  selector: 'app-field-label',
  standalone: true,
  imports: [HotelTooltipComponent],
  templateUrl: './field-label.component.html',
  styleUrl: './field-label.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldLabelComponent {
  readonly label = input.required<string>();
  readonly forId = input.required<string>();
  readonly description = input<string | null>(null);
  readonly required = input<boolean>(false);
}
