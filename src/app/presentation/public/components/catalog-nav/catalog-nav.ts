import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapBoxArrowInRight,
  bootstrapCart,
  bootstrapCompass,
  bootstrapHouseDoor,
} from '@ng-icons/bootstrap-icons';
import { ProfileMenuComponent } from '@/presentation/public/components/profile-menu/profile-menu';
import { ButtonComponent } from '@/presentation/shared/components/button/button';

@Component({
  selector: 'app-catalog-nav',
  standalone: true,
  imports: [ButtonComponent, ProfileMenuComponent, NgOptimizedImage, NgIcon, RouterModule],
  providers: [
    provideIcons({
      bootstrapBoxArrowInRight,
      bootstrapCart,
      bootstrapCompass,
      bootstrapHouseDoor,
    }),
  ],
  templateUrl: './catalog-nav.html',
  styleUrl: './catalog-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogNavComponent {
  readonly isAuthenticated = input.required<boolean>();
  readonly guestEmail = input<string | null>(null);

  readonly loginClicked = output<void>();
  readonly logoutClicked = output<void>();
  readonly myReservationsClicked = output<void>();
}
