import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CreateUnitUseCase } from '@/domain/use-cases/property/create-unit.use-case';
import { UnitFormModalComponent } from './unit-form-modal.component';

const mockCreateUnit = { execute: vi.fn() };

async function setup(propertyId = 'p1') {
  await TestBed.configureTestingModule({
    imports: [UnitFormModalComponent],
    providers: [{ provide: CreateUnitUseCase, useValue: mockCreateUnit }],
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
    standardGuests: 1,
    bathroomsCount: 1,
    isShared: false,
    pricePerNight: 150,
  });

  const bedroom = component.form.controls.bedrooms.at(0);
  bedroom.patchValue({ roomName: 'Dormitorio 1' });
}

describe('UnitFormModalComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
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

  it('should emit created on successful submit', async () => {
    mockCreateUnit.execute.mockReturnValue(of(undefined));
    const { component } = await setup();
    const createdSpy = vi.fn();
    component.created.subscribe(createdSpy);
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

    expect(component.errorMessage()).toBe('Error al crear la unidad. Inténtalo de nuevo.');
  });

  it('should toggle amenities selection', async () => {
    const { component } = await setup();

    component.toggleAmenity('WiFi');
    expect(component.isAmenitySelected('WiFi')).toBe(true);

    component.toggleAmenity('WiFi');
    expect(component.isAmenitySelected('WiFi')).toBe(false);
  });
});
