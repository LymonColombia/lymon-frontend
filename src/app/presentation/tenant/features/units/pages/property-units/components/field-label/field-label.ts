import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TooltipComponent } from '@/presentation/tenant/components/tooltip/tooltip';

@Component({
  selector: 'app-field-label',
  standalone: true,
  imports: [TooltipComponent],
  templateUrl: './field-label.html',
  styleUrl: './field-label.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldLabelComponent {
  readonly label = input.required<string>();
  readonly forId = input.required<string>();
  readonly description = input<string | null>(null);
  readonly required = input<boolean>(false);
}
