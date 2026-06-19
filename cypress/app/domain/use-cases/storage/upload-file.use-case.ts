import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StorageRepository } from '@/domain/repositories/storage.repository';
import { UploadedFile } from '@/domain/entities/storage.model';

@Injectable({ providedIn: 'root' })
export class UploadFileUseCase {
  private readonly storageRepository = inject(StorageRepository);

  execute(file: File): Observable<UploadedFile> {
    return this.storageRepository
      .getPresignedUrl({ fileName: file.name, contentType: file.type })
      .pipe(
        switchMap(({ presignedUrl, fileUrl, key }) =>
          this.storageRepository
            .uploadToPresignedUrl(presignedUrl, file)
            .pipe(map(() => ({ fileUrl, key, fileName: file.name, contentType: file.type }))),
        ),
      );
  }
}
