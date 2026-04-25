import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CrmGuest,
  CrmGuestBooking,
  CrmGuestBookingSource,
  CrmGuestEmail,
  CrmGuestMessageTemplateId,
  CrmGuestNote,
  CrmGuestNoteCategory,
  CreateCrmGuestNoteRequest,
  UpdateCrmGuestNoteRequest,
  SendCrmGuestMessageRequest,
} from '@/domain/entities/crm-guest.model';
import { CreateCrmGuestNoteUseCase } from '@/domain/use-cases/crm/create-crm-guest-note.use-case';
import { UpdateCrmGuestNoteUseCase } from '@/domain/use-cases/crm/update-crm-guest-note.use-case';
import { DeleteCrmGuestNoteUseCase } from '@/domain/use-cases/crm/delete-crm-guest-note.use-case';
import { PinCrmGuestNoteUseCase } from '@/domain/use-cases/crm/pin-crm-guest-note.use-case';
import { SendCrmGuestMessageUseCase } from '@/domain/use-cases/crm/send-crm-guest-message.use-case';
import { GetCrmGuestBookingsUseCase } from '@/domain/use-cases/crm/get-crm-guest-bookings.use-case';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';
import { GetCrmGuestNotesUseCase } from '@/domain/use-cases/crm/get-crm-guest-notes.use-case';
import { GetCrmGuestEmailsUseCase } from '@/domain/use-cases/crm/get-crm-guest-emails.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { Property, Unit } from '@/domain/entities/staff.model';
import { NgTemplateOutlet } from '@angular/common';
import { HotelPageLayoutComponent, HotelPageIconDirective } from '@/presentation/features/hotel/components/hotel-page-layout/hotel-page-layout';
import { ButtonComponent } from '@/presentation/shared/components/button/button.component';
import {
  SelectComponent,
  SelectOption,
} from '@/presentation/shared/components/select/select.component';
import { ModalComponent } from '@/presentation/shared/components/modal/modal.component';
import { BreadcrumbItem } from '@/presentation/shared/components/breadcrumb/breadcrumb.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import {
  bootstrapPersonFill,
  bootstrapEnvelope,
  bootstrapTelephone,
  bootstrapTags,
  bootstrapHouseDoor,
  bootstrapCalendarCheck,
  bootstrapWallet2,
  bootstrapCardText,
  bootstrapPinAngleFill,
  bootstrapPlus,
  bootstrapMoonStars,
  bootstrapSun,
  bootstrapChevronLeft,
  bootstrapEnvelopeFill,
  bootstrapEnvelopeOpen,
  bootstrapTrash,
  bootstrapPaperclip,
  bootstrapFileEarmark,
  bootstrapX,
  bootstrapPencil,
} from '@ng-icons/bootstrap-icons';

type PropertyLookupItem = Property & {
  _id?: string;
  propertyId?: string;
  title?: string;
};

type UnitLookupItem = Unit & {
  _id?: string;
  unitId?: string;
  title?: string;
  unitName?: string;
};

type BookingStatusTone = 'info' | 'muted' | 'success' | 'warning' | 'danger';
type SelectValue = string | number | null;

const NOTE_MAX_LENGTH = 280;
const EMAIL_HISTORY_LIMIT = 5;

const NOTE_CATEGORIES: readonly CrmGuestNoteCategory[] = ['general', 'preference', 'behavior', 'incident'];

function isNoteCategory(value: SelectValue): value is CrmGuestNoteCategory {
  return typeof value === 'string' && (NOTE_CATEGORIES as readonly string[]).includes(value);
}

@Component({
  selector: 'app-guest-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HotelPageLayoutComponent, HotelPageIconDirective, ButtonComponent, SelectComponent, NgIcon, ModalComponent, NgTemplateOutlet],
  providers: [
    provideIcons({
      bootstrapPersonFill,
      bootstrapEnvelope,
      bootstrapTelephone,
      bootstrapTags,
      bootstrapHouseDoor,
      bootstrapCalendarCheck,
      bootstrapWallet2,
      bootstrapCardText,
      bootstrapPinAngleFill,
      bootstrapPlus,
      bootstrapMoonStars,
      bootstrapSun,
      bootstrapChevronLeft,
      bootstrapEnvelopeFill,
      bootstrapEnvelopeOpen,
      bootstrapTrash,
      bootstrapPaperclip,
      bootstrapFileEarmark,
      bootstrapX,
      bootstrapPencil,
    }),
  ],
  templateUrl: './guestProfile.html',
  styleUrl: './guestProfile.css',
})
export class GuestProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getCrmGuestsUseCase = inject(GetCrmGuestsUseCase);
  private readonly getCrmGuestBookingsUseCase = inject(GetCrmGuestBookingsUseCase);
  private readonly getCrmGuestNotesUseCase = inject(GetCrmGuestNotesUseCase);
  private readonly createCrmGuestNoteUseCase = inject(CreateCrmGuestNoteUseCase);
  private readonly updateCrmGuestNoteUseCase = inject(UpdateCrmGuestNoteUseCase);
  private readonly deleteCrmGuestNoteUseCase = inject(DeleteCrmGuestNoteUseCase);
  private readonly pinCrmGuestNoteUseCase = inject(PinCrmGuestNoteUseCase);
  private readonly sendCrmGuestMessageUseCase = inject(SendCrmGuestMessageUseCase);
  private readonly getCrmGuestEmailsUseCase = inject(GetCrmGuestEmailsUseCase);
  private readonly getPropertiesUseCase = inject(GetPropertiesUseCase);
  private readonly getUnitsUseCase = inject(GetUnitsUseCase);

  readonly isGuestLoading = signal(true);
  readonly isBookingsLoading = signal(false);
  readonly isNotesLoading = signal(false);
  readonly notFoundError = signal(false);
  readonly guestErrorMessage = signal<string | null>(null);
  readonly bookingsErrorMessage = signal<string | null>(null);

  readonly guest = signal<CrmGuest | null>(null);
  readonly bookings = signal<CrmGuestBooking[]>([]);
  readonly notes = signal<CrmGuestNote[]>([]);
  readonly emails = signal<CrmGuestEmail[]>([]);
  readonly isEmailsLoading = signal(false);
  readonly emailsErrorMessage = signal<string | null>(null);
  readonly isEmailsExpanded = signal(false);

  readonly visibleEmails = computed(() =>
    this.isEmailsExpanded() ? this.emails() : this.emails().slice(0, EMAIL_HISTORY_LIMIT),
  );
  readonly hasMoreEmails = computed(() => this.emails().length > EMAIL_HISTORY_LIMIT);

  readonly propertyNamesById = signal<Record<string, string>>({});
  readonly unitNamesById = signal<Record<string, string>>({});
  readonly loadedUnitPropertyIds = signal<string[]>([]);

  readonly activeNoteFilter = signal<CrmGuestNoteCategory | 'all'>('all');
  readonly isNoteFormVisible = signal(false);
  readonly isSavingNote = signal(false);
  readonly noteCategory = signal<CrmGuestNoteCategory>('general');
  readonly noteContent = signal('');
  readonly noteErrorMessage = signal<string | null>(null);

  readonly isEditNoteModalOpen = signal(false);
  readonly editingNote = signal<CrmGuestNote | null>(null);
  readonly editNoteContent = signal('');
  readonly editNoteCategory = signal<CrmGuestNoteCategory>('general');
  readonly isUpdatingNote = signal(false);
  readonly editNoteErrorMessage = signal<string | null>(null);
  readonly editNoteCharCount = computed(() => this.editNoteContent().length);

  readonly isDeleteNoteModalOpen = signal(false);
  readonly deletingNote = signal<CrmGuestNote | null>(null);
  readonly isDeletingNote = signal(false);
  readonly deleteNoteErrorMessage = signal<string | null>(null);

  readonly noteFilterTabs: Array<{ value: CrmGuestNoteCategory | 'all'; label: string }> = [
    { value: 'all', label: 'Todas' },
    { value: 'general', label: 'General' },
    { value: 'preference', label: 'Preferencias' },
    { value: 'behavior', label: 'Comportamiento' },
    { value: 'incident', label: 'Incidente' },
  ];

  readonly guestNoteSelectOptions: SelectOption[] = [
    { value: 'general', label: 'General' },
    { value: 'preference', label: 'Preferencia' },
    { value: 'behavior', label: 'Comportamiento' },
    { value: 'incident', label: 'Incidente' },
  ];

  readonly guestInitials = computed(() =>
    (this.guest()?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
  );

  readonly guestTags = computed(() =>
    this.guest()?.tags?.filter((tag) => tag.trim().length > 0) ?? [],
  );

  readonly pinnedNotes = computed(() => this.notes().filter((n) => n.status === 'pinned'));

  readonly filteredNotes = computed(() => {
    const unpinned = this.notes().filter((n) => n.status === 'not_pinned');
    const filter = this.activeNoteFilter();
    if (filter === 'all') return unpinned;
    return unpinned.filter((n) => n.type === filter);
  });

  readonly sortedBookings = computed(() =>
    [...this.bookings()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  readonly totalBookings = computed(() => this.bookings().length);

  readonly totalSpend = computed(() =>
    this.bookings().reduce((sum, b) => sum + b.totalAmount, 0),
  );

  readonly avgStayNights = computed(() => {
    const bks = this.bookings();
    if (bks.length === 0) return null;
    const total = bks.reduce((sum, b) => {
      const nights =
        (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24);
      return sum + Math.max(0, nights);
    }, 0);
    return Math.round(total / bks.length);
  });

  readonly preferredProperty = computed(() => {
    const bks = this.bookings();
    if (bks.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const b of bks) {
      const name = b.propertyName || this.propertyNamesById()[b.propertyId] || 'Desconocida';
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  });

  readonly preferredSeason = computed(() => {
    const bks = this.bookings();
    if (bks.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const b of bks) {
      const s = this.seasonOf(b.checkIn);
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  });

  readonly noteCharCount = computed(() => this.noteContent().length);

  readonly isMessageFormVisible = signal(false);
  readonly isSendingMessage = signal(false);
  readonly messageSubject = signal('');
  readonly messageBody = signal('');
  readonly messageTemplateId = signal<CrmGuestMessageTemplateId>('guest-message');
  readonly attachedFiles = signal<File[]>([]);
  readonly isDragOver = signal(false);
  readonly messageErrorMessage = signal<string | null>(null);
  readonly messageSentSuccess = signal(false);

  readonly messageTemplateSelectOptions: SelectOption[] = [
    { value: 'guest-message', label: 'Mensaje general' },
    { value: 'GUEST_WELCOME', label: 'Bienvenida al huésped' },
  ];

  readonly breadcrumbItems = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'CRM de Huéspedes', route: '/crm/guests' },
    { label: this.guest()?.name ?? 'Perfil del huésped' },
  ]);

  ngOnInit(): void {
    const guestId = this.route.snapshot.paramMap.get('guestId');
    if (!guestId) {
      this.notFoundError.set(true);
      this.isGuestLoading.set(false);
      return;
    }

    this.loadGuest(guestId);
  }

  setNoteFilter(value: CrmGuestNoteCategory | 'all'): void {
    this.activeNoteFilter.set(value);
  }

  setNoteCategory(value: SelectValue): void {
    if (!isNoteCategory(value)) return;
    this.noteCategory.set(value);
  }

  onNoteContentChange(value: string): void {
    this.noteContent.set(value.slice(0, NOTE_MAX_LENGTH));
  }

  openNoteForm(): void {
    this.isNoteFormVisible.set(true);
    this.noteErrorMessage.set(null);
  }

  cancelNoteForm(): void {
    this.resetNoteForm();
  }

  openMessageForm(): void {
    this.isMessageFormVisible.set(true);
    this.messageErrorMessage.set(null);
    this.messageSentSuccess.set(false);
  }

  cancelMessageForm(): void {
    this.resetMessageForm();
  }

  setMessageTemplateId(value: SelectValue): void {
    if (value !== 'GUEST_WELCOME' && value !== 'guest-message') return;
    this.messageTemplateId.set(value);
  }

  onMessageSubjectChange(value: string): void {
    this.messageSubject.set(value);
  }

  onMessageBodyChange(value: string): void {
    this.messageBody.set(value);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) this.attachedFiles.update((list) => [...list, ...files]);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length) this.attachedFiles.update((list) => [...list, ...files]);
    input.value = '';
  }

  removeAttachedFile(index: number): void {
    this.attachedFiles.update((list) => list.filter((_, i) => i !== index));
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  sendMessage(): void {
    const guestId = this.guest()?.id?.trim();
    const subject = this.messageSubject().trim();
    const body = this.messageBody().trim();

    if (!guestId) {
      this.messageErrorMessage.set('No se pudo identificar al huésped para enviar el mensaje.');
      return;
    }

    if (!subject) {
      this.messageErrorMessage.set('El asunto del mensaje es obligatorio.');
      return;
    }

    if (!body) {
      this.messageErrorMessage.set('El cuerpo del mensaje es obligatorio.');
      return;
    }

    const payload: SendCrmGuestMessageRequest = {
      subject,
      body,
      templateId: this.messageTemplateId(),
      attachments: this.attachedFiles().map((f) => ({ name: f.name, type: f.type, url: '' })),
    };

    this.isSendingMessage.set(true);
    this.messageErrorMessage.set(null);

    this.sendCrmGuestMessageUseCase.execute(guestId, payload).subscribe({
      next: () => {
        this.isSendingMessage.set(false);
        this.messageSentSuccess.set(true);
        this.resetMessageForm(true);
      },
      error: () => {
        this.isSendingMessage.set(false);
        this.messageErrorMessage.set('No se pudo enviar el mensaje. Inténtalo de nuevo.');
      },
    });
  }

  saveNote(): void {
    const guestId = this.guest()?.id?.trim();
    const content = this.noteContent().trim();

    if (!guestId) {
      this.noteErrorMessage.set('No se pudo identificar al huésped para guardar la nota.');
      return;
    }

    if (!content) {
      this.noteErrorMessage.set('Escribe una nota antes de guardarla.');
      return;
    }

    if (content.length > NOTE_MAX_LENGTH) {
      this.noteErrorMessage.set('La nota no puede superar los 280 caracteres.');
      return;
    }

    const payload: CreateCrmGuestNoteRequest = {
      note: content,
      type: this.noteCategory(),
      status: 'not_pinned',
    };

    this.isSavingNote.set(true);
    this.noteErrorMessage.set(null);

    this.createCrmGuestNoteUseCase.execute(guestId, payload).subscribe({
      next: () => {
        this.isSavingNote.set(false);
        this.resetNoteForm();
        this.loadNotes(guestId, true);
      },
      error: () => {
        this.isSavingNote.set(false);
        this.noteErrorMessage.set('No se pudo guardar la nota. Inténtalo de nuevo.');
      },
    });
  }

  toggleNotePin(note: CrmGuestNote): void {
    const guestId = this.guest()?.id?.trim();
    if (!guestId || !note.id) return;

    const previousStatus = note.status;
    const newStatus: CrmGuestNote['status'] = previousStatus === 'pinned' ? 'not_pinned' : 'pinned';

    this.notes.update((notes) =>
      notes.map((n) => (n.id === note.id ? { ...n, status: newStatus } : n)),
    );

    this.pinCrmGuestNoteUseCase.execute(guestId, note.id).subscribe({
      error: () => {
        this.notes.update((notes) =>
          notes.map((n) => (n.id === note.id ? { ...n, status: previousStatus } : n)),
        );
      },
    });
  }

  openEditNoteModal(note: CrmGuestNote): void {
    this.editingNote.set(note);
    this.editNoteContent.set(note.note);
    this.editNoteCategory.set(note.type);
    this.editNoteErrorMessage.set(null);
    this.isEditNoteModalOpen.set(true);
  }

  cancelEditNote(): void {
    this.isEditNoteModalOpen.set(false);
    this.editingNote.set(null);
    this.editNoteContent.set('');
    this.editNoteErrorMessage.set(null);
  }

  onEditNoteContentChange(value: string): void {
    this.editNoteContent.set(value.slice(0, NOTE_MAX_LENGTH));
  }

  setEditNoteCategory(value: SelectValue): void {
    if (!isNoteCategory(value)) return;
    this.editNoteCategory.set(value);
  }

  saveEditedNote(): void {
    const guestId = this.guest()?.id?.trim();
    const note = this.editingNote();
    const content = this.editNoteContent().trim();

    if (!guestId || !note) return;

    if (!content) {
      this.editNoteErrorMessage.set('Escribe una nota antes de guardarla.');
      return;
    }

    if (content.length > NOTE_MAX_LENGTH) {
      this.editNoteErrorMessage.set('La nota no puede superar los 280 caracteres.');
      return;
    }

    const payload: UpdateCrmGuestNoteRequest = { note: content, type: this.editNoteCategory() };

    this.isUpdatingNote.set(true);
    this.editNoteErrorMessage.set(null);

    this.updateCrmGuestNoteUseCase.execute(guestId, note.id, payload).subscribe({
      next: () => {
        this.isUpdatingNote.set(false);
        this.cancelEditNote();
        this.loadNotes(guestId, true);
      },
      error: () => {
        this.isUpdatingNote.set(false);
        this.editNoteErrorMessage.set('No se pudo actualizar la nota. Inténtalo de nuevo.');
      },
    });
  }

  openDeleteNoteModal(note: CrmGuestNote): void {
    this.deletingNote.set(note);
    this.deleteNoteErrorMessage.set(null);
    this.isDeleteNoteModalOpen.set(true);
  }

  cancelDeleteNote(): void {
    this.isDeleteNoteModalOpen.set(false);
    this.deletingNote.set(null);
    this.deleteNoteErrorMessage.set(null);
  }

  confirmDeleteNote(): void {
    const guestId = this.guest()?.id?.trim();
    const note = this.deletingNote();
    if (!guestId || !note) return;

    this.isDeletingNote.set(true);
    this.deleteNoteErrorMessage.set(null);

    this.deleteCrmGuestNoteUseCase.execute(guestId, note.id).subscribe({
      next: () => {
        this.isDeletingNote.set(false);
        this.cancelDeleteNote();
        this.loadNotes(guestId, true);
      },
      error: () => {
        this.isDeletingNote.set(false);
        this.deleteNoteErrorMessage.set('No se pudo eliminar la nota. Inténtalo de nuevo.');
      },
    });
  }

  truncateNotePreview(text: string): string {
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  }

  getBookingStatusLabel(status: CrmGuestBooking['status']): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada';
      case 'CHECKED_IN':
        return 'Check-in';
      case 'CHECKED_OUT':
        return 'Check-out';
      case 'CANCELLED':
        return 'Cancelada';
      case 'NO_SHOW':
        return 'No se presentó';
      default:
        return 'Pendiente';
    }
  }

  getBookingStatusTone(status: CrmGuestBooking['status']): BookingStatusTone {
    switch (status) {
      case 'CONFIRMED':
        return 'info';
      case 'CHECKED_IN':
      case 'CHECKED_OUT':
        return 'success';
      case 'NO_SHOW':
        return 'muted';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'warning';
    }
  }

  getSourceLabel(source: CrmGuestBookingSource): string {
    switch (source) {
      case 'AIRBNB':
        return 'Airbnb';
      case 'BOOKING':
        return 'Booking.com';
      case 'VRBO':
        return 'VRBO';
      case 'DIRECT':
        return 'Directo';
      case 'MANUAL':
        return 'Manual';
      default:
        return source;
    }
  }

  getNoteCategoryLabel(category: CrmGuestNoteCategory): string {
    switch (category) {
      case 'preference':
        return 'Preferencias';
      case 'behavior':
        return 'Comportamiento';
      case 'incident':
        return 'Incidente';
      default:
        return 'General';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDateLabel(value: string, withTime = false): string {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    })
      .format(date)
      .replace('.', '');
  }

  formatPhone(phone: string): string {
    if (!phone.startsWith('+') || phone.includes(' ')) return phone;
    const digits = phone.slice(1);
    if (digits.length <= 10) return phone;
    const countryCode = digits.slice(0, digits.length - 10);
    const localNumber = digits.slice(-10);
    return `+${countryCode} ${localNumber}`;
  }

  toggleEmailsExpanded(): void {
    this.isEmailsExpanded.update((v) => !v);
  }

  getEmailStatusLabel(status: string): string {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'failed':
        return 'Fallido';
      default:
        return 'Pendiente';
    }
  }

  getNoteIdentifier(note: CrmGuestNote): string {
    return note.id || `${note.createdAt}-${note.note}`;
  }

  private loadGuest(guestId: string): void {
    this.isGuestLoading.set(true);
    this.guestErrorMessage.set(null);
    this.notFoundError.set(false);

    this.getCrmGuestsUseCase.execute().subscribe({
      next: (guests) => {
        const found = guests.find((g) => g.id === guestId) ?? null;
        if (!found) {
          this.notFoundError.set(true);
          this.isGuestLoading.set(false);
          return;
        }
        this.guest.set(found);
        this.isGuestLoading.set(false);
        this.loadBookings(guestId);
        this.loadNotes(guestId);
        this.loadEmails(guestId);
      },
      error: (error: HttpErrorResponse) => {
        this.isGuestLoading.set(false);
        if (error.status === 401) {
          this.guestErrorMessage.set('Tu sesión expiró. Inicia sesión nuevamente.');
        } else if (error.status === 403) {
          this.guestErrorMessage.set('No tienes permisos para ver este huésped.');
        } else {
          this.guestErrorMessage.set('No se pudo cargar el perfil del huésped. Inténtalo de nuevo.');
        }
      },
    });
  }

  private loadBookings(guestId: string): void {
    this.isBookingsLoading.set(true);
    this.bookingsErrorMessage.set(null);

    this.getCrmGuestBookingsUseCase.execute(guestId).subscribe({
      next: (bookings) => {
        this.enrichBookingsWithNames(bookings, guestId);
      },
      error: (error: HttpErrorResponse) => {
        this.bookings.set([]);
        this.isBookingsLoading.set(false);
        if (error.status === 404) {
          this.bookingsErrorMessage.set('No se encontraron reservas para este huésped.');
        } else {
          this.bookingsErrorMessage.set(
            'No se pudo cargar el historial de reservas. Inténtalo de nuevo.',
          );
        }
      },
    });
  }

  private loadEmails(guestId: string): void {
    this.isEmailsLoading.set(true);
    this.emailsErrorMessage.set(null);

    this.getCrmGuestEmailsUseCase.execute(guestId).subscribe({
      next: (emails) => {
        this.emails.set(
          [...emails].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
        this.isEmailsLoading.set(false);
      },
      error: () => {
        this.emails.set([]);
        this.isEmailsLoading.set(false);
        this.emailsErrorMessage.set('No se pudo cargar el historial de comunicaciones.');
      },
    });
  }

  private loadNotes(guestId: string, forceRefresh = false): void {
    if (!forceRefresh && this.notes().length > 0) return;

    this.isNotesLoading.set(true);

    this.getCrmGuestNotesUseCase.execute(guestId).subscribe({
      next: (notes) => {
        this.notes.set(
          [...notes].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
        this.isNotesLoading.set(false);
      },
      error: () => {
        this.notes.set([]);
        this.isNotesLoading.set(false);
      },
    });
  }

  private enrichBookingsWithNames(bookings: CrmGuestBooking[], requestedGuestId: string): void {
    const missingPropertyNames = bookings.some(
      (b) =>
        b.propertyId && !b.propertyName && !this.propertyNamesById()[b.propertyId],
    );
    const propertyIdsForUnits = [
      ...new Set(
        bookings
          .filter(
            (b) =>
              b.propertyId &&
              b.unitId &&
              !b.unitName &&
              !this.unitNamesById()[b.unitId] &&
              !this.loadedUnitPropertyIds().includes(b.propertyId),
          )
          .map((b) => b.propertyId),
      ),
    ];

    const propertyNames$ = missingPropertyNames
      ? this.getPropertiesUseCase.execute().pipe(
          map((props) => this.toPropertyNameMap(props)),
          catchError(() => of({} as Record<string, string>)),
        )
      : of({} as Record<string, string>);

    const unitNames$ = propertyIdsForUnits.length
      ? forkJoin(
          propertyIdsForUnits.map((propertyId) =>
            this.getUnitsUseCase.execute(propertyId).pipe(
              map((units) => ({ propertyId, units })),
              catchError(() => of({ propertyId, units: [] as Unit[] })),
            ),
          ),
        )
      : of([] as Array<{ propertyId: string; units: Unit[] }>);

    forkJoin({ propertyNames: propertyNames$, unitsByProperty: unitNames$ }).subscribe(
      ({ propertyNames, unitsByProperty }) => {
        if (this.guest()?.id !== requestedGuestId) return;

        const mergedPropertyNames = { ...this.propertyNamesById(), ...propertyNames };
        const mergedUnitNames = {
          ...this.unitNamesById(),
          ...this.toUnitNameMap(unitsByProperty),
        };

        this.propertyNamesById.set(mergedPropertyNames);
        this.unitNamesById.set(mergedUnitNames);
        this.loadedUnitPropertyIds.set([
          ...new Set([
            ...this.loadedUnitPropertyIds(),
            ...unitsByProperty.map(({ propertyId }) => propertyId),
          ]),
        ]);
        this.bookings.set(
          bookings.map((b) => ({
            ...b,
            propertyName: b.propertyName || mergedPropertyNames[b.propertyId] || '',
            unitName: b.unitName || mergedUnitNames[b.unitId] || '',
          })),
        );
        this.isBookingsLoading.set(false);
      },
    );
  }

  private toPropertyNameMap(properties: PropertyLookupItem[]): Record<string, string> {
    return properties.reduce<Record<string, string>>((acc, property) => {
      const id = property.id || property._id || property.propertyId || '';
      const name = property.name || property.title || '';
      if (id && name) acc[id] = name;
      return acc;
    }, {});
  }

  private toUnitNameMap(
    unitsByProperty: Array<{ propertyId: string; units: UnitLookupItem[] }>,
  ): Record<string, string> {
    return unitsByProperty.reduce<Record<string, string>>((acc, { units }) => {
      for (const unit of units) {
        const id = unit.id || unit._id || unit.unitId || '';
        const name = unit.name || unit.unitName || unit.title || '';
        if (id && name) acc[id] = name;
      }
      return acc;
    }, {});
  }

  private seasonOf(dateStr: string): string {
    const month = new Date(dateStr).getMonth();
    if (month >= 2 && month <= 4) return 'Primavera';
    if (month >= 5 && month <= 7) return 'Verano';
    if (month >= 8 && month <= 10) return 'Otoño';
    return 'Invierno';
  }

  private resetMessageForm(keepSuccess = false): void {
    this.isMessageFormVisible.set(false);
    this.isSendingMessage.set(false);
    this.messageSubject.set('');
    this.messageBody.set('');
    this.messageTemplateId.set('guest-message');
    this.attachedFiles.set([]);
    this.isDragOver.set(false);
    this.messageErrorMessage.set(null);
    if (!keepSuccess) this.messageSentSuccess.set(false);
  }

  private resetNoteForm(): void {
    this.isNoteFormVisible.set(false);
    this.isSavingNote.set(false);
    this.noteCategory.set('general');
    this.noteContent.set('');
    this.noteErrorMessage.set(null);
  }
}
