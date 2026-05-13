import { Observable } from 'rxjs';
import { CreatePropertyDto, CreateUnitDto, PropertyDetail, UpdatePropertyDto } from '@/domain/entities/property.model';

export abstract class PropertyRepository {
  abstract createProperty(data: CreatePropertyDto): Observable<unknown>;
  abstract createUnit(data: CreateUnitDto): Observable<unknown>;
  abstract getPropertyById(id: string): Observable<PropertyDetail>;
  abstract updateProperty(id: string, data: UpdatePropertyDto): Observable<unknown>;
  abstract deleteProperty(id: string): Observable<unknown>;
}
