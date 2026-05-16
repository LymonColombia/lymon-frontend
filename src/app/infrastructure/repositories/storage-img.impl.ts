import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { ImageStorageRepository } from '@/domain/repositories/storage-img.repository';
import {
  ImageContentType,
  ImageStorage,
  PresignedUrlResponse,
  UploadedImageResult,
} from '@/domain/entities/storage-img';
import { environment } from '@env';

const BASE_URL = `${environment.apiUrl}${environment.storage.endpoint}`;

@Injectable({ providedIn: 'root' })
export class ImageStorageRepositoryImpl extends ImageStorageRepository {
  private readonly http = inject(HttpClient);
  private readonly allowedContentTypes = new Set<ImageContentType>([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ]);

  uploadImage(input: ImageStorage): Observable<UploadedImageResult> {
    const fileName = input.file.name.slice(0, 255);
    const contentType = input.file.type as ImageContentType;
    if (!this.allowedContentTypes.has(contentType)) {
      throw new Error('Unsupported content type');
    }

    return this.http
      .post<PresignedUrlResponse>(BASE_URL, {
        fileName,
        contentType,
      })
      .pipe(
        map((response) => {
          const presignedUrl = response.data.presignedUrl ?? response.data.uploadUrl;
          const objectKey = response.data.objectKey ?? response.data.key;
          const fileUrl = response.data.fileUrl;
          if (!presignedUrl || !objectKey) {
            throw new Error('Invalid presigned URL response');
          }
          return { presignedUrl, objectKey, fileUrl };
        }),
        switchMap(({ presignedUrl, objectKey, fileUrl }) =>
          this.http
            .put(presignedUrl, {
              headers: new HttpHeaders({
                'Content-Type': contentType,
              }),
              body: input.file,
            })
            .pipe(map(() => ({ objectKey, fileUrl }))),
        ),
      );
  }
}
