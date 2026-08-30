import { Observable } from 'rxjs';
import { GetPresignedUrlRequest, GetPresignedUrlResponse } from '@/domain/tenant/storage/storage.model';

export abstract class StorageRepository {
  abstract getPresignedUrl(data: GetPresignedUrlRequest): Observable<GetPresignedUrlResponse>;
  abstract uploadToPresignedUrl(presignedUrl: string, file: File): Observable<void>;
}
