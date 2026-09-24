import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'catalog-pagination',
  standalone: true,
  imports: [],
  templateUrl: './catalog-pagination.html',
  styleUrl: './catalog-pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPaginationComponent {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly disabled = input(false);
  readonly pageChange = output<number>();

  readonly visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];

    if (current > 3) pages.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push('...');

    pages.push(total);
    return pages;
  });

  goToPage(page: number | '...'): void {
    if (this.disabled()) return;
    if (page === '...') return;
    if (page === this.currentPage()) return;
    this.pageChange.emit(page);
  }

  prevPage(): void {
    if (this.disabled()) return;
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.disabled()) return;
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
