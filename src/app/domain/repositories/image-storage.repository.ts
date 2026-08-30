import { Observable } from 'rxjs';
import { ImageStorage, UploadedImageResult } from '@/domain/entities/image-storage.model';

export abstract class ImageStorageRepository {
  abstract uploadImage(file: ImageStorage): Observable<UploadedImageResult>;
}
