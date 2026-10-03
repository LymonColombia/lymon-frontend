import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { StorageRepositoryImpl } from './storage.repository.impl';
import { environment } from '@env';
import { GetPresignedUrlRequest, GetPresignedUrlResponse } from '@/domain/tenant/storage/storage.model';
import { GetPresignedUrlResponseDto } from '@/infrastructure/tenant/storage/storage.dto';

const PRESIGNED_URL_ENDPOINT = `${environment.apiUrl}${environment.storage.endpoint}`;

describe('StorageRepositoryImpl', () => {
  let repository: StorageRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageRepositoryImpl, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(StorageRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getPresignedUrl()', () => {
    const request: GetPresignedUrlRequest = {
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      fileSize: 1024,
      category: 'experiences',
    };

    const mockDto: GetPresignedUrlResponseDto = {
      message: 'Presigned URL generated',
      data: {
        presignedUrl: 'https://r2.example.com/presigned?token=abc123',
        fileUrl: 'https://cdn.example.com/uploads/photo.jpg',
        key: 'uploads/photo.jpg',
      },
    };

    it('should POST to the storage endpoint with the request body', () => {
      repository.getPresignedUrl(request).subscribe();

      const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockDto);
    });

    it('should map the response DTO data field to a GetPresignedUrlResponse', () => {
      const expected: GetPresignedUrlResponse = {
        presignedUrl: mockDto.data.presignedUrl,
        fileUrl: mockDto.data.fileUrl,
        key: mockDto.data.key,
      };

      repository.getPresignedUrl(request).subscribe((response) => {
        expect(response).toEqual(expected);
      });

      const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
      req.flush(mockDto);
    });

    it('should not expose the message wrapper field from the DTO', () => {
      repository.getPresignedUrl(request).subscribe((response) => {
        expect((response as unknown as Record<string, unknown>)['message']).toBeUndefined();
      });

      const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
      req.flush(mockDto);
    });

    it('should propagate HTTP errors from the server', () => {
      return new Promise<void>((resolve) => {
        repository.getPresignedUrl(request).subscribe({
          error: (err) => {
            expect(err.status).toBe(500);
            resolve();
          },
        });

        const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
        req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
      });
    });

    it('should propagate 401 Unauthorized errors from the server', () => {
      return new Promise<void>((resolve) => {
        repository.getPresignedUrl(request).subscribe({
          error: (err) => {
            expect(err.status).toBe(401);
            resolve();
          },
        });

        const req = httpMock.expectOne(PRESIGNED_URL_ENDPOINT);
        req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      });
    });
  });

  describe('uploadToPresignedUrl()', () => {
    const PRESIGNED_URL = 'https://r2.example.com/bucket/uploads/photo.jpg?X-Amz-Signature=abc';
    let fetchMock: ReturnType<typeof vi.fn>;

    const makeFile = (name = 'photo.jpg', type = 'image/jpeg'): File =>
      new File(['file-content'], name, { type });

    const lastFetchInit = (): RequestInit => fetchMock.mock.calls[0][1] as RequestInit;

    beforeEach(() => {
      fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should PUT the file to the presigned URL', async () => {
      await firstValueFrom(repository.uploadToPresignedUrl(PRESIGNED_URL, makeFile()));

      expect(fetchMock).toHaveBeenCalledWith(PRESIGNED_URL, expect.objectContaining({ method: 'PUT' }));
    });

    it('should send the file as the PUT request body', async () => {
      const file = makeFile();

      await firstValueFrom(repository.uploadToPresignedUrl(PRESIGNED_URL, file));

      expect(lastFetchInit().body).toBe(file);
    });

    it('should set the Content-Type header to the file MIME type', async () => {
      await firstValueFrom(repository.uploadToPresignedUrl(PRESIGNED_URL, makeFile('photo.jpg', 'image/jpeg')));

      expect(lastFetchInit().headers).toEqual({ 'Content-Type': 'image/jpeg' });
    });

    it('should set the correct Content-Type header for non-image files', async () => {
      await firstValueFrom(repository.uploadToPresignedUrl(PRESIGNED_URL, makeFile('document.pdf', 'application/pdf')));

      expect(lastFetchInit().headers).toEqual({ 'Content-Type': 'application/pdf' });
    });

    it('should NOT send an Authorization header in the R2 PUT request', async () => {
      // R2 presigned URLs must not include the app Authorization token.
      // fetch bypasses the Angular auth interceptor, and no header is added manually.
      await firstValueFrom(repository.uploadToPresignedUrl(PRESIGNED_URL, makeFile()));

      expect(lastFetchInit().headers).not.toHaveProperty('Authorization');
      expect(httpMock.match(PRESIGNED_URL)).toHaveLength(0);
    });

    it('should propagate upload errors from the presigned URL endpoint', async () => {
      fetchMock.mockResolvedValue(new Response('Forbidden', { status: 403 }));

      await expect(
        firstValueFrom(repository.uploadToPresignedUrl(PRESIGNED_URL, makeFile())),
      ).rejects.toThrow('R2 upload failed (403): Forbidden');
    });
  });
});
