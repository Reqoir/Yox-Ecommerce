/**
 * @file create-category.use-case.spec.ts
 * @layer Application › Use Cases
 * 
 * Unit tests for CreateCategoryUseCase.
 */

import { CreateCategoryUseCase } from '../category.use-cases';
import { Category } from '../../../domain/entities/category.entity';

// 1. Create a Mock CategoryRepository
const mockCategoryRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findAll: jest.fn(),
  delete: jest.fn(),
};

describe('CreateCategoryUseCase Unit Tests', () => {
  let createCategoryUseCase: CreateCategoryUseCase;

  beforeEach(() => {
    createCategoryUseCase = new CreateCategoryUseCase(mockCategoryRepository as any);
    jest.clearAllMocks();
  });

  it('should successfully create and save a new category', async () => {
    const input = {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets and gear',
      isActive: true,
      sortOrder: 1,
    };

    // Arrange: Mock slug check (not found) and mock save resolution
    mockCategoryRepository.findBySlug.mockResolvedValue(null);
    mockCategoryRepository.save.mockImplementation((category: Category) => {
      // Return a reconstituted category with a mocked ID
      return Category.reconstitute({
        ...category.toJSON(),
        id: 'category-123',
      });
    });

    // Act: Execute Use Case
    const result = await createCategoryUseCase.execute(input);

    // Assert: Verify details
    expect(mockCategoryRepository.findBySlug).toHaveBeenCalledWith('electronics');
    expect(mockCategoryRepository.save).toHaveBeenCalled();
    expect(result.id).toBe('category-123');
    expect(result.name).toBe('Electronics');
    expect(result.slug).toBe('electronics');
    expect(result.isActive).toBe(true);
  });

  it('should throw an error if slug is already taken', async () => {
    const input = {
      name: 'Electronics Duplicate',
      slug: 'electronics',
      isActive: true,
    };

    // Arrange: Mock that the slug is already taken
    const existingCategory = Category.reconstitute({
      id: 'existing-123',
      name: 'Electronics Original',
      slug: 'electronics',
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockCategoryRepository.findBySlug.mockResolvedValue(existingCategory);

    // Act & Assert: Execute and expect crash
    await expect(createCategoryUseCase.execute(input)).rejects.toThrow(
      'Category with slug electronics already exists'
    );
    expect(mockCategoryRepository.save).not.toHaveBeenCalled();
  });

  it('should throw an error if parentCategoryId is provided but parent does not exist', async () => {
    const input = {
      name: 'Smartphones',
      slug: 'smartphones',
      parentCategoryId: 'non-existent-parent',
    };

    // Arrange: Mock slug not taken, but parent category is not found in DB
    mockCategoryRepository.findBySlug.mockResolvedValue(null);
    mockCategoryRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(createCategoryUseCase.execute(input)).rejects.toThrow(
      'Parent category not found'
    );
    expect(mockCategoryRepository.save).not.toHaveBeenCalled();
  });
});
