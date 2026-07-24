import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Experience } from '@/domain/entities/experience.model';
import { provideIcons, NgIcon } from "@ng-icons/core";
import {  bootstrapTrash ,bootstrapEye, bootstrapPencilSquare} from '@ng-icons/bootstrap-icons';
import { coverImageOf } from '@/presentation/shared/utils/media.util';
import {  getAvailabilitySummary } from '../../models/experience-form.model';
import { formatPrice } from '@/presentation/shared/utils/price-formatter';
import { getCategoryLabel } from '@/presentation/shared/utils/category-experience-formatter';

@Component({
  selector: 'app-experience-table',
  standalone: true,
  templateUrl: './experience-table.component.html',
  styleUrl: './experience-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ bootstrapTrash , bootstrapEye,bootstrapPencilSquare })],
})
export class ExperienceTableComponent {

  readonly experiences = input.required<Experience[]>();
  readonly view = output<string>();
  readonly edit = output<string>();
  readonly delete = output<string>();

  readonly formatPrice = formatPrice;
  readonly getCategoryLabel = getCategoryLabel;
  readonly getAvailabilitySummary = getAvailabilitySummary;
  readonly coverImageOf = coverImageOf;

  onView(id: string | undefined): void {
    if (id) {
      this.view.emit(id);
    }
  }

  onEdit(id: string | undefined): void {
    if (id) {
      this.edit.emit(id);
    }
  }

  onDelete(id: string | undefined): void {
    if (id) {
      this.delete.emit(id);
    }
  }
}
