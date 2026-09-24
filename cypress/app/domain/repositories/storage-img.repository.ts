import { Observable } from 'rxjs';
import { ImageStorage, UploadedImageResult } from '../entities/storage-img';

export abstract class ImageStorageRepository {
  abstract uploadImage(file: ImageStorage): Observable<UploadedImageResult>;
}
