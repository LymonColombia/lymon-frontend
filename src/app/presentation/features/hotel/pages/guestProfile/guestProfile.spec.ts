import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { GuestProfileComponent } from './guestProfile';
import { GetCrmGuestsUseCase } from '@/domain/use-cases/crm/get-crm-guests.use-case';
import { GetCrmGuestBookingsUseCase } from '@/domain/use-cases/crm/get-crm-guest-bookings.use-case';
import { GetCrmGuestNotesUseCase } from '@/domain/use-cases/crm/get-crm-guest-notes.use-case';
import { GetCrmGuestEmailsUseCase } from '@/domain/use-cases/crm/get-crm-guest-emails.use-case';
import { CreateCrmGuestNoteUseCase } from '@/domain/use-cases/crm/create-crm-guest-note.use-case';
import { UpdateCrmGuestNoteUseCase } from '@/domain/use-cases/crm/update-crm-guest-note.use-case';
import { DeleteCrmGuestNoteUseCase } from '@/domain/use-cases/crm/delete-crm-guest-note.use-case';
import { PinCrmGuestNoteUseCase } from '@/domain/use-cases/crm/pin-crm-guest-note.use-case';
import { SendCrmGuestMessageUseCase } from '@/domain/use-cases/crm/send-crm-guest-message.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { CrmGuest, CrmGuestBooking, CrmGuestNote } from '@/domain/entities/crm-guest.model';

const mockGetCrmGuests = { execute: vi.fn() };
const mockGetCrmGuestBookings = { execute: vi.fn() };
const mockGetCrmGuestNotes = { execute: vi.fn() };
const mockGetCrmGuestEmails = { execute: vi.fn() };
const mockCreateCrmGuestNote = { execute: vi.fn() };
const mockUpdateCrmGuestNote = { execute: vi.fn() };
const mockDeleteCrmGuestNote = { execute: vi.fn() };
const mockPinCrmGuestNote = { execute: vi.fn() };
const mockSendCrmGuestMessage = { execute: vi.fn() };
const mockGetProperties = { execute: vi.fn() };
const mockGetUnits = { execute: vi.fn() };

const MOCK_GUEST: CrmGuest = {
  id: 'guest-1',
  name: 'Maria Gonzalez',
  email: 'maria@example.com',
  phone: '+521234567890',
  status: 'active',
  tags: ['vip', 'frecuente'],
};

const MOCK_BOOKING: CrmGuestBooking = {
  id: 'booking-1',
  propertyId: 'prop-1',
  propertyName: 'Hotel Central',
  unitId: 'unit-1',
  unitName: 'Suite 101',
  checkIn: '2025-06-01T00:00:00.000Z',
  checkOut: '2025-06-05T00:00:00.000Z',
  totalAmount: 800,
  status: 'CONFIRMED',
  source: 'DIRECT',
  createdAt: '2025-05-01T00:00:00.000Z',
};

const MOCK_NOTE: CrmGuestNote = {
  id: 'note-1',
  note: 'Prefiere habitación alta',
  type: 'preference',
  status: 'not_pinned',
  createdAt: '2025-01-10T00:00:00.000Z',
  createdByName: 'Admin',
};

function setupDefaultMocks(): void {
  vi.clearAllMocks();
  TestBed.resetTestingModule();
  mockGetCrmGuests.execute.mockReturnValue(of([MOCK_GUEST]));
  mockGetCrmGuestBookings.execute.mockReturnValue(of([]));
  mockGetCrmGuestNotes.execute.mockReturnValue(of([]));
  mockGetCrmGuestEmails.execute.mockReturnValue(of([]));
  mockDeleteCrmGuestNote.execute.mockReturnValue(of({}));
  mockPinCrmGuestNote.execute.mockReturnValue(of({}));
  mockGetProperties.execute.mockReturnValue(of([]));
  mockGetUnits.execute.mockReturnValue(of([]));
}

function makeActivatedRoute(guestId: string | null) {
  return {
    snapshot: {
      paramMap: convertToParamMap(guestId ? { guestId } : {}),
    },
  };
}

async function setup(guestId: string | null = 'guest-1') {
  await TestBed.configureTestingModule({
    imports: [GuestProfileComponent],
    providers: [
      { provide: ActivatedRoute, useValue: makeActivatedRoute(guestId) },
      { provide: GetCrmGuestsUseCase, useValue: mockGetCrmGuests },
      { provide: GetCrmGuestBookingsUseCase, useValue: mockGetCrmGuestBookings },
      { provide: GetCrmGuestNotesUseCase, useValue: mockGetCrmGuestNotes },
      { provide: GetCrmGuestEmailsUseCase, useValue: mockGetCrmGuestEmails },
      { provide: CreateCrmGuestNoteUseCase, useValue: mockCreateCrmGuestNote },
      { provide: UpdateCrmGuestNoteUseCase, useValue: mockUpdateCrmGuestNote },
      { provide: DeleteCrmGuestNoteUseCase, useValue: mockDeleteCrmGuestNote },
      { provide: PinCrmGuestNoteUseCase, useValue: mockPinCrmGuestNote },
      { provide: SendCrmGuestMessageUseCase, useValue: mockSendCrmGuestMessage },
      { provide: GetPropertiesUseCase, useValue: mockGetProperties },
      { provide: GetUnitsUseCase, useValue: mockGetUnits },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(GuestProfileComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(GuestProfileComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  return { fixture, component };
}

// ─── Sin guestId en la ruta ───────────────────────────────────────────────────
describe('GuestProfileComponent – sin guestId en la ruta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('establece notFoundError en true', async () => {
    const { component } = await setup(null);
    expect(component.notFoundError()).toBe(true);
  });

  it('isGuestLoading se establece en false', async () => {
    const { component } = await setup(null);
    expect(component.isGuestLoading()).toBe(false);
  });
});

// ─── Carga inicial exitosa ────────────────────────────────────────────────────
describe('GuestProfileComponent – carga inicial exitosa', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestBookings.execute.mockReturnValue(of([MOCK_BOOKING]));
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
  });

  it('carga el huésped correctamente', async () => {
    const { component } = await setup();
    expect(component.guest()?.id).toBe('guest-1');
    expect(component.guest()?.name).toBe('Maria Gonzalez');
  });

  it('isGuestLoading se establece en false', async () => {
    const { component } = await setup();
    expect(component.isGuestLoading()).toBe(false);
  });

  it('no hay mensaje de error', async () => {
    const { component } = await setup();
    expect(component.guestErrorMessage()).toBeNull();
  });

  it('no hay notFoundError', async () => {
    const { component } = await setup();
    expect(component.notFoundError()).toBe(false);
  });

  it('carga las reservas del huésped', async () => {
    const { component } = await setup();
    expect(component.bookings().length).toBe(1);
  });

  it('carga las notas del huésped', async () => {
    const { component } = await setup();
    expect(component.notes().length).toBe(1);
  });
});

// ─── Carga en curso ───────────────────────────────────────────────────────────
describe('GuestProfileComponent – carga en curso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('isGuestLoading es true mientras el observable no emite', async () => {
    const pending = new Subject<CrmGuest[]>();
    mockGetCrmGuests.execute.mockReturnValue(pending.asObservable());
    const { component } = await setup();
    expect(component.isGuestLoading()).toBe(true);
  });
});

// ─── Huésped no encontrado ────────────────────────────────────────────────────
describe('GuestProfileComponent – huésped no encontrado en la lista', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetCrmGuests.execute.mockReturnValue(of([]));
  });

  it('establece notFoundError en true', async () => {
    const { component } = await setup();
    expect(component.notFoundError()).toBe(true);
  });

  it('isGuestLoading se establece en false', async () => {
    const { component } = await setup();
    expect(component.isGuestLoading()).toBe(false);
  });
});

// ─── Error 401 ────────────────────────────────────────────────────────────────
describe('GuestProfileComponent – error 401 (sesión expirada)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetCrmGuests.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );
  });

  it('muestra mensaje de sesión expirada', async () => {
    const { component } = await setup();
    expect(component.guestErrorMessage()).toBe('Tu sesión expiró. Inicia sesión nuevamente.');
  });

  it('isGuestLoading se establece en false', async () => {
    const { component } = await setup();
    expect(component.isGuestLoading()).toBe(false);
  });
});

// ─── Error 403 ────────────────────────────────────────────────────────────────
describe('GuestProfileComponent – error 403 (acceso denegado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetCrmGuests.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 })),
    );
  });

  it('muestra mensaje de acceso denegado', async () => {
    const { component } = await setup();
    expect(component.guestErrorMessage()).toBe('No tienes permisos para ver este huésped.');
  });
});

// ─── Error inesperado ─────────────────────────────────────────────────────────
describe('GuestProfileComponent – error inesperado al cargar huésped', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetCrmGuests.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
  });

  it('muestra mensaje de error genérico', async () => {
    const { component } = await setup();
    expect(component.guestErrorMessage()).toBe(
      'No se pudo cargar el perfil del huésped. Inténtalo de nuevo.',
    );
  });
});

// ─── Señales computadas ───────────────────────────────────────────────────────
describe('GuestProfileComponent – señales computadas', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestBookings.execute.mockReturnValue(of([MOCK_BOOKING]));
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
  });

  it('guestInitials extrae las iniciales del nombre', async () => {
    const { component } = await setup();
    expect(component.guestInitials()).toBe('MG');
  });

  it('guestTags filtra etiquetas vacías', async () => {
    const { component } = await setup();
    expect(component.guestTags()).toEqual(['vip', 'frecuente']);
  });

  it('totalBookings refleja el número de reservas', async () => {
    const { component } = await setup();
    expect(component.totalBookings()).toBe(1);
  });

  it('totalSpend suma los montos de las reservas', async () => {
    const { component } = await setup();
    expect(component.totalSpend()).toBe(800);
  });

  it('breadcrumbItems incluye el nombre del huésped', async () => {
    const { component } = await setup();
    const items = component.breadcrumbItems();
    expect(items[items.length - 1].label).toBe('Maria Gonzalez');
  });

  it('pinnedNotes solo contiene notas fijadas', async () => {
    const { component } = await setup();
    expect(component.pinnedNotes().length).toBe(0);
  });

  it('filteredNotes excluye notas fijadas', async () => {
    const { component } = await setup();
    expect(component.filteredNotes().length).toBe(1);
  });
});

// ─── Filtro de notas ──────────────────────────────────────────────────────────
describe('GuestProfileComponent – filtro de notas', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(
      of([
        { ...MOCK_NOTE, id: 'n1', type: 'preference', status: 'not_pinned' },
        { ...MOCK_NOTE, id: 'n2', type: 'incident', status: 'not_pinned' },
      ]),
    );
  });

  it('setNoteFilter filtra por categoría correctamente', async () => {
    const { component } = await setup();
    component.setNoteFilter('incident');
    expect(component.filteredNotes().length).toBe(1);
    expect(component.filteredNotes()[0].type).toBe('incident');
  });

  it('setNoteFilter con "all" muestra todas las notas no fijadas', async () => {
    const { component } = await setup();
    component.setNoteFilter('all');
    expect(component.filteredNotes().length).toBe(2);
  });
});

// ─── Formulario de notas ──────────────────────────────────────────────────────
describe('GuestProfileComponent – formulario de notas', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it('openNoteForm hace visible el formulario', async () => {
    const { component } = await setup();
    component.openNoteForm();
    expect(component.isNoteFormVisible()).toBe(true);
  });

  it('cancelNoteForm oculta el formulario y limpia el contenido', async () => {
    const { component } = await setup();
    component.openNoteForm();
    component.onNoteContentChange('texto de prueba');
    component.cancelNoteForm();
    expect(component.isNoteFormVisible()).toBe(false);
    expect(component.noteContent()).toBe('');
  });

  it('saveNote no llama al use case si el contenido está vacío', async () => {
    const { component } = await setup();
    component.openNoteForm();
    component.saveNote();
    expect(mockCreateCrmGuestNote.execute).not.toHaveBeenCalled();
    expect(component.noteErrorMessage()).toBe('Escribe una nota antes de guardarla.');
  });

  it('saveNote guarda la nota y recarga las notas', async () => {
    mockCreateCrmGuestNote.execute.mockReturnValue(of({}));
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
    const { component } = await setup();
    component.openNoteForm();
    component.onNoteContentChange('Nueva nota de prueba');
    component.saveNote();
    expect(mockCreateCrmGuestNote.execute).toHaveBeenCalledWith('guest-1', {
      note: 'Nueva nota de prueba',
      type: 'general',
      status: 'not_pinned',
    });
    expect(component.isNoteFormVisible()).toBe(false);
  });

  it('saveNote muestra error si el use case falla', async () => {
    mockCreateCrmGuestNote.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup();
    component.openNoteForm();
    component.onNoteContentChange('Nota con error');
    component.saveNote();
    expect(component.noteErrorMessage()).toBe('No se pudo guardar la nota. Inténtalo de nuevo.');
    expect(component.isSavingNote()).toBe(false);
  });

  it('onNoteContentChange trunca el texto a 280 caracteres', async () => {
    const { component } = await setup();
    component.onNoteContentChange('a'.repeat(300));
    expect(component.noteContent().length).toBe(280);
  });
});

// ─── Pin de notas ─────────────────────────────────────────────────────────────
describe('GuestProfileComponent – pin de notas', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
  });

  it('toggleNotePin cambia el estado de la nota a pinned', async () => {
    const { component } = await setup();
    component.toggleNotePin(MOCK_NOTE);
    expect(component.notes()[0].status).toBe('pinned');
  });

  it('toggleNotePin vuelve a not_pinned si ya estaba fijada', async () => {
    const { component } = await setup();
    component.toggleNotePin(MOCK_NOTE);
    const pinnedNote = component.notes()[0];
    component.toggleNotePin(pinnedNote);
    expect(component.notes()[0].status).toBe('not_pinned');
  });

  it('toggleNotePin llama al use case con los argumentos correctos', async () => {
    const { component } = await setup();
    component.toggleNotePin(MOCK_NOTE);
    expect(mockPinCrmGuestNote.execute).toHaveBeenCalledWith('guest-1', 'note-1');
  });

  it('toggleNotePin revierte el estado si la API falla', async () => {
    mockPinCrmGuestNote.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup();
    component.toggleNotePin(MOCK_NOTE);
    expect(component.notes()[0].status).toBe('not_pinned');
  });

  it('toggleNotePin no llama a la API si la nota no tiene id', async () => {
    const { component } = await setup();
    component.toggleNotePin({ ...MOCK_NOTE, id: '' });
    expect(mockPinCrmGuestNote.execute).not.toHaveBeenCalled();
  });
});

// ─── Formulario de mensaje – apertura y cierre ────────────────────────────────
describe('GuestProfileComponent – formulario de mensaje – apertura y cierre', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it('openMessageForm hace visible el formulario', async () => {
    const { component } = await setup();
    component.openMessageForm();
    expect(component.isMessageFormVisible()).toBe(true);
  });

  it('openMessageForm limpia el error previo', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('');
    component.sendMessage();
    component.openMessageForm();
    expect(component.messageErrorMessage()).toBeNull();
  });

  it('openMessageForm limpia el mensaje de éxito previo', async () => {
    mockSendCrmGuestMessage.execute.mockReturnValue(of({}));
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto');
    component.onMessageBodyChange('Cuerpo');
    component.sendMessage();
    component.openMessageForm();
    expect(component.messageSentSuccess()).toBe(false);
  });

  it('cancelMessageForm oculta el formulario', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.cancelMessageForm();
    expect(component.isMessageFormVisible()).toBe(false);
  });

  it('cancelMessageForm limpia asunto y cuerpo', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto de prueba');
    component.onMessageBodyChange('Cuerpo de prueba');
    component.cancelMessageForm();
    expect(component.messageSubject()).toBe('');
    expect(component.messageBody()).toBe('');
  });
});

// ─── Formulario de mensaje – validaciones ────────────────────────────────────
describe('GuestProfileComponent – formulario de mensaje – validaciones', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it('sendMessage no llama al use case si el asunto está vacío', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageBodyChange('Cuerpo de prueba');
    component.sendMessage();
    expect(mockSendCrmGuestMessage.execute).not.toHaveBeenCalled();
    expect(component.messageErrorMessage()).toBe('El asunto del mensaje es obligatorio.');
  });

  it('sendMessage no llama al use case si el cuerpo está vacío', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto de prueba');
    component.sendMessage();
    expect(mockSendCrmGuestMessage.execute).not.toHaveBeenCalled();
    expect(component.messageErrorMessage()).toBe('El cuerpo del mensaje es obligatorio.');
  });

  it('setMessageTemplateId ignora valores inválidos', async () => {
    const { component } = await setup();
    component.setMessageTemplateId('invalido');
    expect(component.messageTemplateId()).toBe('guest-message');
  });

  it('setMessageTemplateId acepta GUEST_WELCOME', async () => {
    const { component } = await setup();
    component.setMessageTemplateId('GUEST_WELCOME');
    expect(component.messageTemplateId()).toBe('GUEST_WELCOME');
  });
});

// ─── Formulario de mensaje – envío exitoso ────────────────────────────────────
describe('GuestProfileComponent – formulario de mensaje – envío exitoso', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockSendCrmGuestMessage.execute.mockReturnValue(of({}));
  });

  it('sendMessage llama al use case con el payload correcto', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Bienvenida');
    component.onMessageBodyChange('Hola, gracias por tu reserva.');
    component.sendMessage();
    expect(mockSendCrmGuestMessage.execute).toHaveBeenCalledWith('guest-1', {
      subject: 'Bienvenida',
      body: 'Hola, gracias por tu reserva.',
      templateId: 'guest-message',
      attachments: [],
    });
  });

  it('messageSentSuccess se establece en true tras envío exitoso', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto');
    component.onMessageBodyChange('Cuerpo');
    component.sendMessage();
    expect(component.messageSentSuccess()).toBe(true);
  });

  it('el formulario se oculta tras envío exitoso', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto');
    component.onMessageBodyChange('Cuerpo');
    component.sendMessage();
    expect(component.isMessageFormVisible()).toBe(false);
  });

  it('isSendingMessage vuelve a false tras envío exitoso', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto');
    component.onMessageBodyChange('Cuerpo');
    component.sendMessage();
    expect(component.isSendingMessage()).toBe(false);
  });
});

// ─── Formulario de mensaje – error al enviar ──────────────────────────────────
describe('GuestProfileComponent – formulario de mensaje – error al enviar', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockSendCrmGuestMessage.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
  });

  it('muestra mensaje de error si el use case falla', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto');
    component.onMessageBodyChange('Cuerpo');
    component.sendMessage();
    expect(component.messageErrorMessage()).toBe(
      'No se pudo enviar el mensaje. Inténtalo de nuevo.',
    );
  });

  it('isSendingMessage vuelve a false tras el error', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto');
    component.onMessageBodyChange('Cuerpo');
    component.sendMessage();
    expect(component.isSendingMessage()).toBe(false);
  });

  it('el formulario permanece visible tras el error', async () => {
    const { component } = await setup();
    component.openMessageForm();
    component.onMessageSubjectChange('Asunto');
    component.onMessageBodyChange('Cuerpo');
    component.sendMessage();
    expect(component.isMessageFormVisible()).toBe(true);
  });
});

// ─── Modal de edición de nota – apertura y cierre ────────────────────────────
describe('GuestProfileComponent – modal de edición de nota – apertura y cierre', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
  });

  it('openEditNoteModal abre el modal', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    expect(component.isEditNoteModalOpen()).toBe(true);
  });

  it('openEditNoteModal pre-rellena el contenido de la nota', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    expect(component.editNoteContent()).toBe(MOCK_NOTE.note);
  });

  it('openEditNoteModal pre-rellena la categoría de la nota', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    expect(component.editNoteCategory()).toBe(MOCK_NOTE.type);
  });

  it('openEditNoteModal limpia el error previo', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('');
    component.saveEditedNote();
    component.openEditNoteModal(MOCK_NOTE);
    expect(component.editNoteErrorMessage()).toBeNull();
  });

  it('cancelEditNote cierra el modal', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.cancelEditNote();
    expect(component.isEditNoteModalOpen()).toBe(false);
  });

  it('cancelEditNote limpia el contenido y la nota en edición', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.cancelEditNote();
    expect(component.editNoteContent()).toBe('');
    expect(component.editingNote()).toBeNull();
  });
});

// ─── Modal de edición de nota – validaciones ─────────────────────────────────
describe('GuestProfileComponent – modal de edición de nota – validaciones', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
  });

  it('saveEditedNote no llama al use case si el contenido está vacío', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('');
    component.saveEditedNote();
    expect(mockUpdateCrmGuestNote.execute).not.toHaveBeenCalled();
    expect(component.editNoteErrorMessage()).toBe('Escribe una nota antes de guardarla.');
  });

  it('onEditNoteContentChange trunca el texto a 280 caracteres', async () => {
    const { component } = await setup();
    component.onEditNoteContentChange('a'.repeat(300));
    expect(component.editNoteContent().length).toBe(280);
  });

  it('editNoteCharCount refleja la longitud actual del contenido', async () => {
    const { component } = await setup();
    component.onEditNoteContentChange('Hola');
    expect(component.editNoteCharCount()).toBe(4);
  });

  it('setEditNoteCategory ignora valores inválidos', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.setEditNoteCategory('invalido');
    expect(component.editNoteCategory()).toBe(MOCK_NOTE.type);
  });

  it('setEditNoteCategory acepta valores válidos', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.setEditNoteCategory('incident');
    expect(component.editNoteCategory()).toBe('incident');
  });
});

// ─── Modal de edición de nota – guardado exitoso ──────────────────────────────
describe('GuestProfileComponent – modal de edición de nota – guardado exitoso', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
    mockUpdateCrmGuestNote.execute.mockReturnValue(of({}));
  });

  it('saveEditedNote llama al use case con el payload correcto', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('Nota editada');
    component.setEditNoteCategory('behavior');
    component.saveEditedNote();
    expect(mockUpdateCrmGuestNote.execute).toHaveBeenCalledWith('guest-1', 'note-1', {
      note: 'Nota editada',
      type: 'behavior',
    });
  });

  it('saveEditedNote cierra el modal tras el éxito', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('Nota editada');
    component.saveEditedNote();
    expect(component.isEditNoteModalOpen()).toBe(false);
  });

  it('isUpdatingNote vuelve a false tras el éxito', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('Nota editada');
    component.saveEditedNote();
    expect(component.isUpdatingNote()).toBe(false);
  });
});

// ─── Modal de edición de nota – error al guardar ──────────────────────────────
describe('GuestProfileComponent – modal de edición de nota – error al guardar', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
    mockUpdateCrmGuestNote.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
  });

  it('muestra mensaje de error si el use case falla', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('Nota con error');
    component.saveEditedNote();
    expect(component.editNoteErrorMessage()).toBe(
      'No se pudo actualizar la nota. Inténtalo de nuevo.',
    );
  });

  it('isUpdatingNote vuelve a false tras el error', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('Nota con error');
    component.saveEditedNote();
    expect(component.isUpdatingNote()).toBe(false);
  });

  it('el modal permanece abierto tras el error', async () => {
    const { component } = await setup();
    component.openEditNoteModal(MOCK_NOTE);
    component.onEditNoteContentChange('Nota con error');
    component.saveEditedNote();
    expect(component.isEditNoteModalOpen()).toBe(true);
  });
});

// ─── Modal de eliminación de nota – apertura y cierre ────────────────────────
describe('GuestProfileComponent – modal de eliminación de nota – apertura y cierre', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
  });

  it('openDeleteNoteModal abre el modal', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    expect(component.isDeleteNoteModalOpen()).toBe(true);
  });

  it('openDeleteNoteModal establece la nota a eliminar', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    expect(component.deletingNote()).toEqual(MOCK_NOTE);
  });

  it('openDeleteNoteModal limpia el error previo', async () => {
    mockDeleteCrmGuestNote.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    component.openDeleteNoteModal(MOCK_NOTE);
    expect(component.deleteNoteErrorMessage()).toBeNull();
  });

  it('cancelDeleteNote cierra el modal', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.cancelDeleteNote();
    expect(component.isDeleteNoteModalOpen()).toBe(false);
  });

  it('cancelDeleteNote limpia la nota en eliminación', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.cancelDeleteNote();
    expect(component.deletingNote()).toBeNull();
  });
});

// ─── Modal de eliminación de nota – eliminación exitosa ──────────────────────
describe('GuestProfileComponent – modal de eliminación de nota – eliminación exitosa', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
    mockDeleteCrmGuestNote.execute.mockReturnValue(of({}));
  });

  it('confirmDeleteNote llama al use case con los argumentos correctos', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    expect(mockDeleteCrmGuestNote.execute).toHaveBeenCalledWith('guest-1', 'note-1');
  });

  it('confirmDeleteNote cierra el modal tras el éxito', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    expect(component.isDeleteNoteModalOpen()).toBe(false);
  });

  it('isDeletingNote vuelve a false tras el éxito', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    expect(component.isDeletingNote()).toBe(false);
  });

  it('confirmDeleteNote limpia la nota en eliminación tras el éxito', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    expect(component.deletingNote()).toBeNull();
  });
});

// ─── Modal de eliminación de nota – error al eliminar ────────────────────────
describe('GuestProfileComponent – modal de eliminación de nota – error al eliminar', () => {
  beforeEach(() => {
    setupDefaultMocks();
    mockGetCrmGuestNotes.execute.mockReturnValue(of([MOCK_NOTE]));
    mockDeleteCrmGuestNote.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
  });

  it('muestra mensaje de error si el use case falla', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    expect(component.deleteNoteErrorMessage()).toBe(
      'No se pudo eliminar la nota. Inténtalo de nuevo.',
    );
  });

  it('isDeletingNote vuelve a false tras el error', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    expect(component.isDeletingNote()).toBe(false);
  });

  it('el modal permanece abierto tras el error', async () => {
    const { component } = await setup();
    component.openDeleteNoteModal(MOCK_NOTE);
    component.confirmDeleteNote();
    expect(component.isDeleteNoteModalOpen()).toBe(true);
  });
});
