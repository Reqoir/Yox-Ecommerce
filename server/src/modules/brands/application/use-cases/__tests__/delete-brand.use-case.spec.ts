/**
 * @file delete-brand.use-case.spec.ts
 * @layer Application › Use Cases
 * 
 * Unit tests for DeleteBrandUseCase.
 */

import { DeleteBrandUseCase } from '../delete-brand.use-case';

const mockBrandRepository = {
  findById: jest.fn(),
  delete: jest.fn(),
};

describe('DeleteBrandUseCase Unit Tests', () => {
  let deleteBrandUseCase: DeleteBrandUseCase;

  beforeEach(() => {
    deleteBrandUseCase = new DeleteBrandUseCase(mockBrandRepository as any);
    jest.clearAllMocks();
  });

  it('should successfully delete a brand', async () => {
    mockBrandRepository.findById.mockResolvedValue({ id: 'brand-123' });
    mockBrandRepository.delete.mockResolvedValue(true);

    await deleteBrandUseCase.execute('brand-123');

    expect(mockBrandRepository.findById).toHaveBeenCalledWith('brand-123');
    expect(mockBrandRepository.delete).toHaveBeenCalledWith('brand-123');
  });

  it('should throw an error if brand is not found', async () => {
    mockBrandRepository.findById.mockResolvedValue(null);

    await expect(deleteBrandUseCase.execute('not-found')).rejects.toThrow(
      'Brand not found.'
    );
  });

  it('should throw an error if delete fails', async () => {
    mockBrandRepository.findById.mockResolvedValue({ id: 'brand-123' });
    mockBrandRepository.delete.mockResolvedValue(false);

    await expect(deleteBrandUseCase.execute('brand-123')).rejects.toThrow(
      'Failed to delete brand.'
    );
  });
});
