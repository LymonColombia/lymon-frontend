import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'catalog-skeleton-card',
  standalone: true,
  templateUrl: './catalog-skeleton-card.html',
  styleUrl: './catalog-skeleton-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSkeletonCardComponent {}
