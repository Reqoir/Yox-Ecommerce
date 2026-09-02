'use client';

import { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  Loader2,
  Search,
  Upload,
  RefreshCw,
  Crop,
  Sparkles,
  Eye,
  Globe,
  ExternalLink,
  Tag,
  X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { useBrands } from '@/hooks/admin/useBrands';
import { Brand } from '@/api/admin/brands';
import { uploadApi } from '@/api/admin/upload';
import { ImageCropperModal } from '@/components/ui/image-cropper-modal';
import { toast } from 'sonner';

export default function AdminBrandPage() {
  const { brands, isLoading, createBrand, updateBrand, deleteBrand, isCreating, isUpdating } = useBrands();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [viewBrand, setViewBrand] = useState<Brand | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('general');
  const [isUploading, setIsUploading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Image Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSource, setCropSource] = useState<File | string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const defaultForm = {
    name: '',
    slug: '',
    description: '',
    website: '',
    logo: '',
    displayOrder: 0,
    isActive: true,
    seoTitle: '',
    seoDescription: '',
  };

  const [formData, setFormData] = useState(defaultForm);

  // Slug generator helper
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Auto-sync slug on name change
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isSlugManual ? prev.slug : generateSlug(name),
      seoTitle:
        !prev.seoTitle || prev.seoTitle === `${prev.name} - Official Brand Store | YOX`
          ? name
            ? `${name} - Official Brand Store | YOX`
            : ''
          : prev.seoTitle,
    }));
  };

  // Re-sync slug manually
  const handleSyncSlug = () => {
    if (!formData.name) {
      toast.error('Please enter brand name first.');
      return;
    }
    const newSlug = generateSlug(formData.name);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    setIsSlugManual(false);
    toast.success('Slug synced from brand name!');
  };

  // Auto-fill SEO metadata
  const handleAutoFillSeo = () => {
    if (!formData.name) {
      toast.error('Please enter a brand name first.');
      return;
    }
    const cleanName = formData.name.trim();
    const generatedDesc = formData.description?.trim()
      ? formData.description.trim().slice(0, 155)
      : `Shop authentic ${cleanName} collections online at YOX. Discover premium apparel, trending designs, and guaranteed quality with fast shipping.`;

    setFormData((prev) => ({
      ...prev,
      seoTitle: `${cleanName} - Official Brand Store | YOX`,
      seoDescription: generatedDesc,
    }));
    toast.success('Auto-filled SEO title and description!');
  };

  // Image Cropping & Uploading Handlers
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSource(file);
    setCropperOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropperOpen(false);
    setCropSource(null);
    try {
      setIsUploading(true);
      const url = await uploadApi.uploadImage(croppedFile);
      setFormData((prev) => ({ ...prev, logo: url }));
      toast.success('Brand logo cropped & uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload cropped image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecropExisting = () => {
    if (!formData.logo) return;
    setCropSource(formData.logo);
    setCropperOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData(defaultForm);
    setEditBrand(null);
    setIsSlugManual(false);
    setActiveTab('general');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      website: brand.website || '',
      logo: brand.logo || '',
      displayOrder: brand.displayOrder || 0,
      isActive: brand.isActive,
      seoTitle: brand.seoTitle || '',
      seoDescription: brand.seoDescription || '',
    });
    setEditBrand(brand);
    setIsSlugManual(true);
    setActiveTab('general');
    setIsAddOpen(true);
  };

  const handleOpenView = (brand: Brand) => {
    setViewBrand(brand);
    setIsViewOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Brand Name is required.');
      setActiveTab('general');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Brand Slug is required.');
      setActiveTab('general');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description?.trim() || null,
      website: formData.website?.trim() || null,
      logo: formData.logo?.trim() || null,
      displayOrder: Number(formData.displayOrder) || 0,
      isActive: formData.isActive,
      seoTitle: formData.seoTitle?.trim() || null,
      seoDescription: formData.seoDescription?.trim() || null,
    };

    if (editBrand) {
      updateBrand(
        { id: editBrand.id, data: payload },
        {
          onSuccess: () => {
            setIsAddOpen(false);
            toast.success('Brand updated successfully!');
          },
        }
      );
    } else {
      createBrand(payload, {
        onSuccess: () => {
          setIsAddOpen(false);
          toast.success('Brand created successfully!');
        },
      });
    }
  };

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch =
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && brand.isActive) ||
      (statusFilter === 'draft' && !brand.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">
            Brands
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your store brands, logos, official URLs, and search engine optimization.
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto bg-[#1A2E4C] hover:bg-[#132238] text-white" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands by name or slug..."
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
              setStatusFilter(val || 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Brand Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Official Website</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading brands...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No brands found. {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search filters.' : ''}
                </TableCell>
              </TableRow>
            ) : (
              paginatedBrands.map((brand: Brand) => (
                <TableRow key={brand.id} className="hover:bg-muted/30 transition-colors">
                  {/* Brand Name & Logo */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {brand.logo ? (
                        <div className="h-10 w-10 rounded-lg border bg-white overflow-hidden flex items-center justify-center shrink-0 p-1 shadow-xs">
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 font-bold text-sm">
                          {brand.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-foreground block">
                          {brand.name}
                        </span>
                        {brand.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[220px]">
                            {brand.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Slug */}
                  <TableCell>
                    <code className="text-xs font-mono bg-muted/60 px-1.5 py-0.5 rounded text-gray-700 dark:text-muted-foreground">
                      /{brand.slug}
                    </code>
                  </TableCell>

                  {/* Website */}
                  <TableCell>
                    {brand.website ? (
                      <a
                        href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline max-w-[180px] truncate"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{brand.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Order */}
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    #{brand.displayOrder || 0}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        brand.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          brand.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {brand.isActive ? 'Active' : 'Draft'}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({ variant: 'ghost', className: 'h-8 w-8 p-0' })}
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenView(brand)}>
                          <Eye className="mr-2 h-4 w-4 text-gray-500" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(brand)}>
                          <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete brand "${brand.name}"?`
                              )
                            ) {
                              deleteBrand(brand.id);
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

      {filteredBrands.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add / Edit Brand Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-bold">
              {editBrand ? 'Edit Brand' : 'Add New Brand'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editBrand
                ? 'Update brand information, logo image, and SEO settings.'
                : 'Create a new brand with automatic slug generation and cropped logo.'}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 border-b shrink-0 bg-muted/20">
                <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0 gap-6">
                  <TabsTrigger
                    value="general"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1A2E4C] data-[state=active]:text-[#1A2E4C] dark:data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-xs font-semibold"
                  >
                    General Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="media"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1A2E4C] data-[state=active]:text-[#1A2E4C] dark:data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-xs font-semibold"
                  >
                    Brand Logo
                  </TabsTrigger>
                  <TabsTrigger
                    value="seo"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1A2E4C] data-[state=active]:text-[#1A2E4C] dark:data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-xs font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    SEO Optimization
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1A2E4C] data-[state=active]:text-[#1A2E4C] dark:data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-xs font-semibold"
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 overflow-y-auto px-6 py-5">
                {/* General Tab */}
                <TabsContent value="general" className="space-y-4 m-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Brand Name */}
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-xs font-bold">
                        Brand Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        placeholder="e.g. Nike, Adidas, Zara"
                        className="text-sm"
                      />
                    </div>

                    {/* Slug with Auto-fill */}
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="slug" className="text-xs font-bold">
                          Slug <span className="text-red-500">*</span>
                        </Label>
                        <button
                          type="button"
                          onClick={handleSyncSlug}
                          className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                          title="Generate slug from brand name"
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
                        placeholder="e.g. nike"
                        className="text-sm font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Used for brand catalog URL. Auto-generated as you type brand name.
                      </p>
                    </div>
                  </div>

                  {/* Website URL */}
                  <div className="grid gap-2">
                    <Label htmlFor="website" className="text-xs font-bold">
                      Official Website URL (Optional)
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://brand-website.com"
                      className="text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-xs font-bold">
                      Brand Story / Description
                    </Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Write a brief overview about the brand history and quality..."
                      className="text-sm"
                    />
                  </div>
                </TabsContent>

                {/* Media Tab with Image Cropping */}
                <TabsContent value="media" className="space-y-4 m-0">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold">Brand Logo Image</Label>

                    {/* Upload & Crop Buttons */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          id="brand-logo-upload"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={handleFileSelected}
                          disabled={isUploading}
                        />
                        <Button type="button" variant="outline" className="pointer-events-none gap-2 text-xs">
                          <Upload className="h-4 w-4" />
                          {formData.logo ? 'Replace & Crop Logo' : 'Upload Logo (with Cropping)'}
                        </Button>
                      </div>

                      {formData.logo && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleRecropExisting}
                          className="gap-1.5 text-xs"
                          disabled={isUploading}
                        >
                          <Crop className="h-3.5 w-3.5" />
                          Re-crop Current Logo
                        </Button>
                      )}

                      {isUploading && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Uploading logo...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Upload and crop logos with precision. 1:1 Square ratio is recommended for logos.
                    </p>
                  </div>

                  {/* Logo Preview Box */}
                  {formData.logo && (
                    <div className="relative border rounded-xl p-4 bg-muted/20 flex flex-col items-center justify-center group">
                      <div className="relative h-28 w-28 rounded-xl border bg-white p-2 flex items-center justify-center shadow-xs overflow-hidden">
                        <img
                          src={formData.logo}
                          alt="Brand logo preview"
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/120x120?text=Invalid+Logo';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-xs"
                        title="Remove logo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-4 m-0">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Search Engine Optimization
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Boost discoverability of this brand page on Google search.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoFillSeo}
                      className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Auto-fill SEO
                    </Button>
                  </div>

                  {/* SEO Title */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seoTitle" className="text-xs font-bold">
                        SEO Meta Title
                      </Label>
                      <span
                        className={`text-[11px] font-mono ${
                          formData.seoTitle.length > 60
                            ? 'text-amber-500 font-bold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formData.seoTitle.length}/60 chars (Recommended: 50-60)
                      </span>
                    </div>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="e.g. Nike - Official Brand Store | YOX"
                      className="text-sm"
                    />
                  </div>

                  {/* SEO Description */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seoDescription" className="text-xs font-bold">
                        SEO Meta Description
                      </Label>
                      <span
                        className={`text-[11px] font-mono ${
                          formData.seoDescription.length > 160
                            ? 'text-amber-500 font-bold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formData.seoDescription.length}/160 chars (Recommended: 120-160)
                      </span>
                    </div>
                    <Textarea
                      id="seoDescription"
                      rows={3}
                      value={formData.seoDescription}
                      onChange={(e) =>
                        setFormData({ ...formData, seoDescription: e.target.value })
                      }
                      placeholder="Write a concise meta summary for search engines and social shares..."
                      className="text-sm"
                    />
                  </div>

                  {/* Google Search Live Preview Card */}
                  <div className="border rounded-xl p-4 bg-muted/10 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Search className="h-3 w-3 text-blue-600" /> Google Search Live Preview
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Desktop Snippet
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-card border rounded-lg space-y-1 font-sans shadow-xs">
                      {/* URL */}
                      <div className="flex items-center gap-1.5 text-xs text-[#202124] dark:text-gray-300">
                        <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-700">
                          Y
                        </div>
                        <span className="text-[12px] text-[#202124] dark:text-gray-300 font-medium">YOX</span>
                        <span className="text-gray-400 text-xs">› shop › {formData.slug || 'brand'}</span>
                      </div>

                      {/* Title Link */}
                      <div className="text-[16px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1 leading-snug">
                        {formData.seoTitle || formData.name || 'Brand Name'} | YOX Apparel
                      </div>

                      {/* Snippet Description */}
                      <div className="text-[13px] text-[#4d5156] dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {formData.seoDescription ||
                          formData.description ||
                          'Discover our curated selection of authentic brand collections at YOX. Explore premium styles and accessories with fast and reliable shipping.'}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 m-0">
                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Brand Visibility</Label>
                      <p className="text-xs text-muted-foreground">
                        When active, this brand is visible in product filters and brand directories.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="displayOrder" className="text-xs font-bold">
                      Display / Sort Order
                    </Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-sm max-w-[150px]"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Lower numbers appear first in brand listings and filter panels.
                    </p>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Sticky Dialog Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/20 shrink-0 mt-auto">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="bg-[#1A2E4C] hover:bg-[#132238] text-white"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : editBrand ? (
                  'Update Brand'
                ) : (
                  'Save Brand'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Brand Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Brand Details
            </DialogTitle>
          </DialogHeader>

          {viewBrand && (
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-start gap-4">
                {viewBrand.logo ? (
                  <div className="h-20 w-20 rounded-xl border bg-white p-2 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src={viewBrand.logo}
                      alt={viewBrand.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center font-bold text-xl text-muted-foreground shrink-0">
                    {viewBrand.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-foreground">
                    {viewBrand.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                      /{viewBrand.slug}
                    </code>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.2 text-[11px] font-medium ${
                        viewBrand.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {viewBrand.isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  {viewBrand.website && (
                    <a
                      href={viewBrand.website.startsWith('http') ? viewBrand.website : `https://${viewBrand.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline pt-0.5"
                    >
                      <Globe className="h-3 w-3" />
                      <span>{viewBrand.website}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="border-y py-3 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Display / Sort Order:</span>
                <span className="font-semibold text-gray-900 dark:text-foreground">
                  #{viewBrand.displayOrder || 0}
                </span>
              </div>

              {/* Description */}
              {viewBrand.description && (
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    About Brand
                  </span>
                  <p className="text-xs bg-muted/20 p-3 rounded-lg border text-muted-foreground leading-relaxed">
                    {viewBrand.description}
                  </p>
                </div>
              )}

              {/* SEO Summary */}
              <div className="border rounded-xl p-3.5 bg-muted/10 space-y-1.5 text-xs">
                <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Search Engine Optimization
                </span>
                <p>
                  <strong>Title:</strong> {viewBrand.seoTitle || `${viewBrand.name} | YOX`}
                </p>
                {viewBrand.seoDescription && (
                  <p className="text-muted-foreground">
                    <strong>Description:</strong> {viewBrand.seoDescription}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end px-6 py-3 border-t bg-muted/20 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperOpen}
        onClose={() => {
          setCropperOpen(false);
          setCropSource(null);
        }}
        imageSource={cropSource}
        onCropComplete={handleCropComplete}
        title="Crop Brand Logo"
      />
    </div>
  );
}
