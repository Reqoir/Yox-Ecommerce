/**
 * @file create-brand.use-case.spec.ts
 * @layer Application › Use Cases
 * 
 * Unit tests for CreateBrandUseCase.
 */

import { CreateBrandUseCase } from '../create-brand.use-case';

const mockBrandRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByName: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
};

describe('CreateBrandUseCase Unit Tests', () => {
  let createBrandUseCase: CreateBrandUseCase;

  beforeEach(() => {
    createBrandUseCase = new CreateBrandUseCase(mockBrandRepository as any);
    jest.clearAllMocks();
  });

  it('should successfully create a new brand', async () => {
    const input = {
      name: 'Nike',
      slug: 'nike',
      isActive: true,
      displayOrder: 1,
    };

    mockBrandRepository.findBySlug.mockResolvedValue(null);
    mockBrandRepository.create.mockResolvedValue({
      id: 'brand-123',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createBrandUseCase.execute(input);

    expect(mockBrandRepository.findBySlug).toHaveBeenCalledWith('nike');
    expect(mockBrandRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Nike',
      slug: 'nike',
      isActive: true,
      displayOrder: 1,
    }));
    expect(result.id).toBe('brand-123');
    expect(result.name).toBe('Nike');
  });

  it('should throw an error if slug is already taken', async () => {
    const input = {
      name: 'Adidas',
      slug: 'adidas',
    };

    mockBrandRepository.findBySlug.mockResolvedValue({
      id: 'existing-123',
      name: 'Existing Adidas',
      slug: 'adidas',
    });

    await expect(createBrandUseCase.execute(input)).rejects.toThrow(
      'A brand with this slug already exists.'
    );
    expect(mockBrandRepository.create).not.toHaveBeenCalled();
  });
});
