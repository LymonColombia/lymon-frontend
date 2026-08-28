import { Observable } from 'rxjs';
import { Plan } from '@/domain/entities/plan.model';

export abstract class PlanRepository {
  abstract getAvailablePlans(): Observable<Plan[]>;
}
