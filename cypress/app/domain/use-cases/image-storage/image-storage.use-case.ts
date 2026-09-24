import { ImageStorage, UploadedImageResult } from '@/domain/entities/storage-img';
import { ImageStorageRepository } from '@/domain/repositories/storage-img.repository';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CreateImageStorageUseCase {
  private readonly repository = inject(ImageStorageRepository);

  execute(data: ImageStorage): Observable<UploadedImageResult> {
    return this.repository.uploadImage(data);
  }
}
