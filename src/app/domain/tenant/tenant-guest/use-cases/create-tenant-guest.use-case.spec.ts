import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CreateTenantGuestUseCase } from './create-tenant-guest.use-case';
import { TenantGuestRepository } from '@/domain/tenant/tenant-guest/tenant-guest.repository';
import {
  CreateTenantGuestResponse, CreateTenantGuestRequest
} from '@/domain/tenant/tenant-guest/tenant-guest.model';

/**
 * The backend validates POST /guests against CreateGuestDto under
 * ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }) — see
 * lymon-backend/src/main.ts. Any property the DTO does not declare is a
 * 400 "property X should not exist", so the request body must match exactly.
 */
describe('CreateTenantGuestUseCase', () => {
  let useCase: CreateTenantGuestUseCase;
  let repositoryMock: { createGuest: ReturnType<typeof vi.fn> };

  const mockResponse: CreateTenantGuestResponse = {
      guestId: 'guest-1',
      fullName: 'Carlos Ruiz',
      primaryEmail: 'carlos@test.com',
  };

  const INPUT = {
    fullName: 'Yuleidis Andrés Pérez Londoño',
    primaryEmail: 'andresperezlondono067@gmail.com',
  };

  const EXPECTED_REQUEST: CreateTenantGuestRequest = {
    fullName: INPUT.fullName,
    primaryEmail: INPUT.primaryEmail,
    identity: null,
    firstName: '',
    lastName: '',
    tags: [],
    preferences: [],
  };

  beforeEach(() => {
    repositoryMock = {
      createGuest: vi.fn().mockReturnValue(of(mockResponse)),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateTenantGuestUseCase,
        { provide: TenantGuestRepository, useValue: repositoryMock },
      ],
    });

    useCase = TestBed.inject(CreateTenantGuestUseCase);
  });

  it('sends identity.documentNumber when idNumber is provided', () => {
    useCase
      .execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com', idNumber: '1020304050' })
      .subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: { documentNumber: '1020304050' } }),
    );
  });

  it('trims idNumber before sending it', () => {
    useCase
      .execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com', idNumber: '  1020304050  ' })
      .subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: { documentNumber: '1020304050' } }),
    );
  });

  it('sends identity: null when idNumber is missing', () => {
    useCase.execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com' }).subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: null }),
    );
  });

  it('sends identity: null when idNumber is blank', () => {
    useCase
      .execute({ fullName: 'Carlos Ruiz', primaryEmail: 'carlos@test.com', idNumber: '   ' })
      .subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(
      expect.objectContaining({ identity: null }),
    );
  });

  function sentRequest(): CreateTenantGuestRequest {
    return repositoryMock.createGuest.mock.calls[0][0] as CreateTenantGuestRequest;
  }

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should send exactly the body CreateGuestDto whitelists', () => {
    useCase.execute(INPUT).subscribe();

    expect(repositoryMock.createGuest).toHaveBeenCalledWith(EXPECTED_REQUEST);
    expect(repositoryMock.createGuest).toHaveBeenCalledTimes(1);
  });

  // Regression: these two keys produced 400 on POST /guests because
  // CreateGuestDto declares neither (its phone field is `phone`, singular).
  it('must not send `emails`, which CreateGuestDto does not declare', () => {
    useCase.execute(INPUT).subscribe();

    expect(sentRequest()).not.toHaveProperty('emails');
    expect(Object.keys(sentRequest())).not.toContain('emails');
  });

  it('must not send `phones`, which CreateGuestDto does not declare', () => {
    useCase.execute(INPUT).subscribe();

    expect(sentRequest()).not.toHaveProperty('phones');
    expect(Object.keys(sentRequest())).not.toContain('phones');
  });

  it('should contain no property outside the CreateGuestDto whitelist', () => {
    useCase.execute(INPUT).subscribe();

    const allowed = [
      'fullName',
      'primaryEmail',
      'identity',
      'firstName',
      'lastName',
      'tags',
      'preferences',
    ];
    expect(Object.keys(sentRequest()).sort()).toEqual([...allowed].sort());
  });

  it('should forward the fullName and primaryEmail from the input', () => {
    useCase.execute(INPUT).subscribe();

    const sent = sentRequest();
    expect(sent.fullName).toBe(INPUT.fullName);
    expect(sent.primaryEmail).toBe(INPUT.primaryEmail);
  });

  it('should return the repository result', () => {
    useCase.execute(INPUT).subscribe((result) => {
      expect(result).toEqual(mockResponse);
    });
  });

  it('should propagate errors from the repository', () => {
    const error = new Error('Backend failed to create guest');
    repositoryMock.createGuest.mockReturnValue(throwError(() => error));

    let receivedError: unknown;
    useCase.execute(INPUT).subscribe({
      error: (err) => {
        receivedError = err;
      },
    });

    expect(receivedError).toBe(error);
  });
});
