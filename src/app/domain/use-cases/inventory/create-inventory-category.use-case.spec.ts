import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CreateInventoryCategoryUseCase } from './create-inventory-category.use-case';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { CreateInventoryCategory, InventoryCategory } from '@/domain/entities/inventory.model';

describe('CreateInventoryCategoryUseCase', () => {
  let useCase: CreateInventoryCategoryUseCase;
  const repositoryMock = {
    createCategory: vi.fn(),
    createItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        CreateInventoryCategoryUseCase,
        { provide: InventoryRepository, useValue: repositoryMock }
      ]
    });

    useCase = TestBed.inject(CreateInventoryCategoryUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  it('should call repository.createCategory with correct data and return response', async () => {
    const mockDto: CreateInventoryCategory = {
      name: 'Test Category',
      description: 'Test Description'
    };

    const mockResponse: InventoryCategory = {
      id: 'cat-1',
      name: 'Test Category',
      description: 'Test Description',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };

    repositoryMock.createCategory.mockReturnValue(of(mockResponse));

    const response = await firstValueFrom(useCase.execute(mockDto));

    expect(response).toEqual(mockResponse);
    expect(repositoryMock.createCategory).toHaveBeenCalledWith(mockDto);
  });

  it('should propagate error from repository', async () => {
    const mockDto: CreateInventoryCategory = {
      name: 'Test Category',
      description: 'Test Description'
    };

    const mockError = new Error('API Error');
    repositoryMock.createCategory.mockReturnValue(throwError(() => mockError));

    try {
      await firstValueFrom(useCase.execute(mockDto));
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBe(mockError);
    }
  });
});
