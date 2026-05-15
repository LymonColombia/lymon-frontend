import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { GetInventoryCategoriesUseCase } from './get-inventory-categories.use-case';
import { InventoryRepository } from '../../repositories/inventory.repository';

describe('GetInventoryCategoriesUseCase', () => {
  let useCase: GetInventoryCategoriesUseCase;
  let repository: any;

  beforeEach(() => {
    repository = {
      getCategories: vi.fn(),
    };
    useCase = new GetInventoryCategoriesUseCase();
    (useCase as any).repository = repository;
  });

  it('should call getCategories from repository', async () => {
    const mockCategories = [
      { id: '1', name: 'Textiles', description: 'Telas y sabanas' },
      { id: '2', name: 'Limpieza', description: 'Jabones y desinfectantes' },
    ];
    repository.getCategories.mockReturnValue(of(mockCategories));

    const result = await new Promise((resolve) => {
      useCase.execute().subscribe(resolve);
    });

    expect(repository.getCategories).toHaveBeenCalled();
    expect(result).toEqual(mockCategories);
  });

  it('should handle error from repository', async () => {
    const mockError = new Error('Network error');
    repository.getCategories.mockReturnValue(throwError(() => mockError));

    try {
      await new Promise((_, reject) => {
        useCase.execute().subscribe({ error: reject });
      });
    } catch (error) {
      expect(error).toBe(mockError);
    }
  });
});
