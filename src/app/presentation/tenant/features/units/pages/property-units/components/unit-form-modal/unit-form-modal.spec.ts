import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { CreateUnitUseCase } from '@/domain/use-cases/property/create-unit.use-case';
import { UpdateUnitUseCase } from '@/domain/use-cases/property/update-unit.use-case';
import { UpdateUnitMediaKeysUseCase } from '@/domain/use-cases/property/update-unit-media-keys.use-case';
import { CreateImageStorageUseCase } from '@/domain/use-cases/image-storage/image-storage.use-case';
import { ROOM_MESSAGES } from '@/domain/constants/room.constants';
import { MediaItem } from '@/domain/entities/storage.model';
import { Unit } from '@/domain/entities/staff.model';
import { MediaGallerySelection } from '@/presentation/tenant/components/media-gallery-input/media-gallery-input';
import { UnitFormModalComponent } from './unit-form-modal';

// ─── Shared mocks ─────────────────────────────────────────────────────────────
const mockCreateUnit = { execute: vi.fn() };
const mockUpdateUnit = { execute: vi.fn() };
const mockUpdateUnitMediaKeys = { execute: vi.fn() };
const mockCreateImageStorage = { execute: vi.fn() };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeFile = (name = 'photo.jpg') => new File(['img-data'], name, { type: 'image/jpeg' });

const makeMediaItem = (key: string): MediaItem => ({
  key,
  url: `https://pub-abc.r2.dev/${key}`,
});

const UPLOAD_RESULT = (key: string) => ({
  key,
  fileUrl: `https://pub-abc.r2.dev/${key}`,
});

// ─── TestBed setup ────────────────────────────────────────────────────────────
async function setup(propertyId = 'p1') {
  await TestBed.configureTestingModule({
    imports: [UnitFormModalComponent],
    providers: [
      { provide: CreateUnitUseCase, useValue: mockCreateUnit },
      { provide: UpdateUnitUseCase, useValue: mockUpdateUnit },
      { provide: UpdateUnitMediaKeysUseCase, useValue: mockUpdateUnitMediaKeys },
      { provide: CreateImageStorageUseCase, useValue: mockCreateImageStorage },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(UnitFormModalComponent, {
      set: { template: '' },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(UnitFormModalComponent);
  fixture.componentRef.setInput('propertyId', propertyId);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance };
}

function fillValidForm(component: UnitFormModalComponent) {
  component.form.patchValue({
    name: 'Suite Deluxe',
    description: 'Habitación con vista al mar',
    inventoryCount: 3,
    maxGuests: 2,
    bathroomsCount: 1,
    pricePerNight: 150,
  });

  const bed = component.form.controls.beds.at(0);
  bed.patchValue({ type: 'QUEEN', count: 1 });
}

// ─── Existing behaviour (preserved) ──────────────────────────────────────────
describe('UnitFormModalComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    // Safe defaults so mocks never return undefined when accidentally called
    mockUpdateUnitMediaKeys.execute.mockReturnValue(of(null));
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('units/default.jpg')));
  });

  it('should not call use-case when form is invalid', async () => {
    const { component } = await setup();
    component.form.reset();

    component.onSubmit();

    expect(mockCreateUnit.execute).not.toHaveBeenCalled();
  });

  it('should mark all controls as touched when form is invalid', async () => {
    const { component } = await setup();
    component.form.reset();
    const markAllAsTouchedSpy = vi.spyOn(component.form, 'markAllAsTouched');

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
  });

  it('should emit cancelled on cancel', async () => {
    const { component } = await setup();
    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    component.onCancel();

    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should emit saved on successful submit', async () => {
    mockCreateUnit.execute.mockReturnValue(of(undefined));
    const { component } = await setup();
    const createdSpy = vi.fn();
    component.saved.subscribe(createdSpy);
    fillValidForm(component);

    component.onSubmit();

    expect(createdSpy).toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should keep isSubmitting true while request is pending', async () => {
    const pendingRequest = new Subject<void>();
    mockCreateUnit.execute.mockReturnValue(pendingRequest.asObservable());
    const { component } = await setup();
    fillValidForm(component);

    component.onSubmit();

    expect(component.isSubmitting()).toBe(true);
  });

  it('should expose server error message when submit fails', async () => {
    mockCreateUnit.execute.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Nombre duplicado' } })),
    );
    const { component } = await setup();
    fillValidForm(component);

    component.onSubmit();

    expect(component.errorMessage()).toBe('Nombre duplicado');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should expose generic error message when backend does not return one', async () => {
    mockCreateUnit.execute.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const { component } = await setup();
    fillValidForm(component);

    component.onSubmit();

    expect(component.errorMessage()).toBe(ROOM_MESSAGES.createErrorFallback);
  });

  it('should toggle amenities selection', async () => {
    const { component } = await setup();

    component.toggleAmenity('WiFi');
    expect(component.isAmenitySelected('WiFi')).toBe(true);

    component.toggleAmenity('WiFi');
    expect(component.isAmenitySelected('WiFi')).toBe(false);
  });
});

// ─── CREATE with media uploads ────────────────────────────────────────────────
describe('UnitFormModalComponent – CREATE with media uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUpdateUnitMediaKeys.execute.mockReturnValue(of(null));
  });

  it('should upload each gallery file with category "units"', async () => {
    const file1 = makeFile('room1.jpg');
    const file2 = makeFile('room2.jpg');

    mockCreateUnit.execute.mockReturnValue(of({ id: 'u-new' }));
    mockCreateImageStorage.execute
      .mockReturnValueOnce(of(UPLOAD_RESULT('units/room1.jpg')))
      .mockReturnValueOnce(of(UPLOAD_RESULT('units/room2.jpg')));

    const { component } = await setup();
    fillValidForm(component);
    component.gallerySelection.set({ kept: [], newFiles: [file1, file2] });

    component.onSubmit();

    expect(mockCreateImageStorage.execute).toHaveBeenCalledTimes(2);
    expect(mockCreateImageStorage.execute).toHaveBeenCalledWith({ file: file1, category: 'units' });
    expect(mockCreateImageStorage.execute).toHaveBeenCalledWith({ file: file2, category: 'units' });
  });

  it('should call updateUnitMediaKeysUseCase with uploaded keys after CREATE', async () => {
    mockCreateUnit.execute.mockReturnValue(of({ id: 'u-new' }));
    mockCreateImageStorage.execute
      .mockReturnValueOnce(of(UPLOAD_RESULT('units/g1.jpg')))
      .mockReturnValueOnce(of(UPLOAD_RESULT('units/g2.jpg')));

    const { component } = await setup();
    fillValidForm(component);
    component.gallerySelection.set({ kept: [], newFiles: [makeFile('g1.jpg'), makeFile('g2.jpg')] });

    component.onSubmit();

    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledOnce();
    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledWith('u-new', [
      'units/g1.jpg',
      'units/g2.jpg',
    ]);
  });

  it('should include kept media item keys before new keys in updateUnitMediaKeys call', async () => {
    mockCreateUnit.execute.mockReturnValue(of({ id: 'u-new' }));
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('units/uploaded.jpg')));

    const { component } = await setup();
    fillValidForm(component);

    const selection: MediaGallerySelection = {
      kept: [makeMediaItem('units/existing.jpg')],
      newFiles: [makeFile('uploaded.jpg')],
    };
    component.gallerySelection.set(selection);

    component.onSubmit();

    const [, mediaKeys] = mockUpdateUnitMediaKeys.execute.mock.calls[0];
    expect(mediaKeys).toEqual(['units/existing.jpg', 'units/uploaded.jpg']);
  });

  it('should NOT call updateUnitMediaKeysUseCase when no gallery files are selected on CREATE', async () => {
    // shouldSync = false: no new files means no media sync is needed
    mockCreateUnit.execute.mockReturnValue(of({ id: 'u-new' }));

    const { component } = await setup();
    fillValidForm(component);
    // Default gallerySelection has no newFiles and no kept items

    component.onSubmit();

    expect(mockUpdateUnitMediaKeys.execute).not.toHaveBeenCalled();
  });
});

// ─── CREATE – extractUnitId response shape variants ───────────────────────────
describe('UnitFormModalComponent – CREATE – extractUnitId response shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('units/img.jpg')));
    mockUpdateUnitMediaKeys.execute.mockReturnValue(of(null));
  });

  it('should extract unitId from flat { id } response shape', async () => {
    mockCreateUnit.execute.mockReturnValue(of({ id: 'unit-flat' }));

    const { component } = await setup();
    fillValidForm(component);
    component.gallerySelection.set({ kept: [], newFiles: [makeFile()] });

    component.onSubmit();

    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledWith('unit-flat', expect.any(Array));
  });

  it('should extract unitId from nested { data: { id } } response shape', async () => {
    mockCreateUnit.execute.mockReturnValue(of({ data: { id: 'unit-data' } }));

    const { component } = await setup();
    fillValidForm(component);
    component.gallerySelection.set({ kept: [], newFiles: [makeFile()] });

    component.onSubmit();

    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledWith('unit-data', expect.any(Array));
  });

  it('should extract unitId from deeply nested { data: { unit: { id } } } response shape', async () => {
    mockCreateUnit.execute.mockReturnValue(of({ data: { unit: { id: 'unit-deep' } } }));

    const { component } = await setup();
    fillValidForm(component);
    component.gallerySelection.set({ kept: [], newFiles: [makeFile()] });

    component.onSubmit();

    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledWith('unit-deep', expect.any(Array));
  });

  it('should extract unitId from { data: { unitId } } response shape', async () => {
    mockCreateUnit.execute.mockReturnValue(of({ message: 'Unit created successfully', data: { unitId: 'unit-actual' } }));

    const { component } = await setup();
    fillValidForm(component);
    component.gallerySelection.set({ kept: [], newFiles: [makeFile()] });

    component.onSubmit();

    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledWith('unit-actual', expect.any(Array));
  });
});

// ─── EDIT with media ──────────────────────────────────────────────────────────
describe('UnitFormModalComponent – EDIT with media', () => {
  const UNIT_TO_EDIT: Unit = {
    id: 'u-edit-1',
    name: 'Suite Deluxe',
    description: 'Habitación con vista al mar',
    inventoryCount: 2,
    maxGuests: 2,
    bathroomsCount: 1,
    pricePerNight: 200,
    bedrooms: [{ roomName: 'Suite Deluxe', beds: [{ type: 'QUEEN', count: 1 }] }],
    amenities: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockUpdateUnit.execute.mockReturnValue(of(undefined));
    mockUpdateUnitMediaKeys.execute.mockReturnValue(of(null));
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('units/default.jpg')));
  });

  async function setupEditMode() {
    const { fixture, component } = await setup();
    fixture.componentRef.setInput('unitToEdit', UNIT_TO_EDIT);
    fixture.detectChanges();
    return { fixture, component };
  }

  it('should always call updateUnitMediaKeysUseCase on EDIT, even with no new files', async () => {
    const { component } = await setupEditMode();
    fillValidForm(component);
    // gallerySelection defaults to { kept: [], newFiles: [] }

    component.onSubmit();

    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledOnce();
    expect(mockUpdateUnitMediaKeys.execute).toHaveBeenCalledWith('u-edit-1', []);
  });

  it('should pass the unitToEdit id to updateUnitMediaKeysUseCase on EDIT', async () => {
    const { component } = await setupEditMode();
    fillValidForm(component);

    component.onSubmit();

    const [unitId] = mockUpdateUnitMediaKeys.execute.mock.calls[0];
    expect(unitId).toBe('u-edit-1');
  });

  it('should include kept media item keys in the EDIT media sync', async () => {
    const { component } = await setupEditMode();
    fillValidForm(component);

    component.gallerySelection.set({
      kept: [makeMediaItem('units/photo1.jpg'), makeMediaItem('units/photo2.jpg')],
      newFiles: [],
    });

    component.onSubmit();

    const [, mediaKeys] = mockUpdateUnitMediaKeys.execute.mock.calls[0];
    expect(mediaKeys).toEqual(['units/photo1.jpg', 'units/photo2.jpg']);
  });

  it('should exclude removed photo keys from the media sync (replace-all semantics)', async () => {
    // Unit originally had three photos; user removed photo2; only photo1 and photo3 are kept.
    const { component } = await setupEditMode();
    fillValidForm(component);

    component.gallerySelection.set({
      kept: [makeMediaItem('units/photo1.jpg'), makeMediaItem('units/photo3.jpg')],
      newFiles: [],
    });

    component.onSubmit();

    const [, mediaKeys] = mockUpdateUnitMediaKeys.execute.mock.calls[0];
    expect(mediaKeys).toEqual(['units/photo1.jpg', 'units/photo3.jpg']);
    expect(mediaKeys).not.toContain('units/photo2.jpg');
  });

  it('should merge kept keys with newly uploaded keys on EDIT', async () => {
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('units/new.jpg')));

    const { component } = await setupEditMode();
    fillValidForm(component);

    component.gallerySelection.set({
      kept: [makeMediaItem('units/existing.jpg')],
      newFiles: [makeFile('new.jpg')],
    });

    component.onSubmit();

    const [, mediaKeys] = mockUpdateUnitMediaKeys.execute.mock.calls[0];
    expect(mediaKeys).toEqual(['units/existing.jpg', 'units/new.jpg']);
  });

  it('should upload new files with category "units" on EDIT', async () => {
    const newFile = makeFile('bedroom.jpg');
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('units/bedroom.jpg')));

    const { component } = await setupEditMode();
    fillValidForm(component);
    component.gallerySelection.set({ kept: [], newFiles: [newFile] });

    component.onSubmit();

    expect(mockCreateImageStorage.execute).toHaveBeenCalledWith({
      file: newFile,
      category: 'units',
    });
  });

  it('should expose the update error message when EDIT fails', async () => {
    mockUpdateUnit.execute.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Error al actualizar' } }),
      ),
    );

    const { component } = await setupEditMode();
    fillValidForm(component);

    component.onSubmit();

    expect(component.errorMessage()).toBe('Error al actualizar');
    expect(component.isSubmitting()).toBe(false);
  });
});
