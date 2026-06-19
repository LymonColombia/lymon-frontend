import { Observable } from 'rxjs';
import { CreatePropertyDto, CreateUnitDto, PropertyDetail, UpdatePropertyDto, UpdateUnitDto, UpdateUnitMediaKeysDto } from '@/domain/entities/property.model';
import { Unit } from '@/domain/entities/staff.model';

export abstract class PropertyRepository {
  abstract createProperty(data: CreatePropertyDto): Observable<unknown>;
  abstract createUnit(data: CreateUnitDto): Observable<unknown>;
  abstract getPropertyById(id: string): Observable<PropertyDetail>;
  abstract updateProperty(id: string, data: UpdatePropertyDto): Observable<unknown>;
  abstract deleteProperty(id: string): Observable<unknown>;
  abstract updateUnitMediaKeys(id: string, data: UpdateUnitMediaKeysDto): Observable<unknown>;
  abstract updateUnit(id: string, data: UpdateUnitDto): Observable<unknown>;
  abstract deleteUnit(id: string): Observable<unknown>;
  abstract getUnitById(id: string): Observable<Unit>;
}
