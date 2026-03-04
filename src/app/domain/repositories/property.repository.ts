import { Observable } from 'rxjs';
import { CreatePropertyDto, CreateUnitDto } from '@/domain/entities/property.model';

export abstract class PropertyRepository {
  abstract createProperty(data: CreatePropertyDto): Observable<unknown>;
  abstract createUnit(data: CreateUnitDto): Observable<unknown>;
}
