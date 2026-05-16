import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageRepository } from '@/domain/repositories/storage.repository';
import { GetPresignedUrlRequest, GetPresignedUrlResponse } from '@/domain/entities/storage.model';
import { GetPresignedUrlResponseDto } from '@/infrastructure/dtos/storage.dto';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class StorageRepositoryImpl extends StorageRepository {
  private readonly http = inject(HttpClient);

  getPresignedUrl(data: GetPresignedUrlRequest): Observable<GetPresignedUrlResponse> {
    return this.http
      .post<GetPresignedUrlResponseDto>(`${environment.apiUrl}${environment.storage.endpoint}`, data)
      .pipe(map((res) => res.data));
  }

  uploadToPresignedUrl(presignedUrl: string, file: File): Observable<void> {
    return from(
      fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`R2 upload failed (${res.status}): ${body}`);
        }
      }),
    );
  }
}
