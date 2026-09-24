import { Observable } from 'rxjs';
import { ImageStorage, UploadedImageResult } from '@/domain/tenant/image-storage/image-storage.model';

export abstract class ImageStorageRepository {
  abstract uploadImage(file: ImageStorage): Observable<UploadedImageResult>;
}
