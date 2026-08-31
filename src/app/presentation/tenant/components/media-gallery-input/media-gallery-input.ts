import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCloudUpload, bootstrapTrash } from '@ng-icons/bootstrap-icons';

import { MediaItem } from '@/domain/tenant/storage/storage.model';
import { ButtonComponent } from '@/presentation/shared/components/button/button';

const DEFAULT_ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

interface NewEntry {
  file: File;
  previewUrl: string;
}

export interface MediaGallerySelection {
  /** Existing photos the user kept (keys for replace-all writes). */
  kept: MediaItem[];
  /** Newly picked files still to be uploaded. */
  newFiles: File[];
}

@Component({
  selector: 'app-media-gallery-input',
  standalone: true,
  imports: [NgIcon, ButtonComponent],
  providers: [provideIcons({ bootstrapCloudUpload, bootstrapTrash })],
  templateUrl: './media-gallery-input.html',
  styleUrl: './media-gallery-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaGalleryInputComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly initialItems = input<MediaItem[]>([]);
  readonly allowedTypes = input<ReadonlySet<string>>(DEFAULT_ALLOWED_IMAGE_TYPES);
  readonly label = input('Galería de fotos');

  readonly selectionChange = output<MediaGallerySelection>();

  // Resets to the loaded photos whenever a different experience/unit is bound.
  readonly keptItems = linkedSignal<MediaItem[]>(() => [...this.initialItems()]);
  readonly newEntries = signal<NewEntry[]>([]);

  constructor() {
    effect(() => {
      this.selectionChange.emit({
        kept: this.keptItems(),
        newFiles: this.newEntries().map((entry) => entry.file),
      });
    });
    this.destroyRef.onDestroy(() => this.revokeAll());
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = Array.from(input?.files ?? []);
    const allowed = this.allowedTypes();
    const valid = files.filter((file) => allowed.has(file.type));

    if (valid.length) {
      this.newEntries.update((entries) => [
        ...entries,
        ...valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
      ]);
    }

    if (input) input.value = '';
  }

  removeExisting(index: number): void {
    this.keptItems.update((items) => items.filter((_, i) => i !== index));
  }

  removeNew(index: number): void {
    this.newEntries.update((entries) => {
      const target = entries[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return entries.filter((_, i) => i !== index);
    });
  }

  private revokeAll(): void {
    this.newEntries().forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
  }
}
