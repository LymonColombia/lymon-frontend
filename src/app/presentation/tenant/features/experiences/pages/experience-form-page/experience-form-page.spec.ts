import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TenantExperienceFormPageComponent } from './experience-form-page';
import { CreateExperienceUseCase } from '@/domain/use-cases/experience/create-experience.use-case';
import { UpdateExperienceUseCase } from '@/domain/use-cases/experience/update-experience.use-case';
import { GetExperienceByIdUseCase } from '@/domain/use-cases/experience/get-experience-by-id.use-case';
import { CreateImageStorageUseCase } from '@/domain/use-cases/image-storage/image-storage.use-case';
import { GetPropertiesUseCase } from '@/domain/use-cases/property/get-properties.use-case';
import { GetUnitsUseCase } from '@/domain/use-cases/property/get-units.use-case';
import { CreateExperienceDto } from '@/domain/entities/experience.model';
import { MediaItem } from '@/domain/entities/storage.model';

// ─── Shared mocks ─────────────────────────────────────────────────────────────
const mockCreateExperience = { execute: vi.fn() };
const mockUpdateExperience = { execute: vi.fn() };
const mockCreateImageStorage = { execute: vi.fn() };
const mockGetProperties = { execute: vi.fn() };
const mockGetUnits = { execute: vi.fn() };
const mockGetExperienceById = { execute: vi.fn() };
const mockRouter = { navigate: vi.fn() };

// ─── Fixture data ─────────────────────────────────────────────────────────────
const BASE_EXPERIENCE_DTO: CreateExperienceDto = {
  scope: 'TENANT',
  name: 'Tour de la ciudad',
  description: 'Recorrido por lugares históricos',
  category: 'CULTURA',
  priceCop: 50000,
  durationHours: 2,
  capacity: 10,
  location: { label: 'Centro', address: 'Calle 1 #2-3', lat: 4.711, lng: -74.072 },
  availabilityType: 'ONE_TIME',
  startAt: '2026-12-01T09:00:00Z',
};

const UPLOAD_RESULT = (key: string) => ({
  key,
  fileUrl: `https://pub-abc.r2.dev/${key}`,
});

const makeFile = (name = 'photo.jpg') => new File(['img-data'], name, { type: 'image/jpeg' });

const makeMediaItem = (key: string): MediaItem => ({
  key,
  url: `https://pub-abc.r2.dev/${key}`,
});

// ─── TestBed setup ────────────────────────────────────────────────────────────
async function setup() {
  await TestBed.configureTestingModule({
    imports: [TenantExperienceFormPageComponent],
    providers: [
      { provide: CreateExperienceUseCase, useValue: mockCreateExperience },
      { provide: UpdateExperienceUseCase, useValue: mockUpdateExperience },
      { provide: CreateImageStorageUseCase, useValue: mockCreateImageStorage },
      { provide: GetPropertiesUseCase, useValue: mockGetProperties },
      { provide: GetUnitsUseCase, useValue: mockGetUnits },
      { provide: GetExperienceByIdUseCase, useValue: mockGetExperienceById },
      { provide: Router, useValue: mockRouter },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => null } } },
      },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  })
    .overrideComponent(TenantExperienceFormPageComponent, {
      set: { template: '', imports: [] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(TenantExperienceFormPageComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges(); // triggers ngOnInit → loadProperties()
  return { fixture, component };
}

// ─── CREATE mode ──────────────────────────────────────────────────────────────
describe('TenantExperienceFormPageComponent – onSubmitExperience – CREATE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([]));
    mockCreateExperience.execute.mockReturnValue(of(undefined));
  });

  it('should upload the cover and every gallery file with category "experiences"', async () => {
    const coverFile = makeFile('cover.jpg');
    const gallery1 = makeFile('g1.jpg');
    const gallery2 = makeFile('g2.jpg');

    mockCreateImageStorage.execute
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/cover.jpg')))
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/g1.jpg')))
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/g2.jpg')));

    const { component } = await setup();

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: coverFile,
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [gallery1, gallery2],
    });

    expect(mockCreateImageStorage.execute).toHaveBeenCalledTimes(3);
    expect(mockCreateImageStorage.execute).toHaveBeenCalledWith({
      file: coverFile,
      category: 'experiences',
    });
    expect(mockCreateImageStorage.execute).toHaveBeenCalledWith({
      file: gallery1,
      category: 'experiences',
    });
    expect(mockCreateImageStorage.execute).toHaveBeenCalledWith({
      file: gallery2,
      category: 'experiences',
    });
  });

  it('should send the cover key as mediaKeys[0] followed by the gallery keys (no coverImageKey field)', async () => {
    mockCreateImageStorage.execute
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/cover.jpg')))
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/g1.jpg')))
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/g2.jpg')));

    const { component } = await setup();

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: makeFile('cover.jpg'),
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [makeFile('g1.jpg'), makeFile('g2.jpg')],
    });

    expect(mockCreateExperience.execute).toHaveBeenCalledOnce();
    const [createArg] = mockCreateExperience.execute.mock.calls[0];
    expect(createArg.mediaKeys).toEqual(['exp/cover.jpg', 'exp/g1.jpg', 'exp/g2.jpg']);
    expect(createArg).not.toHaveProperty('coverImageKey');
  });

  it('should order mediaKeys as cover, then kept keys, then newly uploaded keys', async () => {
    mockCreateImageStorage.execute
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/cover.jpg')))
      .mockReturnValueOnce(of(UPLOAD_RESULT('exp/new.jpg')));

    const { component } = await setup();

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: makeFile('cover.jpg'),
      existingCoverKey: null,
      keptMediaItems: [makeMediaItem('exp/existing.jpg')],
      newMediaFiles: [makeFile('new.jpg')],
    });

    const [createArg] = mockCreateExperience.execute.mock.calls[0];
    expect(createArg.mediaKeys).toEqual(['exp/cover.jpg', 'exp/existing.jpg', 'exp/new.jpg']);
  });

  it('should send empty mediaKeys (and no coverImageKey) when there is no cover or gallery', async () => {
    const { component } = await setup();

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [],
    });

    expect(mockCreateImageStorage.execute).not.toHaveBeenCalled();
    const [createArg] = mockCreateExperience.execute.mock.calls[0];
    expect(createArg).not.toHaveProperty('coverImageKey');
    expect(createArg.mediaKeys).toEqual([]);
  });

  it('should not call createExperienceUseCase when an upload fails', async () => {
    mockCreateImageStorage.execute.mockReturnValue(
      throwError(() => new Error('Upload error')),
    );

    const { component } = await setup();

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: makeFile(),
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [],
    });

    expect(mockCreateExperience.execute).not.toHaveBeenCalled();
  });

  it('should open the save error modal and clear isSaving when an upload fails', async () => {
    mockCreateImageStorage.execute.mockReturnValue(
      throwError(() => new Error('Upload error')),
    );

    const { component } = await setup();

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: makeFile(),
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [],
    });

    expect(component.saveErrorModalOpen()).toBe(true);
    expect(component.isSaving()).toBe(false);
  });

  it('should navigate away and clear isSaving on successful create', async () => {
    const { component } = await setup();

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [],
    });

    expect(component.isSaving()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tenant-experiences']);
  });
});

// ─── EDIT mode ────────────────────────────────────────────────────────────────
describe('TenantExperienceFormPageComponent – onSubmitExperience – EDIT', () => {
  const EDITING_ID = 'exp-abc-123';

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    mockGetProperties.execute.mockReturnValue(of([]));
    mockUpdateExperience.execute.mockReturnValue(of(undefined));
  });

  it('should call updateExperienceUseCase (not createExperienceUseCase) when editing', async () => {
    const { component } = await setup();
    component.editingExperienceId.set(EDITING_ID);

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [],
    });

    expect(mockUpdateExperience.execute).toHaveBeenCalledOnce();
    expect(mockUpdateExperience.execute).toHaveBeenCalledWith(EDITING_ID, expect.any(Object));
    expect(mockCreateExperience.execute).not.toHaveBeenCalled();
  });

  it('should reuse the existing cover key as mediaKeys[0] when no new cover file is provided', async () => {
    const { component } = await setup();
    component.editingExperienceId.set(EDITING_ID);

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: 'exp/old-cover.jpg',
      keptMediaItems: [makeMediaItem('exp/photo1.jpg')],
      newMediaFiles: [],
    });

    const updateDto = mockUpdateExperience.execute.mock.calls[0][1];
    expect(updateDto).not.toHaveProperty('coverImageKey');
    expect(updateDto.mediaKeys).toEqual(['exp/old-cover.jpg', 'exp/photo1.jpg']);
  });

  it('should use the newly uploaded cover key as mediaKeys[0] when a new cover file is provided', async () => {
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('exp/new-cover.jpg')));

    const { component } = await setup();
    component.editingExperienceId.set(EDITING_ID);

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: makeFile('new-cover.jpg'),
      existingCoverKey: 'exp/old-cover.jpg',
      keptMediaItems: [],
      newMediaFiles: [],
    });

    const updateDto = mockUpdateExperience.execute.mock.calls[0][1];
    expect(updateDto.mediaKeys[0]).toBe('exp/new-cover.jpg');
    expect(updateDto.mediaKeys).not.toContain('exp/old-cover.jpg');
  });

  it('should include all kept media item keys in the update dto mediaKeys', async () => {
    const { component } = await setup();
    component.editingExperienceId.set(EDITING_ID);

    const keptItems: MediaItem[] = [
      makeMediaItem('exp/photo1.jpg'),
      makeMediaItem('exp/photo2.jpg'),
    ];

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: null,
      keptMediaItems: keptItems,
      newMediaFiles: [],
    });

    const updateDto = mockUpdateExperience.execute.mock.calls[0][1];
    expect(updateDto.mediaKeys).toEqual(['exp/photo1.jpg', 'exp/photo2.jpg']);
  });

  it('should exclude the key of a removed photo from mediaKeys (replace-all semantics)', async () => {
    // User originally had three photos but removed photo2; only photo1 and photo3 are kept.
    const { component } = await setup();
    component.editingExperienceId.set(EDITING_ID);

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: null,
      keptMediaItems: [makeMediaItem('exp/photo1.jpg'), makeMediaItem('exp/photo3.jpg')],
      newMediaFiles: [],
    });

    const updateDto = mockUpdateExperience.execute.mock.calls[0][1];
    expect(updateDto.mediaKeys).toEqual(['exp/photo1.jpg', 'exp/photo3.jpg']);
    expect(updateDto.mediaKeys).not.toContain('exp/photo2.jpg');
  });

  it('should merge kept keys with freshly uploaded keys in mediaKeys', async () => {
    mockCreateImageStorage.execute.mockReturnValue(of(UPLOAD_RESULT('exp/new1.jpg')));

    const { component } = await setup();
    component.editingExperienceId.set(EDITING_ID);

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: null,
      keptMediaItems: [makeMediaItem('exp/existing.jpg')],
      newMediaFiles: [makeFile('new1.jpg')],
    });

    const updateDto = mockUpdateExperience.execute.mock.calls[0][1];
    expect(updateDto.mediaKeys).toEqual(['exp/existing.jpg', 'exp/new1.jpg']);
  });

  it('should open the save error modal when the update call fails', async () => {
    mockUpdateExperience.execute.mockReturnValue(
      throwError(() => ({ status: 500, error: { message: 'Server error' } })),
    );

    const { component } = await setup();
    component.editingExperienceId.set(EDITING_ID);

    component.onSubmitExperience({
      experience: BASE_EXPERIENCE_DTO,
      coverImageFile: null,
      existingCoverKey: null,
      keptMediaItems: [],
      newMediaFiles: [],
    });

    expect(component.saveErrorModalOpen()).toBe(true);
    expect(component.isSaving()).toBe(false);
  });
});
