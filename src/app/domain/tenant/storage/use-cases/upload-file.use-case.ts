import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StorageRepository } from '@/domain/tenant/storage/storage.repository';
import { MediaCategory, UploadedFile } from '@/domain/tenant/storage/storage.model';

@Injectable({ providedIn: 'root' })
export class UploadFileUseCase {
  private readonly storageRepository = inject(StorageRepository);

  execute(file: File, category: MediaCategory): Observable<UploadedFile> {
    return this.storageRepository
      .getPresignedUrl({ fileName: file.name, contentType: file.type, fileSize: file.size, category })
      .pipe(
        switchMap(({ presignedUrl, fileUrl, key }) =>
          this.storageRepository
            .uploadToPresignedUrl(presignedUrl, file)
            .pipe(map(() => ({ fileUrl, key, fileName: file.name, contentType: file.type }))),
        ),
      );
  }
}
