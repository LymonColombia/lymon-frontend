import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanRepository } from '@/domain/repositories/plan.repository';
import { LyhostPlan } from '@/domain/entities/lyhost-plan.model';

@Injectable({ providedIn: 'root' })
export class GetPlansUseCase {
  private readonly planRepository = inject(PlanRepository);

  execute(): Observable<LyhostPlan[]> {
    return this.planRepository.getAvailablePlans();
  }
}
