import { ImageStorage, UploadedImageResult } from '@/domain/tenant/image-storage/image-storage.model';
import { ImageStorageRepository } from '@/domain/tenant/image-storage/image-storage.repository';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CreateImageStorageUseCase {
  private readonly repository = inject(ImageStorageRepository);

  execute(data: ImageStorage): Observable<UploadedImageResult> {
    return this.repository.uploadImage(data);
  }
}
