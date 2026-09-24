import { Observable } from 'rxjs';
import { Plan } from '@/domain/shared/plan/plan.model';

export abstract class PlanRepository {
  abstract getAvailablePlans(): Observable<Plan[]>;
}
