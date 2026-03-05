import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffRepository } from '@/domain/repositories/staff.repository';
import { Property } from '@/domain/entities/staff.model';

@Injectable({ providedIn: 'root' })
export class GetPropertiesUseCase {
  private readonly staffRepository = inject(StaffRepository);

  execute(): Observable<Property[]> {
    return this.staffRepository.getProperties().pipe(map((res) => res.data));
  }
}
