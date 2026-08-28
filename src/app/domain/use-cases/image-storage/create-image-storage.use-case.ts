import { ImageStorage, UploadedImageResult } from '@/domain/entities/image-storage.model';
import { ImageStorageRepository } from '@/domain/repositories/image-storage.repository';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CreateImageStorageUseCase {
  private readonly repository = inject(ImageStorageRepository);

  execute(data: ImageStorage): Observable<UploadedImageResult> {
    return this.repository.uploadImage(data);
  }
}
