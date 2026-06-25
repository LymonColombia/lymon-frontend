import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { PlanRepository } from '@/domain/repositories/plan.repository';
import { PlanType } from '@/domain/entities/auth.model';
import { LyhostPlan, LYHOST_PLANS } from '@/domain/entities/lyhost-plan.model';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class PlanRepositoryImpl extends PlanRepository {
  private readonly http = inject(HttpClient);

  getAvailablePlans(): Observable<LyhostPlan[]> {
    const endpoint = environment.plans?.endpoint;

    if (!endpoint) {
      return of([...LYHOST_PLANS]).pipe(delay(300));
    }

    return this.http.get<unknown>(`${environment.apiUrl}${endpoint}`).pipe(
      map((res) => this.mapToPlans(res)),
      catchError(() => of([...LYHOST_PLANS])),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToPlans(raw: any): LyhostPlan[] {
    const list = Array.isArray(raw) ? raw : raw?.data;
    if (!Array.isArray(list)) return [...LYHOST_PLANS];

    return list
      .map<LyhostPlan>((item) => ({
        type: (item?.type ?? item?.planType) as PlanType,
        name: String(item?.name ?? ''),
        subtitle: String(item?.description ?? item?.subtitle ?? ''),
        price: String(item?.price ?? ''),
        priceSuffix: item?.priceSuffix ? String(item.priceSuffix) : undefined,
        priceNote: item?.priceNote ? String(item.priceNote) : undefined,
        isFree:
          item?.isFree === true ||
          String(item?.price ?? '').trim() === '$0' ||
          String(item?.price ?? '').trim() === '0' ||
          String(item?.price ?? '').trim().toLowerCase() === 'gratis',
        detailsSections: Array.isArray(item?.detailsSections) ? item.detailsSections : [],
      }))
      .filter((p) => !!p.type);
  }
}
