import { ChangeDetectionStrategy, Component} from '@angular/core';
import { bootstrapSearch } from '@ng-icons/bootstrap-icons';
import { provideIcons, NgIcon } from '@ng-icons/core';

@Component({
  selector: 'experience-empty-state',
  standalone: true,
  templateUrl: './experience-empty-state.component.html',
  styleUrl: './experience-empty-state.component.css',
  providers: [provideIcons({ bootstrapSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
})
export class ExperienceEmptyStateComponent {}
