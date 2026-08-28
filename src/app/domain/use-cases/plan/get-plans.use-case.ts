import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlanRepository } from '@/domain/repositories/plan.repository';
import { Plan } from '@/domain/entities/plan.model';

@Injectable({ providedIn: 'root' })
export class GetPlansUseCase {
  private readonly planRepository = inject(PlanRepository);

  execute(): Observable<Plan[]> {
    return this.planRepository.getAvailablePlans();
  }
}
