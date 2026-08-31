import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanRepository } from '@/domain/shared/plan/plan.repository';
import { Plan } from '@/domain/shared/plan/plan.model';

@Injectable({ providedIn: 'root' })
export class GetPlansUseCase {
  private readonly planRepository = inject(PlanRepository);

  execute(): Observable<Plan[]> {
    return this.planRepository.getAvailablePlans();
  }
}
