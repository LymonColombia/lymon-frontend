import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UploadFileUseCase } from '@/domain/use-cases/storage/upload-file.use-case';
import { UploadedFile } from '@/domain/entities/storage.model';

@Component({
  selector: 'app-storage-test',
  templateUrl: './storageTest.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageTestComponent {
  private readonly uploadFileUseCase = inject(UploadFileUseCase);

  readonly isUploading = signal(false);
  readonly result = signal<UploadedFile | null>(null);
  readonly error = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (!file) return;

    this.isUploading.set(true);
    this.result.set(null);
    this.error.set(null);

    this.uploadFileUseCase.execute(file).subscribe({
      next: (uploaded) => {
        this.result.set(uploaded);
        this.isUploading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Upload failed');
        this.isUploading.set(false);
      },
    });
  }
}
