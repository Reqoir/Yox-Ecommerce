'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  X,
  Image as ImageIcon,
  Loader2,
  Eye,
  Search,
  Upload,
  Crop,
  RefreshCw,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Images,
  ExternalLink,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from '@/components/ui/pagination';
import { useProducts } from '@/hooks/admin/useProducts';
import { productApi, Product, ProductVariant } from '@/api/admin/products';
import { useBrands } from '@/hooks/admin/useBrands';
import { useCategories } from '@/hooks/admin/useCategories';
import { uploadApi } from '@/api/admin/upload';
import { ImageCropperModal } from '@/components/ui/image-cropper-modal';
import { toast } from 'sonner';

type SizeVariant = {
  id: string;
  size: string;
  price: number;
  comparePrice: number | null;
  costPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  sku: string;
  weight: number | null;
  isActive: boolean;
};

type ColorGroup = {
  id: string;
  color: string;
  images: string[];
  isDefault: boolean;
  sizes: SizeVariant[];
};

const COMMON_FITS = [
  'Slim Fit',
  'Regular Fit',
  'Oversized',
  'Relaxed Fit',
  'Skinny Fit',
  'Athletic Fit',
  'Boxy Fit',
  'Tailored Fit',
  'Classic Fit',
  'Loose Fit'
];

const COMMON_PROMOTIONS = [
  'NEW',
  'LIMITED',
  'SALE',
  'BESTSELLER',
  'TRENDING',
  'HOT',
  'EXCLUSIVE'
];

// Helper to slugify string
const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function AdminProductPage() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct, isCreating, isUpdating } = useProducts();
  const { brands } = useBrands();
  const { categories } = useCategories();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const [selectedMediaColorId, setSelectedMediaColorId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Slug auto-generation state
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Barcode lookup state
  const [isCheckingBarcode, setIsCheckingBarcode] = useState(false);
  const [existingBarcodeProduct, setExistingBarcodeProduct] = useState<Product | null>(null);

  // Image Cropper Modal state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSource, setCropSource] = useState<File | string | null>(null);
  const [cropTarget, setCropTarget] = useState<
    | { type: 'thumbnail' }
    | { type: 'variant-single'; groupId: string; index: number }
    | { type: 'variant-add'; groupId: string }
    | null
  >(null);

  // Separate categories into Parent Categories (no parentCategoryId) and Subcategories
  const parentCategories = useMemo(() => {
    return categories.filter(c => !(c as any).parentCategoryId);
  }, [categories]);

  const defaultForm = {
    name: '',
    slug: '',
    categoryId: 'none',
    subCategoryId: 'none',
    brandId: 'none',
    fit: '',
    tag: '',
    shortDescription: '',
    description: '',
    thumbnail: '',
    isFeatured: false,
    isActive: true,
    seoTitle: '',
    seoDescription: '',
    globalBarcode: '',
    colorGroups: [] as ColorGroup[],
  };

  const [formData, setFormData] = useState(defaultForm);

  // Auto-generate slug when product name changes unless manually customized
  const handleNameChange = (name: string) => {
    if (!isSlugManual) {
      const slug = generateSlug(name);
      setFormData(prev => ({ ...prev, name, slug }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
  };

  // Re-sync slug with name
  const handleSyncSlug = () => {
    const slug = generateSlug(formData.name);
    setFormData(prev => ({ ...prev, slug }));
    setIsSlugManual(false);
    toast.success('Slug updated from product name');
  };

  // Available subcategories based on selected parent categoryId
  const availableSubCategories = useMemo(() => {
    if (formData.categoryId === 'none') return [];
    return categories.filter(c => (c as any).parentCategoryId === formData.categoryId);
  }, [categories, formData.categoryId]);

  // Group flat variants into ColorGroups
  const groupByColor = (variants: Omit<ProductVariant, 'id'>[]): ColorGroup[] => {
    const groups = new Map<string, ColorGroup>();

    variants.forEach(v => {
      const colorKey = v.color || 'Default';
      if (!groups.has(colorKey)) {
        groups.set(colorKey, {
          id: Math.random().toString(),
          color: v.color || '',
          images: v.images || [],
          isDefault: v.isDefault || false,
          sizes: []
        });
      }

      const group = groups.get(colorKey)!;
      if (v.isDefault) group.isDefault = true;

      group.sizes.push({
        id: Math.random().toString(),
        size: (v.size || '').toUpperCase(),
        price: v.price,
        comparePrice: v.comparePrice || null,
        costPrice: v.costPrice || null,
        stock: v.stock,
        lowStockThreshold: v.lowStockThreshold || 10,
        sku: v.sku,
        weight: v.weight || null,
        isActive: v.isActive ?? true,
      });
    });

    return Array.from(groups.values());
  };

  // Flatten ColorGroups back into flat variants
  const flattenVariants = (colorGroups: ColorGroup[], productName: string, globalBarcode: string): Omit<ProductVariant, 'id'>[] => {
    return colorGroups.flatMap(group =>
      group.sizes.map((size, index) => {
        const uppercaseSize = size.size ? size.size.trim().toUpperCase() : null;
        return {
          title: `${productName} - ${group.color} - ${uppercaseSize || 'Standard'}`,
          sku: size.sku || `SKU-${Date.now().toString().slice(-4)}-${index}`,
          color: group.color.trim(),
          price: Number(size.price) || 0,
          comparePrice: size.comparePrice !== null ? Number(size.comparePrice) : null,
          costPrice: size.costPrice !== null ? Number(size.costPrice) : null,
          stock: Number(size.stock) || 0,
          lowStockThreshold: Number(size.lowStockThreshold) || 10,
          weight: size.weight !== null ? Number(size.weight) : null,
          images: group.images.filter(img => img && img.trim() !== ''),
          isDefault: group.isDefault && index === 0,
          isActive: size.isActive,
          size: uppercaseSize,
          barcode: globalBarcode?.trim() || null,
        };
      })
    );
  };

  // Debounced Barcode check
  const checkBarcodeExists = useCallback(async (barcode: string) => {
    if (!barcode || !barcode.trim()) {
      setExistingBarcodeProduct(null);
      return;
    }

    try {
      setIsCheckingBarcode(true);
      const existing = await productApi.getByBarcode(barcode.trim());
      if (existing && (!editProduct || existing.id !== editProduct.id)) {
        setExistingBarcodeProduct(existing);
        toast.info(`Barcode is already associated with "${existing.name}". Full details displayed below.`);
      } else {
        setExistingBarcodeProduct(null);
      }
    } catch (error) {
      console.error('Error checking barcode:', error);
      setExistingBarcodeProduct(null);
    } finally {
      setIsCheckingBarcode(false);
    }
  }, [editProduct]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.globalBarcode && formData.globalBarcode.trim().length >= 3) {
        checkBarcodeExists(formData.globalBarcode.trim());
      } else {
        setExistingBarcodeProduct(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.globalBarcode, checkBarcodeExists]);

  const handleOpenAdd = () => {
    setFormData(defaultForm);
    setEditProduct(null);
    setIsSlugManual(false);
    setActiveTab("general");
    setSelectedMediaColorId('');
    setExistingBarcodeProduct(null);
    setIsAddOpen(true);
  };

  const handleOpenView = async (product: Product) => {
    try {
      const fullProduct = await productApi.getById(product.id);
      setViewProduct(fullProduct);
      setIsViewOpen(true);
    } catch (error) {
      console.error("Failed to fetch full product details:", error);
      toast.error("Failed to fetch product details");
    }
  };

  const handleOpenEdit = async (product: Product) => {
    try {
      const fullProduct = await productApi.getById(product.id);
      const grouped = fullProduct.variants && fullProduct.variants.length > 0 ? groupByColor(fullProduct.variants) : [];

      setFormData({
        name: fullProduct.name,
        slug: fullProduct.slug,
        categoryId: fullProduct.categoryId || 'none',
        subCategoryId: fullProduct.subCategoryId || 'none',
        brandId: fullProduct.brandId || 'none',
        fit: fullProduct.fit || '',
        tag: fullProduct.tag || '',
        shortDescription: fullProduct.shortDescription || '',
        description: fullProduct.description || '',
        thumbnail: fullProduct.thumbnail || '',
        isFeatured: fullProduct.isFeatured,
        isActive: fullProduct.isActive,
        seoTitle: fullProduct.seoTitle || '',
        seoDescription: fullProduct.seoDescription || '',
        globalBarcode: fullProduct.variants?.[0]?.barcode || '',
        colorGroups: grouped,
      });
      setEditProduct(fullProduct);
      setIsSlugManual(true);
      setActiveTab("general");
      setSelectedMediaColorId(grouped.length > 0 ? grouped[0].id : '');
      setExistingBarcodeProduct(null);
      setIsAddOpen(true);
    } catch (error) {
      console.error("Failed to fetch full product details:", error);
      toast.error("Failed to fetch product details for editing");
    }
  };

  // Image Upload Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadApi.uploadImage(file);
      callback(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Bulk Image Upload Handler
  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, groupId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const targetGroup = formData.colorGroups.find(g => g.id === groupId);
    if (!targetGroup) return;

    const availableSlots = 10 - targetGroup.images.length;
    if (availableSlots <= 0) {
      toast.error('This color variant already has the maximum of 10 images.');
      e.target.value = '';
      return;
    }

    const filesToUpload = fileArray.slice(0, availableSlots);
    if (fileArray.length > availableSlots) {
      toast.info(`Uploading ${availableSlots} images (maximum gallery limit is 10).`);
    }

    try {
      setIsBulkUploading(true);
      let uploadedUrls: string[] = [];

      try {
        uploadedUrls = await uploadApi.uploadMultipleImages(filesToUpload);
      } catch {
        // Fallback to uploading individually if bulk endpoint fails
        for (const file of filesToUpload) {
          const url = await uploadApi.uploadImage(file);
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          colorGroups: prev.colorGroups.map(g => {
            if (g.id === groupId) {
              const currentValid = g.images.filter(img => img.trim() !== '');
              return {
                ...g,
                images: [...currentValid, ...uploadedUrls].slice(0, 10)
              };
            }
            return g;
          })
        }));
        toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)!`);
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
      toast.error('Failed to upload some images. Please try again.');
    } finally {
      setIsBulkUploading(false);
      e.target.value = '';
    }
  };

  // Cropper trigger
  const handleOpenCropperForFile = (
    file: File,
    target: { type: 'thumbnail' } | { type: 'variant-single'; groupId: string; index: number } | { type: 'variant-add'; groupId: string }
  ) => {
    setCropSource(file);
    setCropTarget(target);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!cropTarget) return;

    try {
      setIsUploading(true);
      toast.info('Uploading cropped image...');
      const url = await uploadApi.uploadImage(croppedFile);

      if (cropTarget.type === 'thumbnail') {
        setFormData(prev => ({ ...prev, thumbnail: url }));
      } else if (cropTarget.type === 'variant-single') {
        updateImageInGroup(cropTarget.groupId, cropTarget.index, url);
      } else if (cropTarget.type === 'variant-add') {
        setFormData(prev => ({
          ...prev,
          colorGroups: prev.colorGroups.map(g => {
            if (g.id === cropTarget.groupId && g.images.length < 10) {
              return { ...g, images: [...g.images, url] };
            }
            return g;
          })
        }));
      }
      toast.success('Cropped image uploaded and applied!');
    } catch (error) {
      console.error('Failed to upload cropped image:', error);
      toast.error('Failed to upload cropped image.');
    } finally {
      setIsUploading(false);
      setCropTarget(null);
    }
  };

  // Submit with strict variant validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product Name is required.');
      setActiveTab('general');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Product Slug is required.');
      setActiveTab('general');
      return;
    }

    // Strict Variant Validation: Check Color and Size Requirements
    if (formData.colorGroups.length === 0) {
      toast.error('Please add at least one color variant for this product.');
      setActiveTab('variants');
      return;
    }

    for (let i = 0; i < formData.colorGroups.length; i++) {
      const group = formData.colorGroups[i];
      const colorName = group.color.trim();

      if (!colorName) {
        toast.error(`Color group #${i + 1} is missing a Color Name.`);
        setActiveTab('variants');
        return;
      }

      if (!group.sizes || group.sizes.length === 0) {
        toast.error(`Color "${colorName}" must have at least one size variant. You cannot save without adding sizes.`);
        setActiveTab('variants');
        return;
      }

      for (let j = 0; j < group.sizes.length; j++) {
        const sizeObj = group.sizes[j];
        if (!sizeObj.size || !sizeObj.size.trim()) {
          toast.error(`Size value is mandatory for all variants in "${colorName}". Please fill in size #${j + 1}.`);
          setActiveTab('variants');
          return;
        }
      }
    }

    const flattenedVariants = flattenVariants(formData.colorGroups, formData.name, formData.globalBarcode);

    const dataToSubmit = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      brandId: formData.brandId === 'none' || !formData.brandId ? null : formData.brandId,
      categoryId: formData.categoryId === 'none' || !formData.categoryId ? null : formData.categoryId,
      subCategoryId: formData.subCategoryId === 'none' || !formData.subCategoryId ? null : formData.subCategoryId,
      fit: formData.fit?.trim() || null,
      tag: formData.tag?.trim() || null,
      thumbnail: formData.thumbnail?.trim() || null,
      shortDescription: formData.shortDescription?.trim() || null,
      description: formData.description?.trim() || null,
      seoTitle: formData.seoTitle?.trim() || null,
      seoDescription: formData.seoDescription?.trim() || null,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      variants: flattenedVariants,
    };

    if (editProduct) {
      updateProduct({ id: editProduct.id, data: dataToSubmit }, {
        onSuccess: () => {
          setIsAddOpen(false);
          toast.success('Product updated successfully!');
        }
      });
    } else {
      createProduct(dataToSubmit, {
        onSuccess: () => {
          setIsAddOpen(false);
          toast.success('Product created successfully!');
        }
      });
    }
  };

  // Variant Helpers
  const addColorGroup = () => {
    const newGroupId = Math.random().toString();
    const newGroup: ColorGroup = {
      id: newGroupId,
      color: '',
      images: [],
      isDefault: formData.colorGroups.length === 0,
      sizes: [
        {
          id: Math.random().toString(),
          size: '',
          price: 0,
          comparePrice: null,
          costPrice: null,
          stock: 0,
          lowStockThreshold: 10,
          sku: `SKU-${Math.floor(Math.random() * 10000)}`,
          weight: null,
          isActive: true
        }
      ]
    };

    setFormData(prev => ({
      ...prev,
      colorGroups: [...prev.colorGroups, newGroup]
    }));

    if (!selectedMediaColorId) {
      setSelectedMediaColorId(newGroupId);
    }
  };

  const removeColorGroup = (id: string) => {
    const remaining = formData.colorGroups.filter(g => g.id !== id);
    setFormData(prev => ({
      ...prev,
      colorGroups: remaining
    }));

    if (selectedMediaColorId === id) {
      setSelectedMediaColorId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const updateColorGroup = (id: string, field: keyof ColorGroup, value: any) => {
    if (field === 'isDefault' && value === true) {
      setFormData(prev => ({
        ...prev,
        colorGroups: prev.colorGroups.map(g => ({ ...g, isDefault: g.id === id }))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        colorGroups: prev.colorGroups.map(g => g.id === id ? { ...g, [field]: value } : g)
      }));
    }
  };

  const addSize = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      colorGroups: prev.colorGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            sizes: [
              ...g.sizes,
              {
                id: Math.random().toString(),
                size: '',
                price: g.sizes[0]?.price || 0,
                comparePrice: g.sizes[0]?.comparePrice || null,
                costPrice: g.sizes[0]?.costPrice || null,
                stock: 0,
                lowStockThreshold: 10,
                sku: `SKU-${Math.floor(Math.random() * 10000)}`,
                weight: null,
                isActive: true
              }
            ]
          };
        }
        return g;
      })
    }));
  };

  const removeSize = (groupId: string, sizeId: string) => {
    setFormData(prev => ({
      ...prev,
      colorGroups: prev.colorGroups.map(g => {
        if (g.id === groupId) {
          return { ...g, sizes: g.sizes.filter(s => s.id !== sizeId) };
        }
        return g;
      })
    }));
  };

  const updateSize = (groupId: string, sizeId: string, field: keyof SizeVariant, value: any) => {
    const finalValue = field === 'size' && typeof value === 'string' ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      colorGroups: prev.colorGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            sizes: g.sizes.map(s => s.id === sizeId ? { ...s, [field]: finalValue } : s)
          };
        }
        return g;
      })
    }));
  };

  // Media Helpers & Drag Reordering
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  const reorderImagesInGroup = (groupId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setFormData(prev => ({
      ...prev,
      colorGroups: prev.colorGroups.map(g => {
        if (g.id === groupId) {
          const updated = [...g.images];
          if (toIndex >= updated.length) return g;
          const [moved] = updated.splice(fromIndex, 1);
          updated.splice(toIndex, 0, moved);
          return { ...g, images: updated };
        }
        return g;
      })
    }));
    toast.success('Image reordered successfully');
  };

  const addImageToGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      colorGroups: prev.colorGroups.map(g => {
        if (g.id === groupId && g.images.length < 10) {
          return { ...g, images: [...g.images, ''] };
        }
        return g;
      })
    }));
  };

  const updateImageInGroup = (groupId: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      colorGroups: prev.colorGroups.map(g => {
        if (g.id === groupId) {
          const newImages = [...g.images];
          newImages[index] = value;
          return { ...g, images: newImages };
        }
        return g;
      })
    }));
  };

  const removeImageFromGroup = (groupId: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      colorGroups: prev.colorGroups.map(g => {
        if (g.id === groupId) {
          const newImages = g.images.filter((_, i) => i !== index);
          return { ...g, images: newImages };
        }
        return g;
      })
    }));
    toast.success('Image removed');
  };

  // Selected media color group
  const selectedColorGroup = useMemo(() => {
    if (!selectedMediaColorId && formData.colorGroups.length > 0) {
      return formData.colorGroups[0];
    }
    return formData.colorGroups.find(g => g.id === selectedMediaColorId) || formData.colorGroups[0] || null;
  }, [formData.colorGroups, selectedMediaColorId]);

  // Filtering and Pagination
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
                          || (statusFilter === 'active' && product.isActive)
                          || (statusFilter === 'draft' && !product.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store&apos;s apparel, variants, pricing, media, and inventory.
          </p>
        </div>
        <Button className="gap-2 shadow-sm" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products by name or slug..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select 
            value={statusFilter} 
            onValueChange={(val) => {
              if (val) setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Fit / Tag</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading products...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  No products found. {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first product!'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product: Product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenView(product)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <div className="h-10 w-10 rounded-md border overflow-hidden bg-muted shrink-0">
                          <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">No img</div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.slug}</p>
                        {product.isFeatured && <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Featured</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {product.fit && <span className="inline-block bg-secondary text-secondary-foreground px-2 py-0.5 rounded mr-1 font-semibold">{product.fit}</span>}
                      {product.tag && <span className="inline-block bg-[#D2925D] text-white px-2 py-0.5 rounded font-bold uppercase">{product.tag}</span>}
                      {!product.fit && !product.tag && <span className="text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {brands.find(b => b.id === product.brandId)?.name || '-'}
                  </TableCell>
                  <TableCell>{product.salesCount}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {product.isActive ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenView(product); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(product); }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this product?')) {
                              deleteProduct(product.id);
                            }
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredProducts.length > itemsPerPage && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* VIEW PRODUCT DETAILS DIALOG */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[850px] max-h-[92vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 px-6 py-4 overflow-y-auto max-h-[calc(92vh-130px)]">
            {viewProduct && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {viewProduct.thumbnail ? (
                    <div className="w-44 h-44 shrink-0 border rounded-xl overflow-hidden bg-muted">
                      <img src={viewProduct.thumbnail} alt={viewProduct.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-44 h-44 shrink-0 border rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-bold">{viewProduct.name}</h2>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Slug: <strong className="text-foreground">{viewProduct.slug}</strong></span>
                      <span>Brand: <strong className="text-foreground">{brands.find(b => b.id === viewProduct.brandId)?.name || 'None'}</strong></span>
                      <span>Category: <strong className="text-foreground">{categories.find(c => c.id === viewProduct.categoryId)?.name || 'None'}</strong></span>
                      <span>SubCategory: <strong className="text-foreground">{categories.find(c => c.id === viewProduct.subCategoryId)?.name || 'None'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {viewProduct.fit && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground border">
                          Fit: {viewProduct.fit}
                        </span>
                      )}
                      {viewProduct.tag && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-[#D2925D] text-white">
                          Tag: {viewProduct.tag}
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${viewProduct.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {viewProduct.isActive ? 'Active' : 'Draft'}
                      </span>
                      {viewProduct.isFeatured && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                          Featured
                        </span>
                      )}
                    </div>
                    {viewProduct.shortDescription && (
                      <p className="pt-2 text-xs text-muted-foreground leading-relaxed">{viewProduct.shortDescription}</p>
                    )}
                  </div>
                </div>

                {viewProduct.description && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Description</h3>
                    <div className="text-xs bg-muted/20 p-4 rounded-lg border whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {viewProduct.description}
                    </div>
                  </div>
                )}

                {/* SEO Information */}
                {(viewProduct.seoTitle || viewProduct.seoDescription) && (
                  <div className="border rounded-lg p-4 bg-muted/10 space-y-2">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Search Engine Optimization (SEO)
                    </h3>
                    {viewProduct.seoTitle && <p className="text-xs"><strong>SEO Title:</strong> {viewProduct.seoTitle}</p>}
                    {viewProduct.seoDescription && <p className="text-xs text-muted-foreground"><strong>SEO Description:</strong> {viewProduct.seoDescription}</p>}
                  </div>
                )}

                {/* Variants table */}
                {viewProduct.variants && viewProduct.variants.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Variants ({viewProduct.variants.length})</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="text-xs">
                            <TableHead>SKU</TableHead>
                            <TableHead>Barcode</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Images</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewProduct.variants.map((v, idx) => (
                            <TableRow key={idx} className="text-xs">
                              <TableCell className="font-mono font-medium">{v.sku}</TableCell>
                              <TableCell className="font-mono">{v.barcode || '-'}</TableCell>
                              <TableCell className="font-semibold">{v.color}</TableCell>
                              <TableCell><span className="inline-block px-1.5 py-0.5 bg-muted rounded font-bold">{v.size || '-'}</span></TableCell>
                              <TableCell>₹{v.price}</TableCell>
                              <TableCell>{v.stock}</TableCell>
                              <TableCell>
                                {v.images && v.images.length > 0 ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "h-6 text-xs px-2" })}>
                                      View ({v.images.length})
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="p-2 w-64">
                                      <div className="grid grid-cols-2 gap-2">
                                        {v.images.map((img, i) => (
                                          <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted border">
                                            <img src={img} alt={`${v.color} - ${i}`} className="w-full h-full object-cover" />
                                          </div>
                                        ))}
                                      </div>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 p-3.5 border-t bg-muted/10 shrink-0 mt-auto">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            <Button onClick={() => {
              setIsViewOpen(false);
              if (viewProduct) handleOpenEdit(viewProduct);
            }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT PRODUCT DIALOG WITH ALL TABS */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[950px] max-h-[92vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-5 pb-2 shrink-0">
            <DialogTitle className="text-xl font-bold">{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editProduct ? 'Update product details, fits, promotions, variants, media, and SEO.' : 'Create a new apparel product with automated slug, custom fit/tags, variants, and bulk media.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="px-6 border-b flex flex-wrap gap-2 shrink-0 bg-muted/10">
                <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0 overflow-x-auto">
                  <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-medium">General</TabsTrigger>
                  <TabsTrigger value="attributes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-medium">Fit & Promotion</TabsTrigger>
                  <TabsTrigger value="variants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-medium">Variants (Colors & Sizes) *</TabsTrigger>
                  <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-medium">Media Gallery</TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-medium">Settings</TabsTrigger>
                  <TabsTrigger value="seo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 font-medium">SEO & Preview</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 min-h-0 max-h-[calc(92vh-190px)] overflow-y-auto">
                {/* GENERAL TAB */}
                <TabsContent value="general" className="space-y-4 m-0 px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        placeholder="e.g. Classic Oxford Cotton Shirt"
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
                        <button
                          type="button"
                          onClick={handleSyncSlug}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1"
                          title="Generate slug automatically from product name"
                        >
                          <RefreshCw className="h-3 w-3" /> Auto-fill from Name
                        </button>
                      </div>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => {
                          setIsSlugManual(true);
                          setFormData({ ...formData, slug: e.target.value });
                        }}
                        required
                        placeholder="e.g. classic-oxford-cotton-shirt"
                      />
                      <p className="text-[11px] text-muted-foreground">Used for product URL. Automatically filled as you type product name.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brandId">Brand</Label>
                      <Select value={formData.brandId} onValueChange={(val) => setFormData({ ...formData, brandId: val || 'none' })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select brand">
                            {formData.brandId && formData.brandId !== 'none' ? brands.find(b => b.id === formData.brandId)?.name : ''}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Brand</SelectItem>
                          {brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="categoryId">Main Category</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(val) => setFormData({ ...formData, categoryId: val || 'none', subCategoryId: 'none' })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category">
                            {formData.categoryId && formData.categoryId !== 'none' ? (parentCategories.length > 0 ? parentCategories : categories).find(c => c.id === formData.categoryId)?.name : ''}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {(parentCategories.length > 0 ? parentCategories : categories).map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="subCategoryId">SubCategory</Label>
                      <Select 
                        value={formData.subCategoryId} 
                        onValueChange={(val) => setFormData({ ...formData, subCategoryId: val || 'none' })}
                        disabled={formData.categoryId === 'none' || availableSubCategories.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={availableSubCategories.length ? "Select subcategory" : "No subcategories"}>
                            {formData.subCategoryId && formData.subCategoryId !== 'none' ? availableSubCategories.find(c => c.id === formData.subCategoryId)?.name : ''}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {availableSubCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Barcode & Thumbnail Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="globalBarcode" className="flex items-center gap-1.5">
                        <Barcode className="h-4 w-4 text-muted-foreground" /> Global Barcode
                      </Label>
                      <div className="relative">
                        <Input
                          id="globalBarcode"
                          value={formData.globalBarcode}
                          onChange={(e) => setFormData({ ...formData, globalBarcode: e.target.value })}
                          placeholder="e.g. 8901234567890"
                        />
                        {isCheckingBarcode && (
                          <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Applies across all variants. Existing barcodes are automatically checked.</p>

                      {/* Existing Barcode Warning / Details Card */}
                      {existingBarcodeProduct && (
                        <div className="mt-2 border border-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 space-y-2 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-300">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold">Existing Product Found with Barcode &ldquo;{formData.globalBarcode}&rdquo;:</p>
                              <div className="flex items-center gap-3 mt-2">
                                {existingBarcodeProduct.thumbnail && (
                                  <img src={existingBarcodeProduct.thumbnail} alt="" className="w-10 h-10 object-cover rounded border" />
                                )}
                                <div>
                                  <p className="font-bold">{existingBarcodeProduct.name}</p>
                                  <p className="text-[11px] opacity-80">Slug: {existingBarcodeProduct.slug} | Variants: {existingBarcodeProduct.variants?.length || 0}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-white dark:bg-neutral-900 border-amber-300"
                                  onClick={() => handleOpenView(existingBarcodeProduct)}
                                >
                                  <Eye className="h-3 w-3 mr-1" /> View Details
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-xs"
                                  onClick={() => handleOpenEdit(existingBarcodeProduct)}
                                >
                                  <Pencil className="h-3 w-3 mr-1" /> Load & Edit This Product
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="thumbnail">Thumbnail Image</Label>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <div className="relative">
                          <input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleOpenCropperForFile(file, { type: 'thumbnail' });
                              }
                              e.target.value = '';
                            }}
                            disabled={isUploading}
                          />
                          <Button type="button" variant="outline" className="pointer-events-none text-xs h-9">
                            <Crop className="h-3.5 w-3.5 mr-1.5" />
                            {formData.thumbnail ? 'Crop & Change' : 'Upload & Crop'}
                          </Button>
                        </div>

                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => handleImageUpload(e, (url) => setFormData({ ...formData, thumbnail: url }))}
                            disabled={isUploading}
                          />
                          <Button type="button" variant="ghost" className="pointer-events-none text-xs h-9">
                            <Upload className="h-3.5 w-3.5 mr-1.5" /> Direct Upload
                          </Button>
                        </div>

                        {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>

                      {formData.thumbnail && (
                        <div className="mt-2 flex items-center gap-3 border rounded-lg p-2 bg-muted/20 w-fit">
                          <img src={formData.thumbnail} alt="Preview" className="h-12 w-12 object-cover rounded border bg-background" />
                          <div className="text-xs">
                            <p className="font-semibold text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Thumbnail set</p>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, thumbnail: '' })}
                              className="text-destructive hover:underline text-[11px]"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Descriptions */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shortDescription">Short Description <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                    </div>
                    <Textarea
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="A quick summary for product cards & listing highlights..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Full Description <span className="text-xs text-muted-foreground font-normal">(Optional)</span></Label>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed product information, material, wash care, size chart details..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* ATTRIBUTES TAB (FIT & PROMOTIONS WITH CUSTOM WRITE-IN) */}
                <TabsContent value="attributes" className="space-y-6 m-0 px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Apparel Fit Type with Custom input */}
                    <div className="space-y-3 p-4 border rounded-xl bg-card">
                      <div className="space-y-1">
                        <Label htmlFor="fit" className="font-semibold">Apparel Fit Type</Label>
                        <p className="text-xs text-muted-foreground">Select a standard fit or type your own custom fit description.</p>
                      </div>

                      <Input
                        id="fit"
                        value={formData.fit}
                        onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                        placeholder="e.g. Slim Fit, Oversized, Athletic Tapered..."
                      />

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Presets:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_FITS.map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setFormData({ ...formData, fit: f })}
                              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${formData.fit === f ? 'bg-primary text-primary-foreground font-bold border-primary' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
                            >
                              {f}
                            </button>
                          ))}
                          {formData.fit && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, fit: '' })}
                              className="text-xs px-2 py-1 text-destructive hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Promotion Tag / Badge with Custom input */}
                    <div className="space-y-3 p-4 border rounded-xl bg-card">
                      <div className="space-y-1">
                        <Label htmlFor="tag" className="font-semibold">Promotion Tag / Badge</Label>
                        <p className="text-xs text-muted-foreground">Highlight product with a badge (e.g. NEW, LIMITED, SALE, or custom).</p>
                      </div>

                      <Input
                        id="tag"
                        value={formData.tag}
                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                        placeholder="e.g. NEW, LIMITED, 20% OFF, FESTIVE..."
                      />

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Badges:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_PROMOTIONS.map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData({ ...formData, tag: t })}
                              className={`text-xs px-2.5 py-1 rounded-md border transition-colors font-bold ${formData.tag === t ? 'bg-[#D2925D] text-white border-[#D2925D]' : 'bg-muted/50 hover:bg-muted text-foreground'}`}
                            >
                              {t}
                            </button>
                          ))}
                          {formData.tag && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, tag: '' })}
                              className="text-xs px-2 py-1 text-destructive hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* VARIANTS TAB (COLORS & MANDATORY SIZES) */}
                <TabsContent value="variants" className="space-y-6 m-0 px-6 py-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-primary" /> Product Color & Size Variants
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Each color variant <strong>must have at least one size</strong>. You cannot save a color without assigning size variants.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addColorGroup}>
                      <Plus className="h-4 w-4 mr-1.5" /> Add Color Group
                    </Button>
                  </div>

                  {formData.colorGroups.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20 space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">No color variants added yet.</p>
                      <p className="text-xs text-muted-foreground">Add colors first (e.g. Navy Blue, Black, Olive) and define sizes for each color.</p>
                      <Button type="button" variant="default" size="sm" onClick={addColorGroup}>
                        <Plus className="h-4 w-4 mr-1.5" /> Add First Color Variant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.colorGroups.map((group, groupIndex) => (
                        <div key={group.id} className="border-2 rounded-xl p-4 bg-card space-y-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 bg-muted/20 -mx-4 -mt-4 p-4 rounded-t-xl">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                {groupIndex + 1}
                              </span>
                              <div className="grid gap-1">
                                <Label className="text-xs font-semibold">Color Name <span className="text-red-500">*</span></Label>
                                <Input
                                  placeholder="e.g. Navy Blue, Jet Black, Forest Green"
                                  value={group.color}
                                  onChange={(e) => updateColorGroup(group.id, 'color', e.target.value)}
                                  className="w-64 font-semibold text-sm h-8"
                                  required
                                />
                              </div>
                              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer mt-4">
                                <input
                                  type="radio"
                                  name="defaultColor"
                                  checked={group.isDefault}
                                  onChange={() => updateColorGroup(group.id, 'isDefault', true)}
                                />
                                Default Color
                              </label>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 h-8 self-end sm:self-center"
                              onClick={() => removeColorGroup(group.id)}
                            >
                              <Trash className="h-4 w-4 mr-1" /> Remove Color
                            </Button>
                          </div>

                          {/* Sizes Table for this Color */}
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                  Sizes for &ldquo;{group.color || 'Unnamed Color'}&rdquo; <span className="text-red-500">* (Mandatory)</span>
                                </h4>
                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-mono font-semibold">
                                  {group.sizes.length} size(s)
                                </span>
                              </div>
                              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => addSize(group.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Size to {group.color || 'Color'}
                              </Button>
                            </div>

                            {group.sizes.length === 0 ? (
                              <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
                                <p className="text-xs font-semibold text-destructive">
                                  ⚠️ Size is mandatory for this color! You must add at least one size (e.g. S, M, L, 32).
                                </p>
                                <Button type="button" size="sm" variant="destructive" className="h-7 text-xs mt-2" onClick={() => addSize(group.id)}>
                                  <Plus className="h-3 w-3 mr-1" /> Add Size Now
                                </Button>
                              </div>
                            ) : (
                              <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                  <TableHeader className="bg-muted/50">
                                    <TableRow className="text-xs">
                                      <TableHead className="w-[120px]">Size <span className="text-red-500">*</span></TableHead>
                                      <TableHead className="w-[120px]">Price (₹) *</TableHead>
                                      <TableHead className="w-[120px]">Compare Price</TableHead>
                                      <TableHead className="w-[120px]">Cost Price</TableHead>
                                      <TableHead className="w-[100px]">Stock *</TableHead>
                                      <TableHead className="w-[140px]">SKU</TableHead>
                                      <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.sizes.map((s, sIdx) => (
                                      <TableRow key={s.id}>
                                        <TableCell>
                                          <div className="space-y-1">
                                            <Input
                                              value={s.size}
                                              onChange={(e) => updateSize(group.id, s.id, 'size', e.target.value.toUpperCase())}
                                              placeholder="S, M, 32, etc."
                                              className={`h-8 text-xs font-bold uppercase tracking-wider ${!s.size.trim() ? 'border-red-400 bg-red-50/50' : ''}`}
                                              required
                                            />
                                            <div className="flex flex-wrap gap-1">
                                              {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'FREE SIZE'].map((quickSize) => (
                                                <button
                                                  key={quickSize}
                                                  type="button"
                                                  onClick={() => updateSize(group.id, s.id, 'size', quickSize)}
                                                  className={`text-[9px] px-1 py-0.2 rounded border font-semibold transition-colors ${s.size === quickSize ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
                                                >
                                                  {quickSize}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.price || ''}
                                            onChange={(e) => updateSize(group.id, s.id, 'price', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-xs font-semibold"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.comparePrice ?? ''}
                                            onChange={(e) => updateSize(group.id, s.id, 'comparePrice', e.target.value ? parseFloat(e.target.value) : null)}
                                            className="h-8 text-xs"
                                            placeholder="Optional"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.costPrice ?? ''}
                                            onChange={(e) => updateSize(group.id, s.id, 'costPrice', e.target.value ? parseFloat(e.target.value) : null)}
                                            className="h-8 text-xs"
                                            placeholder="Optional"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.stock}
                                            onChange={(e) => updateSize(group.id, s.id, 'stock', parseInt(e.target.value) || 0)}
                                            className="h-8 text-xs font-semibold"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={s.sku}
                                            onChange={(e) => updateSize(group.id, s.id, 'sku', e.target.value)}
                                            className="h-8 text-xs font-mono"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => removeSize(group.id, s.id)}
                                            disabled={group.sizes.length === 1}
                                            title={group.sizes.length === 1 ? "At least one size is required for this color" : "Remove size"}
                                          >
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* MEDIA TAB (SHOWS COLOR NAME INSTEAD OF ID + BULK UPLOAD + CROPPING) */}
                <TabsContent value="media" className="space-y-6 m-0 px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <Images className="h-4 w-4 text-primary" /> Color Variant Gallery
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Upload single or bulk images for each color. Crop and preview images directly in the browser.
                      </p>
                    </div>
                  </div>

                  {formData.colorGroups.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20 space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">You need to add at least one color variant first.</p>
                      <Button type="button" variant="outline" onClick={() => setActiveTab('variants')}>
                        <Layers className="h-4 w-4 mr-1.5" /> Go to Variants Tab
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Color Selector Pills displaying Color Names */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Color Variant</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.colorGroups.map((g) => {
                            const isSelected = (selectedColorGroup?.id === g.id);
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => setSelectedMediaColorId(g.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card hover:bg-muted text-foreground'}`}
                              >
                                <span className="h-3 w-3 rounded-full border border-white/40 bg-current shrink-0" />
                                <span>{g.color || 'Unnamed Color'}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-muted'}`}>
                                  {g.images.filter(img => img.trim() !== '').length}/10
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active Color Media Manager */}
                      {selectedColorGroup && (
                        <div className="border rounded-xl p-5 bg-card space-y-5 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                            <div>
                              <h4 className="font-bold text-sm flex items-center gap-2">
                                Images for <span className="underline decoration-primary decoration-2">{selectedColorGroup.color || 'Unnamed Color'}</span>
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {selectedColorGroup.images.filter(i => i.trim() !== '').length} of 10 maximum images uploaded
                              </p>
                            </div>

                            {/* Bulk Upload Button */}
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  onChange={(e) => handleBulkImageUpload(e, selectedColorGroup.id)}
                                  disabled={isBulkUploading || isUploading || selectedColorGroup.images.length >= 10}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="pointer-events-none text-xs h-8"
                                  disabled={selectedColorGroup.images.length >= 10}
                                >
                                  {isBulkUploading ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...</>
                                  ) : (
                                    <><Images className="h-3.5 w-3.5 mr-1.5" /> Bulk Upload Images</>
                                  )}
                                </Button>
                              </div>

                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => addImageToGroup(selectedColorGroup.id)}
                                disabled={selectedColorGroup.images.length >= 10}
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add Image Slot
                              </Button>
                            </div>
                          </div>

                          {/* Image Grid with Drag & Drop Reordering (No Raw Cloudinary URLs) */}
                          {selectedColorGroup.images.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10 space-y-3">
                              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                              <div className="space-y-1">
                                <p className="text-sm font-semibold">No images added for {selectedColorGroup.color || 'this color'}</p>
                                <p className="text-xs text-muted-foreground">Select one or multiple images to build the product gallery.</p>
                              </div>
                              <div className="flex justify-center gap-2 pt-2">
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => handleBulkImageUpload(e, selectedColorGroup.id)}
                                  />
                                  <Button type="button" size="sm" variant="default" className="pointer-events-none text-xs">
                                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Images
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <GripVertical className="h-4 w-4" /> Drag cards or use arrows &larr; &rarr; to reorder. First image is the cover photo.
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {selectedColorGroup.images.map((img, index) => {
                                  const isCover = index === 0;
                                  const isDragging = draggedImageIndex === index;

                                  return (
                                    <div
                                      key={index}
                                      draggable={true}
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', index.toString());
                                        setDraggedImageIndex(index);
                                      }}
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedImageIndex !== null) {
                                          reorderImagesInGroup(selectedColorGroup.id, draggedImageIndex, index);
                                          setDraggedImageIndex(null);
                                        }
                                      }}
                                      onDragEnd={() => setDraggedImageIndex(null)}
                                      className={`group relative flex flex-col border-2 rounded-xl overflow-hidden bg-card transition-all duration-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing ${
                                        isDragging ? 'opacity-40 scale-95 border-primary border-dashed' : isCover ? 'border-primary/80 ring-1 ring-primary/30' : 'border-border'
                                      }`}
                                    >
                                      {/* Top Status Header */}
                                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/40 border-b text-[11px]">
                                        <div className="flex items-center gap-1">
                                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                          {isCover ? (
                                            <span className="font-bold text-primary flex items-center gap-1 text-[11px]">
                                              <Star className="h-3 w-3 fill-primary text-primary" /> Cover Photo
                                            </span>
                                          ) : (
                                            <span className="font-semibold text-muted-foreground">
                                              #{index + 1}
                                            </span>
                                          )}
                                        </div>

                                        {/* Reorder Arrows */}
                                        <div className="flex items-center gap-0.5">
                                          <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => reorderImagesInGroup(selectedColorGroup.id, index, index - 1)}
                                            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground"
                                            title="Move Left"
                                          >
                                            <ArrowLeft className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={index === selectedColorGroup.images.length - 1}
                                            onClick={() => reorderImagesInGroup(selectedColorGroup.id, index, index + 1)}
                                            className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground"
                                            title="Move Right"
                                          >
                                            <ArrowRight className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Image Display */}
                                      <div className="relative aspect-[3/4] w-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                                        {img ? (
                                          <img
                                            src={img}
                                            alt={`Image ${index + 1}`}
                                            className="w-full h-full object-cover select-none pointer-events-none"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                          />
                                        ) : (
                                          <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs p-4 text-center">
                                            <ImageIcon className="h-8 w-8 opacity-40" />
                                            <span>Empty image slot</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Action Buttons Bar */}
                                      <div className="p-2 bg-muted/20 border-t flex items-center justify-between gap-1">
                                        {/* Crop */}
                                        <div className="relative flex-1">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                handleOpenCropperForFile(file, { type: 'variant-single', groupId: selectedColorGroup.id, index });
                                              }
                                              e.target.value = '';
                                            }}
                                          />
                                          <Button type="button" variant="outline" size="sm" className="w-full pointer-events-none h-7 text-[11px] px-1.5">
                                            <Crop className="h-3 w-3 mr-1" /> Crop
                                          </Button>
                                        </div>

                                        {/* Replace */}
                                        <div className="relative flex-1">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => handleImageUpload(e, (url) => updateImageInGroup(selectedColorGroup.id, index, url))}
                                            disabled={isUploading}
                                          />
                                          <Button type="button" variant="ghost" size="sm" className="w-full pointer-events-none h-7 text-[11px] px-1.5 border border-transparent hover:border-border">
                                            <Upload className="h-3 w-3 mr-1" /> Replace
                                          </Button>
                                        </div>

                                        {/* Delete */}
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive hover:bg-destructive/10 h-7 w-7 shrink-0"
                                          onClick={() => removeImageFromGroup(selectedColorGroup.id, index)}
                                          title="Delete image"
                                        >
                                          <Trash className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Add Next Image Card Slot */}
                                {selectedColorGroup.images.length < 10 && (
                                  <div className="border-2 border-dashed rounded-xl aspect-[3/4] flex flex-col items-center justify-center p-4 text-center hover:bg-muted/30 transition-colors relative group">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      onChange={(e) => handleBulkImageUpload(e, selectedColorGroup.id)}
                                    />
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform mb-2">
                                      <Plus className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-semibold">Add Image</span>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">Click or drop image</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="space-y-6 m-0 px-6 py-4">
                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Active Status</Label>
                      <p className="text-xs text-muted-foreground">
                        When active, product is published and purchasable by customers.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Featured Product</Label>
                      <p className="text-xs text-muted-foreground">
                        Display this product prominently on home page hero sections and featured shelves.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                    />
                  </div>
                </TabsContent>

                {/* SEO TAB WITH LIVE GOOGLE SEARCH PREVIEW */}
                <TabsContent value="seo" className="space-y-6 m-0 px-6 py-4">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="seoTitle" className="font-semibold">SEO Meta Title</Label>
                        <span className={`text-[11px] font-mono ${formData.seoTitle.length > 60 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          {formData.seoTitle.length} / 60 characters
                        </span>
                      </div>
                      <Input
                        id="seoTitle"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                        placeholder={formData.name || 'e.g. Buy Premium Oxford Cotton Shirt Online | YOX'}
                      />
                      <p className="text-[11px] text-muted-foreground">Defaults to Product Name if left blank.</p>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="seoDescription" className="font-semibold">SEO Meta Description</Label>
                        <span className={`text-[11px] font-mono ${formData.seoDescription.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          {formData.seoDescription.length} / 160 characters
                        </span>
                      </div>
                      <Textarea
                        id="seoDescription"
                        rows={3}
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                        placeholder={formData.shortDescription || 'Shop the highest quality tailored clothing at YOX. Free shipping on all orders...'}
                      />
                      <p className="text-[11px] text-muted-foreground">Displayed as the summary snippet under Google search results.</p>
                    </div>

                    {/* Google Search Result Live Preview Card */}
                    <div className="border rounded-xl p-4 bg-muted/10 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ExternalLink className="h-3 w-3" /> Live Google Search Result Preview
                      </span>
                      <div className="bg-card border rounded-lg p-4 font-sans space-y-1 shadow-sm">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">https://yox.com</span>
                          <span>›</span>
                          <span>product</span>
                          <span>›</span>
                          <span className="font-mono">{formData.slug || 'product-slug'}</span>
                        </div>
                        <h4 className="text-blue-700 dark:text-blue-400 font-semibold text-base hover:underline cursor-pointer line-clamp-1">
                          {formData.seoTitle || formData.name || 'Product Title | YOX Apparel'}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {formData.seoDescription || formData.shortDescription || formData.description || 'Explore premium essentials, modern apparel, and bespoke fits curated for contemporary lifestyles at YOX.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>

              {/* Form Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t bg-muted/20 shrink-0 mt-auto">
                <div className="text-xs text-muted-foreground">
                  {formData.colorGroups.length} Color(s) &bull; {formData.colorGroups.reduce((acc, g) => acc + g.sizes.length, 0)} Size Variant(s)
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating || isUpdating} className="gap-2 shadow-sm">
                    {isCreating || isUpdating ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      'Save Product'
                    )}
                  </Button>
                </div>
              </div>
            </Tabs>
          </form>
        </DialogContent>
      </Dialog>

      {/* REUSABLE IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setCropSource(null);
          setCropTarget(null);
        }}
        imageSource={cropSource}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
