import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapClock,
  bootstrapPlusCircle,
  bootstrapStarFill,
} from '@ng-icons/bootstrap-icons';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import { RecommendationExperience } from '../../guest-cart.models';
import { BreadcrumbComponent } from "@/presentation/shared/components/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-guest-recommendation-experience',
  standalone: true,
  imports: [BreadcrumbComponent],
  providers: [provideIcons({ bootstrapClock, bootstrapPlusCircle, bootstrapStarFill })],
  templateUrl: './guest-recommendation-experience.html',
  styleUrl: './guest-recommendation-experience.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestRecommendationExperienceComponent {
  readonly addToCart = output<RecommendationExperience>();

  onAdd(item: RecommendationExperience): void {
    this.addToCart.emit(item);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
}
