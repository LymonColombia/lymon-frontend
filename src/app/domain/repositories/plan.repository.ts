import { Observable } from 'rxjs';
import { LyhostPlan } from '@/domain/entities/lyhost-plan.model';

export abstract class PlanRepository {
  abstract getAvailablePlans(): Observable<LyhostPlan[]>;
}
