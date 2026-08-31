'use client';

import { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash, X, Image as ImageIcon, Loader2, Eye, Search, Upload } from 'lucide-react';
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
    fit: 'none',
    tag: 'none',
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

  // Available subcategories based on selected parent categoryId
  const availableSubCategories = useMemo(() => {
    if (formData.categoryId === 'none') return [];
    return categories.filter(c => (c as any).parentCategoryId === formData.categoryId);
  }, [categories, formData.categoryId]);

  // Group flat variants into ColorGroups
  const groupByColor = (variants: Omit<ProductVariant, 'id'>[]): ColorGroup[] => {
    const groups = new Map<string, ColorGroup>();

    variants.forEach(v => {
      if (!groups.has(v.color)) {
        groups.set(v.color, {
          id: Math.random().toString(),
          color: v.color,
          images: v.images || [],
          isDefault: v.isDefault || false,
          sizes: []
        });
      }

      const group = groups.get(v.color)!;
      if (v.isDefault) group.isDefault = true;

      group.sizes.push({
        id: Math.random().toString(),
        size: v.size || '',
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
      group.sizes.map((size, index) => ({
        title: `${productName} - ${group.color} - ${size.size}`,
        sku: size.sku,
        color: group.color,
        price: size.price,
        comparePrice: size.comparePrice,
        costPrice: size.costPrice,
        stock: size.stock,
        lowStockThreshold: size.lowStockThreshold,
        weight: size.weight,
        images: group.images.filter(img => img.trim() !== ''),
        isDefault: group.isDefault && index === 0,
        isActive: size.isActive,
        size: size.size?.trim() || null,
        barcode: globalBarcode?.trim() || null,
      }))
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadApi.uploadImage(file);
      callback(url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleOpenAdd = () => {
    setFormData(defaultForm);
    setEditProduct(null);
    setActiveTab("general");
    setSelectedMediaColorId('');
    setIsAddOpen(true);
  };

  const handleOpenView = async (product: Product) => {
    try {
      const fullProduct = await productApi.getById(product.id);
      setViewProduct(fullProduct);
      setIsViewOpen(true);
    } catch (error) {
      console.error("Failed to fetch full product details:", error);
    }
  };

  const handleOpenEdit = async (product: Product) => {
    try {
      const fullProduct = await productApi.getById(product.id);
      const grouped = fullProduct.variants ? groupByColor(fullProduct.variants) : [];

      setFormData({
        name: fullProduct.name,
        slug: fullProduct.slug,
        categoryId: fullProduct.categoryId || 'none',
        subCategoryId: fullProduct.subCategoryId || 'none',
        brandId: fullProduct.brandId || 'none',
        fit: fullProduct.fit || 'none',
        tag: fullProduct.tag || 'none',
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
      setActiveTab("general");
      setSelectedMediaColorId(grouped.length > 0 ? grouped[0].id : '');
      setIsAddOpen(true);
    } catch (error) {
      console.error("Failed to fetch full product details:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const flattenedVariants = flattenVariants(formData.colorGroups, formData.name, formData.globalBarcode);

    const dataToSubmit = {
      ...formData,
      brandId: formData.brandId === 'none' ? null : formData.brandId,
      categoryId: formData.categoryId === 'none' ? null : formData.categoryId,
      subCategoryId: formData.subCategoryId === 'none' ? null : formData.subCategoryId,
      fit: formData.fit === 'none' ? null : formData.fit,
      tag: formData.tag === 'none' ? null : formData.tag,
      thumbnail: formData.thumbnail?.trim() || null,
      shortDescription: formData.shortDescription?.trim() || null,
      description: formData.description?.trim() || null,
      seoTitle: formData.seoTitle?.trim() || null,
      seoDescription: formData.seoDescription?.trim() || null,
      variants: flattenedVariants,
    };

    if (editProduct) {
      updateProduct({ id: editProduct.id, data: dataToSubmit }, {
        onSuccess: () => setIsAddOpen(false)
      });
    } else {
      createProduct(dataToSubmit, {
        onSuccess: () => setIsAddOpen(false)
      });
    }
  };

  // Variant Helpers
  const addColorGroup = () => {
    setFormData({
      ...formData,
      colorGroups: [
        ...formData.colorGroups,
        {
          id: Math.random().toString(),
          color: '',
          images: [],
          isDefault: formData.colorGroups.length === 0,
          sizes: []
        }
      ]
    });
  };

  const removeColorGroup = (id: string) => {
    setFormData({
      ...formData,
      colorGroups: formData.colorGroups.filter(g => g.id !== id)
    });
  };

  const updateColorGroup = (id: string, field: keyof ColorGroup, value: any) => {
    if (field === 'isDefault' && value === true) {
      setFormData({
        ...formData,
        colorGroups: formData.colorGroups.map(g => ({ ...g, isDefault: g.id === id }))
      });
    } else {
      setFormData({
        ...formData,
        colorGroups: formData.colorGroups.map(g => g.id === id ? { ...g, [field]: value } : g)
      });
    }
  };

  const addSize = (groupId: string) => {
    setFormData({
      ...formData,
      colorGroups: formData.colorGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            sizes: [
              ...g.sizes,
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
        }
        return g;
      })
    });
  };

  const removeSize = (groupId: string, sizeId: string) => {
    setFormData({
      ...formData,
      colorGroups: formData.colorGroups.map(g => {
        if (g.id === groupId) {
          return { ...g, sizes: g.sizes.filter(s => s.id !== sizeId) };
        }
        return g;
      })
    });
  };

  const updateSize = (groupId: string, sizeId: string, field: keyof SizeVariant, value: any) => {
    setFormData({
      ...formData,
      colorGroups: formData.colorGroups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            sizes: g.sizes.map(s => s.id === sizeId ? { ...s, [field]: value } : s)
          };
        }
        return g;
      })
    });
  };

  // Media Helpers
  const addImageToGroup = (groupId: string) => {
    setFormData({
      ...formData,
      colorGroups: formData.colorGroups.map(g => {
        if (g.id === groupId && g.images.length < 10) {
          return { ...g, images: [...g.images, ''] };
        }
        return g;
      })
    });
  };

  const updateImageInGroup = (groupId: string, index: number, value: string) => {
    setFormData({
      ...formData,
      colorGroups: formData.colorGroups.map(g => {
        if (g.id === groupId) {
          const newImages = [...g.images];
          newImages[index] = value;
          return { ...g, images: newImages };
        }
        return g;
      })
    });
  };

  const removeImageFromGroup = (groupId: string, index: number) => {
    setFormData({
      ...formData,
      colorGroups: formData.colorGroups.map(g => {
        if (g.id === groupId) {
          const newImages = g.images.filter((_, i) => i !== index);
          return { ...g, images: newImages };
        }
        return g;
      })
    });
  };

  const selectedColorGroup = formData.colorGroups.find(g => g.id === selectedMediaColorId);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store&apos;s apparel, variants, pricing, media, and inventory.
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
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
                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No products found. {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first product!'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product: Product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenView(product)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <div className="h-10 w-10 rounded-md border overflow-hidden bg-muted">
                          <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">No img</div>
                      )}
                      <div>
                        <p>{product.name}</p>
                        {product.isFeatured && <span className="text-[10px] uppercase tracking-wider text-primary font-bold">Featured</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {product.fit && <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded mr-1 font-semibold">{product.fit}</span>}
                      {product.tag && <span className="inline-block bg-[#D2925D] text-white px-2 py-0.5 rounded font-bold uppercase">{product.tag}</span>}
                      {!product.fit && !product.tag && <span className="text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {brands.find(b => b.id === product.brandId)?.name || '-'}
                  </TableCell>
                  <TableCell>{product.salesCount}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
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
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] px-6 py-4">
            {viewProduct && (
              <div className="space-y-6">
                <div className="flex gap-6">
                  {viewProduct.thumbnail ? (
                    <div className="w-40 h-40 shrink-0 border rounded-xl overflow-hidden bg-muted">
                      <img src={viewProduct.thumbnail} alt={viewProduct.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-40 h-40 shrink-0 border rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-bold">{viewProduct.name}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Slug: {viewProduct.slug}</span>
                      <span>Brand: {brands.find(b => b.id === viewProduct.brandId)?.name || 'None'}</span>
                      <span>Category: {categories.find(c => c.id === viewProduct.categoryId)?.name || 'None'}</span>
                      <span>SubCategory: {categories.find(c => c.id === viewProduct.subCategoryId)?.name || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {viewProduct.fit && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 border">
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
                    <p className="pt-2 text-sm">{viewProduct.shortDescription || 'No short description provided.'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div className="text-sm bg-muted/20 p-4 rounded-lg border whitespace-pre-wrap">
                    {viewProduct.description || 'No description provided.'}
                  </div>
                </div>

                {viewProduct.variants && viewProduct.variants.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Variants ({viewProduct.variants.length})</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Cost Price</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Images</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewProduct.variants.map((v, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium text-xs">{v.sku}</TableCell>
                              <TableCell>{v.color}</TableCell>
                              <TableCell>{v.size || '-'}</TableCell>
                              <TableCell>{v.costPrice ? `₹${v.costPrice}` : '-'}</TableCell>
                              <TableCell>₹{v.price}</TableCell>
                              <TableCell>{v.stock}</TableCell>
                              <TableCell>
                                {v.images && v.images.length > 0 ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 text-xs" })}>
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
          <div className="flex justify-end gap-2 p-4 border-t bg-muted/10">
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

      {/* ADD / EDIT PRODUCT FORM DIALOG WITH ALL TABS */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editProduct ? 'Update product details, fit type, tags, variants, and media.' : 'Create a new apparel product for your store.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 border-b flex flex-wrap gap-2">
                <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0 overflow-x-auto">
                  <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">General</TabsTrigger>
                  <TabsTrigger value="attributes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Fit & Promotion</TabsTrigger>
                  <TabsTrigger value="variants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Variants (Colors & Sizes)</TabsTrigger>
                  <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Media</TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Settings</TabsTrigger>
                  <TabsTrigger value="seo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">SEO</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[480px]">
                {/* GENERAL TAB */}
                <TabsContent value="general" className="space-y-4 m-0 px-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. Classic Oxford Shirt"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                        placeholder="e.g. classic-oxford-shirt"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="globalBarcode">Global Barcode</Label>
                      <Input
                        id="globalBarcode"
                        value={formData.globalBarcode}
                        onChange={(e) => setFormData({ ...formData, globalBarcode: e.target.value })}
                        placeholder="e.g. 123456789012"
                      />
                      <p className="text-xs text-muted-foreground">Applied to all variants automatically.</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="thumbnail">Thumbnail Image</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="relative">
                          <input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => handleImageUpload(e, (url) => setFormData({ ...formData, thumbnail: url }))}
                            disabled={isUploading}
                          />
                          <Button type="button" variant="outline" className="pointer-events-none">
                            <Upload className="h-4 w-4 mr-2" />
                            {formData.thumbnail ? 'Change Image' : 'Upload Image'}
                          </Button>
                        </div>
                        {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Upload a primary image for product listings.</p>
                    </div>
                  </div>

                  {formData.thumbnail && (
                    <div className="mt-2 border rounded-lg p-2 inline-block bg-muted/30">
                      <img src={formData.thumbnail} alt="Preview" className="max-h-[80px] object-contain rounded-md" onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x400?text=Invalid+Image'; }} />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Textarea
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="A quick summary for product cards..."
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed product information, specifications, fabric details..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* ATTRIBUTES TAB (FIT & PROMOTIONS) */}
                <TabsContent value="attributes" className="space-y-4 m-0 px-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fit">Apparel Fit Type</Label>
                      <Select value={formData.fit || 'none'} onValueChange={(val) => setFormData({ ...formData, fit: val === 'none' ? '' : val })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select fit type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Fit Type</SelectItem>
                          <SelectItem value="Slim Fit">Slim Fit</SelectItem>
                          <SelectItem value="Regular Fit">Regular Fit</SelectItem>
                          <SelectItem value="Oversized">Oversized</SelectItem>
                          <SelectItem value="Relaxed Fit">Relaxed Fit</SelectItem>
                          <SelectItem value="Skinny Fit">Skinny Fit</SelectItem>
                          <SelectItem value="Athletic Fit">Athletic Fit</SelectItem>
                          <SelectItem value="Boxy Fit">Boxy Fit</SelectItem>
                          <SelectItem value="Tailored Fit">Tailored Fit</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">Select the fit type of the apparel.</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tag">Promotion Tag / Badge</Label>
                      <Select value={formData.tag} onValueChange={(val) => setFormData({ ...formData, tag: val || 'none' })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select promotion tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Tag</SelectItem>
                          <SelectItem value="NEW">NEW</SelectItem>
                          <SelectItem value="LIMITED">LIMITED</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">Highlight product with a special badge.</p>
                    </div>
                  </div>
                </TabsContent>

                {/* VARIANTS TAB (COLORS & SIZES) */}
                <TabsContent value="variants" className="space-y-6 m-0 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Product Color Variants</h3>
                      <p className="text-xs text-muted-foreground">Add colors first, then assign sizes, SKUs, prices, and stock per color.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addColorGroup}>
                      <Plus className="h-4 w-4 mr-2" /> Add Color Group
                    </Button>
                  </div>

                  {formData.colorGroups.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-4">No color variants added yet.</p>
                      <Button type="button" variant="outline" onClick={addColorGroup}>Add First Color</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.colorGroups.map((group) => (
                        <div key={group.id} className="border rounded-xl p-4 bg-card space-y-4">
                          <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-3">
                              <Input
                                placeholder="Color name (e.g. Navy Blue, Black, Olive)"
                                value={group.color}
                                onChange={(e) => updateColorGroup(group.id, 'color', e.target.value)}
                                className="w-64 font-semibold"
                              />
                              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
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
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => removeColorGroup(group.id)}
                            >
                              <Trash className="h-4 w-4 mr-1" /> Remove Color
                            </Button>
                          </div>

                          {/* Sizes Table */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sizes & Inventory for {group.color || 'Color'}</h4>
                              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addSize(group.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Size
                              </Button>
                            </div>

                            {group.sizes.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">No sizes added for this color yet.</p>
                            ) : (
                              <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                  <TableHeader className="bg-muted/50">
                                    <TableRow className="text-xs">
                                      <TableHead className="w-[100px]">Size</TableHead>
                                      <TableHead className="w-[120px]">Price (₹)</TableHead>
                                      <TableHead className="w-[120px]">Compare Price</TableHead>
                                      <TableHead className="w-[120px]">Cost Price</TableHead>
                                      <TableHead className="w-[100px]">Stock</TableHead>
                                      <TableHead className="w-[140px]">SKU</TableHead>
                                      <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.sizes.map((s) => (
                                      <TableRow key={s.id}>
                                        <TableCell>
                                          <Input
                                            value={s.size}
                                            onChange={(e) => updateSize(group.id, s.id, 'size', e.target.value)}
                                            placeholder="S, 32, etc."
                                            className="h-8 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.price || ''}
                                            onChange={(e) => updateSize(group.id, s.id, 'price', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.comparePrice || ''}
                                            onChange={(e) => updateSize(group.id, s.id, 'comparePrice', parseFloat(e.target.value) || null)}
                                            className="h-8 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.costPrice || ''}
                                            onChange={(e) => updateSize(group.id, s.id, 'costPrice', parseFloat(e.target.value) || null)}
                                            className="h-8 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={s.stock || ''}
                                            onChange={(e) => updateSize(group.id, s.id, 'stock', parseInt(e.target.value) || 0)}
                                            className="h-8 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={s.sku}
                                            onChange={(e) => updateSize(group.id, s.id, 'sku', e.target.value)}
                                            className="h-8 text-xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => removeSize(group.id, s.id)}
                                          >
                                            <X className="h-3 w-3" />
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

                {/* MEDIA TAB (IMAGE UPLOADS PER COLOR) */}
                <TabsContent value="media" className="space-y-4 m-0 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">Color Variant Images</h3>
                      <p className="text-xs text-muted-foreground">Select a color to manage its image gallery (up to 10 images per color).</p>
                    </div>
                  </div>

                  {formData.colorGroups.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-4">You need to add at least one color variant first.</p>
                      <Button type="button" variant="outline" onClick={() => setActiveTab('variants')}>Go to Variants Tab</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Select Color Variant</Label>
                        <Select
                          value={selectedMediaColorId}
                          onValueChange={(val) => setSelectedMediaColorId(val || '')}
                        >
                          <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Select a color..." />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.colorGroups.map(g => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.color || 'Unnamed Color'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedColorGroup && (
                        <div className="mt-6 border rounded-lg p-4 bg-muted/10">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-sm">Images for {selectedColorGroup.color || 'Unnamed Color'}</h4>
                            <span className="text-xs text-muted-foreground">{selectedColorGroup.images.length} / 10 images</span>
                          </div>

                          <div className="grid gap-3">
                            {selectedColorGroup.images.map((img, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 border rounded bg-background flex items-center justify-center overflow-hidden">
                                  {img ? (
                                    <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  ) : (
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 flex gap-2">
                                  <Input
                                    placeholder="https://example.com/image.jpg"
                                    value={img}
                                    onChange={(e) => updateImageInGroup(selectedColorGroup.id, index, e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    className="w-[110px] text-xs file:text-xs file:py-1 file:px-2 file:border-0 file:bg-muted file:rounded"
                                    onChange={(e) => handleImageUpload(e, (url) => updateImageInGroup(selectedColorGroup.id, index, url))}
                                    disabled={isUploading}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 shrink-0"
                                  onClick={() => removeImageFromGroup(selectedColorGroup.id, index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                            {selectedColorGroup.images.length < 10 && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => addImageToGroup(selectedColorGroup.id)}
                                className="w-full border-dashed"
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Image
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="space-y-6 m-0 px-6 py-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Determine if this product is visible and purchasable.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Featured Product</Label>
                      <p className="text-sm text-muted-foreground">
                        Highlight this product on the home page or featured sections.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                    />
                  </div>
                </TabsContent>

                {/* SEO TAB */}
                <TabsContent value="seo" className="space-y-4 m-0 px-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="Title for search engines"
                    />
                    <p className="text-xs text-muted-foreground">If left blank, the product name will be used.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="seoDescription">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      rows={3}
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Description for search engines"
                    />
                  </div>
                </TabsContent>
              </ScrollArea>

              <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/20">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving...' : 'Save Product'}
                </Button>
              </div>
            </Tabs>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
