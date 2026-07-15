/**
 * @file update-brand.use-case.spec.ts
 * @layer Application › Use Cases
 * 
 * Unit tests for UpdateBrandUseCase.
 */

import { UpdateBrandUseCase } from '../update-brand.use-case';

const mockBrandRepository = {
  findById: jest.fn(),
  findBySlug: jest.fn(),
  update: jest.fn(),
};

describe('UpdateBrandUseCase Unit Tests', () => {
  let updateBrandUseCase: UpdateBrandUseCase;

  beforeEach(() => {
    updateBrandUseCase = new UpdateBrandUseCase(mockBrandRepository as any);
    jest.clearAllMocks();
  });

  it('should successfully update a brand', async () => {
    const mockBrand = { id: 'brand-123', name: 'Nike', slug: 'nike' };
    mockBrandRepository.findById.mockResolvedValue(mockBrand);
    mockBrandRepository.update.mockResolvedValue({ ...mockBrand, name: 'Nike Inc' });

    const result = await updateBrandUseCase.execute('brand-123', { name: 'Nike Inc' });

    expect(mockBrandRepository.findById).toHaveBeenCalledWith('brand-123');
    expect(mockBrandRepository.update).toHaveBeenCalledWith('brand-123', { name: 'Nike Inc' });
    expect(result.name).toBe('Nike Inc');
  });

  it('should throw an error if brand is not found', async () => {
    mockBrandRepository.findById.mockResolvedValue(null);

    await expect(updateBrandUseCase.execute('not-found', { name: 'New Name' })).rejects.toThrow(
      'Brand not found.'
    );
  });

  it('should throw an error if new slug is already taken', async () => {
    const mockBrand = { id: 'brand-123', name: 'Nike', slug: 'nike' };
    mockBrandRepository.findById.mockResolvedValue(mockBrand);
    mockBrandRepository.findBySlug.mockResolvedValue({ id: 'brand-456', slug: 'adidas' });

    await expect(updateBrandUseCase.execute('brand-123', { slug: 'adidas' })).rejects.toThrow(
      'A brand with this slug already exists.'
    );
  });
});
