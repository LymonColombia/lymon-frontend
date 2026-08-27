import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '@/presentation/shared/components/input/input.component';
import {
  AddressMapPickerComponent,
  NominatimResult,
} from '@/presentation/tenant/features/properties/pages/properties/components/address-map-picker/address-map-picker';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapHouseFill } from '@ng-icons/bootstrap-icons';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    AddressMapPickerComponent,
    NgIcon,
  ],
  providers: [provideIcons({ bootstrapHouseFill })],
  templateUrl: './property-form.html',
  styleUrl: './property-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyFormComponent {
  readonly form = input.required<FormGroup>();

  onGeocodeResult(result: NominatimResult): void {
    const address = result.address;
    if (!address) return;

    const current = this.form().getRawValue();
    this.form().patchValue({
      city: address.city ?? address.town ?? address.village ?? current.city,
      state: address.state ?? current.state,
      country: address.country ?? current.country,
      zipCode: address.postcode ?? current.zipCode,
    });
  }
}
