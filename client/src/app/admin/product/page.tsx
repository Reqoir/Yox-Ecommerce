'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useProducts } from '@/hooks/useProducts';
import { Product, ProductVariant } from '@/api/products';
import { useBrands } from '@/hooks/useBrands';

export default function AdminProductPage() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct, isCreating, isUpdating, isDeleting } = useProducts();
  const { brands } = useBrands();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const defaultVariant: Omit<ProductVariant, 'id'> = {
    sku: '',
    title: '',
    color: '',
    price: 0,
    comparePrice: 0,
    costPrice: 0,
    stock: 0,
    lowStockThreshold: 10,
    weight: 0,
    barcode: '',
    images: [],
    isDefault: false,
    isActive: true,
  };

  const defaultForm = {
    name: '',
    slug: '',
    categoryId: '',
    brandId: '',
    shortDescription: '',
    description: '',
    thumbnail: '',
    isFeatured: false,
    isActive: true,
    seoTitle: '',
    seoDescription: '',
    variants: [] as Omit<ProductVariant, 'id'>[],
  };

  const [formData, setFormData] = useState(defaultForm);

  const handleOpenAdd = () => {
    setFormData(defaultForm);
    setEditProduct(null);
    setActiveTab("general");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setFormData({
      name: product.name,
      slug: product.slug,
      categoryId: product.categoryId || '',
      brandId: product.brandId || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      thumbnail: product.thumbnail || '',
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      variants: product.variants ? product.variants.map(({id, ...rest}) => rest) : [],
    });
    setEditProduct(product);
    setActiveTab("general");
    setIsAddOpen(true);
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const addVariant = () => {
    setFormData({ ...formData, variants: [...formData.variants, { ...defaultVariant, sku: `SKU-${Math.floor(Math.random() * 10000)}` }] });
  };

  const removeVariant = (index: number) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      brandId: formData.brandId || null,
      categoryId: formData.categoryId || null,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store's apparel, variants, pricing, and inventory.
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Slug</TableHead>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No products found. Add your first product!
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: Product) => (
                <TableRow key={product.id}>
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
                  <TableCell>{product.slug}</TableCell>
                  <TableCell>
                    {brands.find(b => b.id === product.brandId)?.name || '-'}
                  </TableCell>
                  <TableCell>{product.salesCount}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {product.isActive ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(product)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editProduct ? 'Update product details and variants.' : 'Create a new apparel product for your store.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 border-b">
                <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
                  <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">General</TabsTrigger>
                  <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Media</TabsTrigger>
                  <TabsTrigger value="variants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Variants <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{formData.variants.length}</span></TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Settings</TabsTrigger>
                  <TabsTrigger value="seo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">SEO</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[450px] px-6 py-4">
                {/* GENERAL TAB */}
                <TabsContent value="general" className="space-y-4 m-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required 
                        placeholder="e.g. Classic Oxford Shirt"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
                      <Input 
                        id="slug" 
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        required 
                        placeholder="e.g. classic-oxford-shirt"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brandId">Brand</Label>
                      <Select value={formData.brandId} onValueChange={(val) => setFormData({...formData, brandId: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Brand</SelectItem>
                          {brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="categoryId">Category (ID)</Label>
                      <Input 
                        id="categoryId" 
                        value={formData.categoryId}
                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                        placeholder="Category ID (optional)"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Textarea 
                      id="shortDescription" 
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                      placeholder="A quick summary for product cards..."
                      rows={2}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea 
                      id="description" 
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Detailed product information..."
                    />
                  </div>
                </TabsContent>

                {/* MEDIA TAB */}
                <TabsContent value="media" className="space-y-4 m-0">
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnail">Thumbnail Image URL</Label>
                    <Input 
                      id="thumbnail" 
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                      placeholder="https://example.com/image.png"
                    />
                    <p className="text-xs text-muted-foreground">Primary image shown on product listings.</p>
                  </div>
                  {formData.thumbnail && (
                    <div className="mt-4 border rounded-lg p-4 flex items-center justify-center bg-muted/30">
                      <img src={formData.thumbnail} alt="Preview" className="max-h-[200px] object-contain rounded-md" onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x400?text=Invalid+Image'; }} />
                    </div>
                  )}
                </TabsContent>

                {/* VARIANTS TAB */}
                <TabsContent value="variants" className="space-y-4 m-0">
                  <div className="flex justify-between items-center pb-2">
                    <div>
                      <h3 className="text-sm font-medium">Product Variants</h3>
                      <p className="text-xs text-muted-foreground">Add sizes, colors, or different styles.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-2">
                      <Plus className="h-4 w-4" /> Add Variant
                    </Button>
                  </div>

                  {formData.variants.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-4">No variants added yet.</p>
                      <Button type="button" variant="secondary" onClick={addVariant}>Create First Variant</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.variants.map((variant, index) => (
                        <div key={index} className="border rounded-lg bg-card p-4 shadow-sm relative group">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-3 -right-3 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            onClick={() => removeVariant(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          
                          <div className="flex items-center justify-between mb-4 pb-2 border-b">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              Variant {index + 1}
                              {variant.isDefault && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Default</span>}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-normal cursor-pointer flex items-center gap-2">
                                <Switch 
                                  checked={variant.isDefault} 
                                  onCheckedChange={(val) => {
                                    // If this is set to default, unset others
                                    if (val) {
                                      const newVariants = formData.variants.map((v, i) => ({...v, isDefault: i === index}));
                                      setFormData({...formData, variants: newVariants});
                                    } else {
                                      handleVariantChange(index, 'isDefault', val);
                                    }
                                  }} 
                                />
                                Default
                              </Label>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="grid gap-2">
                              <Label className="text-xs">Title <span className="text-red-500">*</span></Label>
                              <Input 
                                value={variant.title} 
                                onChange={(e) => handleVariantChange(index, 'title', e.target.value)} 
                                placeholder="e.g. Small / Blue" 
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs">SKU <span className="text-red-500">*</span></Label>
                              <Input 
                                value={variant.sku} 
                                onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} 
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs">Color <span className="text-red-500">*</span></Label>
                              <Input 
                                value={variant.color} 
                                onChange={(e) => handleVariantChange(index, 'color', e.target.value)} 
                                placeholder="e.g. Navy Blue"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="grid gap-2">
                              <Label className="text-xs">Price (₹) <span className="text-red-500">*</span></Label>
                              <Input 
                                type="number" 
                                value={variant.price} 
                                onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)} 
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs">Compare Price</Label>
                              <Input 
                                type="number" 
                                value={variant.comparePrice || ''} 
                                onChange={(e) => handleVariantChange(index, 'comparePrice', parseFloat(e.target.value) || null)} 
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs">Cost Price</Label>
                              <Input 
                                type="number" 
                                value={variant.costPrice || ''} 
                                onChange={(e) => handleVariantChange(index, 'costPrice', parseFloat(e.target.value) || null)} 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="grid gap-2">
                              <Label className="text-xs">Stock Qty</Label>
                              <Input 
                                type="number" 
                                value={variant.stock} 
                                onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)} 
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs">Low Stock At</Label>
                              <Input 
                                type="number" 
                                value={variant.lowStockThreshold} 
                                onChange={(e) => handleVariantChange(index, 'lowStockThreshold', parseInt(e.target.value) || 0)} 
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs">Weight (g)</Label>
                              <Input 
                                type="number" 
                                value={variant.weight || ''} 
                                onChange={(e) => handleVariantChange(index, 'weight', parseFloat(e.target.value) || null)} 
                              />
                            </div>
                            <div className="grid gap-2 flex flex-col justify-end">
                              <Label className="text-xs font-normal cursor-pointer flex items-center gap-2 h-10 border rounded-md px-3 bg-muted/20">
                                <Switch 
                                  checked={variant.isActive} 
                                  onCheckedChange={(val) => handleVariantChange(index, 'isActive', val)} 
                                />
                                Active
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="space-y-6 m-0">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Determine if this product is visible and purchasable.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
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
                      onCheckedChange={(checked) => setFormData({...formData, isFeatured: checked})}
                    />
                  </div>
                </TabsContent>

                {/* SEO TAB */}
                <TabsContent value="seo" className="space-y-4 m-0">
                  <div className="grid gap-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input 
                      id="seoTitle" 
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                      placeholder="Description for search engines"
                    />
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/20">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
