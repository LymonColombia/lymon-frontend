import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import { SelectComponent, SelectOption } from '@/presentation/shared/components/select/select.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapHouseFill } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, SelectComponent, NgIcon],
  providers: [provideIcons({ bootstrapHouseFill })],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFormComponent {
  readonly form = input.required<FormGroup>();
  readonly propertyTypeOptions = input.required<SelectOption[]>();
  readonly cancellationPolicyOptions = input.required<SelectOption[]>();
}
