import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { BreadcrumbComponent } from "@/presentation/shared/components/breadcrumb/breadcrumb.component";

@Component({
  selector: 'app-guest-recommendation-experience',
  standalone: true,
  imports: [BreadcrumbComponent],
  templateUrl: './guest-recommendation-experience.html',
  styleUrl: './guest-recommendation-experience.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestRecommendationExperienceComponent {
  readonly addToCart = output<void>();

  onAdd(): void {
    this.addToCart.emit();
  }

}
