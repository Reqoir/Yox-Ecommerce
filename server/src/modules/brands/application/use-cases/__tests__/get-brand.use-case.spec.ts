/**
 * @file get-brand.use-case.spec.ts
 * @layer Application › Use Cases
 * 
 * Unit tests for GetBrandUseCase.
 */

import { GetBrandUseCase } from '../get-brand.use-case';

const mockBrandRepository = {
  findById: jest.fn(),
};

describe('GetBrandUseCase Unit Tests', () => {
  let getBrandUseCase: GetBrandUseCase;

  beforeEach(() => {
    getBrandUseCase = new GetBrandUseCase(mockBrandRepository as any);
    jest.clearAllMocks();
  });

  it('should return a brand if found', async () => {
    const mockBrand = { id: 'brand-123', name: 'Nike' };
    mockBrandRepository.findById.mockResolvedValue(mockBrand);

    const result = await getBrandUseCase.execute('brand-123');

    expect(mockBrandRepository.findById).toHaveBeenCalledWith('brand-123');
    expect(result).toEqual(mockBrand);
  });

  it('should throw an error if brand is not found', async () => {
    mockBrandRepository.findById.mockResolvedValue(null);

    await expect(getBrandUseCase.execute('not-found')).rejects.toThrow(
      'Brand not found.'
    );
  });
});
