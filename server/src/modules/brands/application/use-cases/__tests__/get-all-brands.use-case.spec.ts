/**
 * @file get-all-brands.use-case.spec.ts
 * @layer Application › Use Cases
 * 
 * Unit tests for GetAllBrandsUseCase.
 */

import { GetAllBrandsUseCase } from '../get-all-brands.use-case';

const mockBrandRepository = {
  findAll: jest.fn(),
};

describe('GetAllBrandsUseCase Unit Tests', () => {
  let getAllBrandsUseCase: GetAllBrandsUseCase;

  beforeEach(() => {
    getAllBrandsUseCase = new GetAllBrandsUseCase(mockBrandRepository as any);
    jest.clearAllMocks();
  });

  it('should return paginated brands', async () => {
    const mockResult = {
      data: [{ id: 'brand-1', name: 'Nike' }],
      meta: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 10, hasNextPage: false, hasPreviousPage: false },
    };
    mockBrandRepository.findAll.mockResolvedValue(mockResult);

    const query = { page: 1, limit: 10 };
    const result = await getAllBrandsUseCase.execute(query);

    expect(mockBrandRepository.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(mockResult);
  });
});
