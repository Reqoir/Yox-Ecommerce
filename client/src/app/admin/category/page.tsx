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
  FolderTree,
  ExternalLink,
  CheckCircle2,
  Layers,
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
import { useCategories } from '@/hooks/admin/useCategories';
import { Category } from '@/api/admin/categories';
import { uploadApi } from '@/api/admin/upload';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageCropperModal } from '@/components/ui/image-cropper-modal';
import { toast } from 'sonner';

export default function AdminCategoryPage() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, isCreating, isUpdating } = useCategories();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [viewCategory, setViewCategory] = useState<Category | null>(null);
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const defaultForm = {
    name: '',
    slug: '',
    description: '',
    image: '',
    icon: '',
    parentCategoryId: 'none',
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
        !prev.seoTitle || prev.seoTitle === `${prev.name} - Shop Latest Collection | YOX`
          ? name
            ? `${name} - Shop Latest Collection | YOX`
            : ''
          : prev.seoTitle,
    }));
  };

  // Re-sync slug manually
  const handleSyncSlug = () => {
    if (!formData.name) {
      toast.error('Please enter category name first.');
      return;
    }
    const newSlug = generateSlug(formData.name);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
    setIsSlugManual(false);
    toast.success('Slug synced from category name!');
  };

  // Auto-fill SEO metadata
  const handleAutoFillSeo = () => {
    if (!formData.name) {
      toast.error('Please enter a category name first.');
      return;
    }
    const cleanName = formData.name.trim();
    const generatedDesc = formData.description?.trim()
      ? formData.description.trim().slice(0, 155)
      : `Explore our latest collection of ${cleanName.toLowerCase()} at YOX. Discover high quality fashion, perfect fits, and trendsetting styles with fast delivery.`;

    setFormData((prev) => ({
      ...prev,
      seoTitle: `${cleanName} - Shop Latest Collection | YOX`,
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
      setFormData((prev) => ({ ...prev, image: url }));
      toast.success('Image cropped & uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload cropped image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecropExisting = () => {
    if (!formData.image) return;
    setCropSource(formData.image);
    setCropperOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData(defaultForm);
    setEditCategory(null);
    setIsSlugManual(false);
    setActiveTab('general');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || '',
      parentCategoryId: category.parentCategoryId || 'none',
      displayOrder: category.sortOrder || 0,
      isActive: category.isActive,
      seoTitle: category.seoTitle || '',
      seoDescription: category.seoDescription || '',
    });
    setEditCategory(category);
    setIsSlugManual(true);
    setActiveTab('general');
    setIsAddOpen(true);
  };

  const handleOpenView = (category: Category) => {
    setViewCategory(category);
    setIsViewOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category Name is required.');
      setActiveTab('general');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Category Slug is required.');
      setActiveTab('general');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      sortOrder: Number(formData.displayOrder) || 0,
      parentCategoryId: formData.parentCategoryId === 'none' || !formData.parentCategoryId ? null : formData.parentCategoryId,
      description: formData.description?.trim() || null,
      image: formData.image?.trim() || null,
      icon: formData.icon?.trim() || null,
      isActive: formData.isActive,
      seoTitle: formData.seoTitle?.trim() || null,
      seoDescription: formData.seoDescription?.trim() || null,
    };

    if (editCategory) {
      updateCategory(
        { id: editCategory.id, data: payload },
        {
          onSuccess: () => {
            setIsAddOpen(false);
            toast.success('Category updated successfully!');
          },
        }
      );
    } else {
      createCategory(payload, {
        onSuccess: () => {
          setIsAddOpen(false);
          toast.success('Category created successfully!');
        },
      });
    }
  };

  // Helper to find exact parent category name
  const getParentName = (parentId?: string | null | any) => {
    if (!parentId || parentId === 'none') return 'Main Category';
    if (typeof parentId === 'object' && parentId.name) return parentId.name;
    const parent = categories.find((c: Category) => c.id === parentId || (c as any)._id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  // Prevent selecting itself as parent
  const availableParents = categories.filter((c: Category) => !editCategory || c.id !== editCategory.id);

  const filteredCategories = categories.filter((category: Category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && category.isActive) ||
      (statusFilter === 'draft' && !category.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground">
            Categories
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Organize products with main categories, subcategories, and search engine optimization.
          </p>
        </div>
        <Button className="gap-2 self-start sm:self-auto bg-[#1A2E4C] hover:bg-[#132238] text-white" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories by name or slug..."
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

      {/* Category Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent Category</TableHead>
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
                    <span>Loading categories...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No categories found. {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search filters.' : ''}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category: Category) => (
                <TableRow key={category.id} className="hover:bg-muted/30 transition-colors">
                  {/* Category Name & Thumbnail */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {category.image ? (
                        <div className="h-10 w-10 rounded-lg border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : category.icon ? (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                          {category.icon}
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                          <Layers size={18} />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-foreground block">
                          {category.name}
                        </span>
                        {category.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {category.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Slug */}
                  <TableCell>
                    <code className="text-xs font-mono bg-muted/60 px-1.5 py-0.5 rounded text-gray-700 dark:text-muted-foreground">
                      /{category.slug}
                    </code>
                  </TableCell>

                  {/* Parent Category with Exact Name Display */}
                  <TableCell>
                    {category.parentCategoryId && category.parentCategoryId !== 'none' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                        <FolderTree className="h-3 w-3" />
                        {getParentName(category.parentCategoryId)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium italic">
                        Main Category
                      </span>
                    )}
                  </TableCell>

                  {/* Sort Order */}
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    #{category.sortOrder || 0}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        category.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          category.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {category.isActive ? 'Active' : 'Draft'}
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
                        <DropdownMenuItem onClick={() => handleOpenView(category)}>
                          <Eye className="mr-2 h-4 w-4 text-gray-500" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(category)}>
                          <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete category "${category.name}"?`
                              )
                            ) {
                              deleteCategory(category.id);
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredCategories.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[10, 25, 50, 100]}
      />

      {/* Add / Edit Category Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-bold">
              {editCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editCategory
                ? 'Update category information, hierarchy, and SEO configuration.'
                : 'Create a new product category with automatic slug and media cropping.'}
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
                    Media & Cover
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
                    {/* Category Name */}
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-xs font-bold">
                        Category Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                        placeholder="e.g. Men's Hoodies & Sweaters"
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
                          title="Generate slug from category name"
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
                        placeholder="e.g. mens-hoodies-sweaters"
                        className="text-sm font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Used for clean URLs. Auto-generated as you type the category name.
                      </p>
                    </div>
                  </div>

                  {/* Parent Category with Exact Name Display */}
                  <div className="grid gap-2">
                    <Label htmlFor="parentCategory" className="text-xs font-bold flex items-center justify-between">
                      <span>Parent Category (Optional)</span>
                      {formData.parentCategoryId && formData.parentCategoryId !== 'none' && (
                        <span className="text-[11px] font-normal text-blue-600">
                          Selected: {getParentName(formData.parentCategoryId)}
                        </span>
                      )}
                    </Label>
                    <Select
                      value={formData.parentCategoryId}
                      onValueChange={(val) =>
                        setFormData({ ...formData, parentCategoryId: val || 'none' })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a parent category">
                          {formData.parentCategoryId && formData.parentCategoryId !== 'none'
                            ? getParentName(formData.parentCategoryId)
                            : 'None (Main Category)'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="font-semibold text-gray-900 dark:text-foreground">
                            None (Main Category)
                          </span>
                        </SelectItem>
                        {availableParents.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{cat.name}</span>
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                                /{cat.slug}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose a parent category to create a subcategory (e.g. Shirts under Men).
                    </p>
                  </div>

                  {/* Description */}
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-xs font-bold">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Write a brief description about this category..."
                      className="text-sm"
                    />
                  </div>
                </TabsContent>

                {/* Media Tab with Image Cropping */}
                <TabsContent value="media" className="space-y-4 m-0">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold">Category Cover Image</Label>

                    {/* Upload & Crop Buttons */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          id="category-image-upload"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={handleFileSelected}
                          disabled={isUploading}
                        />
                        <Button type="button" variant="outline" className="pointer-events-none gap-2 text-xs">
                          <Upload className="h-4 w-4" />
                          {formData.image ? 'Replace & Crop Image' : 'Upload Image (with Cropping)'}
                        </Button>
                      </div>

                      {formData.image && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleRecropExisting}
                          className="gap-1.5 text-xs"
                          disabled={isUploading}
                        >
                          <Crop className="h-3.5 w-3.5" />
                          Re-crop Current Image
                        </Button>
                      )}

                      {isUploading && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span>Uploading image...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Upload and crop images with precision. Recommended aspect ratio: 1:1 or 4:3.
                    </p>
                  </div>

                  {/* Image Preview Box */}
                  {formData.image && (
                    <div className="relative border rounded-xl p-3 bg-muted/20 flex flex-col items-center justify-center group">
                      <div className="relative max-h-[180px] overflow-hidden rounded-lg border bg-white shadow-xs">
                        <img
                          src={formData.image}
                          alt="Category preview"
                          className="max-h-[180px] w-auto object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/200x120?text=Invalid+Image';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-xs"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Icon or Emoji */}
                  <div className="grid gap-2 pt-2">
                    <Label htmlFor="icon" className="text-xs font-bold">
                      Category Icon (Emoji or SVG)
                    </Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="👕 or 👖 or 👟"
                      className="text-sm max-w-[200px]"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      An optional icon or emoji displayed beside the category title.
                    </p>
                  </div>
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-4 m-0">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Search Engine Optimization
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Help search engines understand and rank this category page.
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
                      placeholder="e.g. Men's Shirts - Shop Latest Collection | YOX"
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
                        <span className="text-gray-400 text-xs">› shop › {formData.slug || 'category'}</span>
                      </div>

                      {/* Title Link */}
                      <div className="text-[16px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1 leading-snug">
                        {formData.seoTitle || formData.name || 'Category Name'} | YOX Apparel
                      </div>

                      {/* Snippet Description */}
                      <div className="text-[13px] text-[#4d5156] dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {formData.seoDescription ||
                          formData.description ||
                          'Discover our curated selection of high-quality products at YOX. Explore premium styles and accessories with fast and reliable shipping.'}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 m-0">
                  <div className="flex items-center justify-between rounded-xl border p-4 bg-card">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Category Visibility</Label>
                      <p className="text-xs text-muted-foreground">
                        When active, this category is visible in the storefront navigation and filters.
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
                      Lower numbers appear first in header menus and catalog lists.
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
                ) : editCategory ? (
                  'Update Category'
                ) : (
                  'Save Category'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Category Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Category Details
            </DialogTitle>
          </DialogHeader>

          {viewCategory && (
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-start gap-4">
                {viewCategory.image ? (
                  <div className="h-20 w-20 rounded-xl border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={viewCategory.image}
                      alt={viewCategory.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center text-3xl shrink-0">
                    {viewCategory.icon || <Layers size={28} className="text-muted-foreground" />}
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-foreground">
                    {viewCategory.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                      /{viewCategory.slug}
                    </code>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.2 text-[11px] font-medium ${
                        viewCategory.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {viewCategory.isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hierarchy Info */}
              <div className="grid grid-cols-2 gap-4 border-y py-3 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Parent Category:</span>
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    {getParentName(viewCategory.parentCategoryId)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Sort Order:</span>
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    #{viewCategory.sortOrder || 0}
                  </span>
                </div>
              </div>

              {/* Description */}
              {viewCategory.description && (
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    Description
                  </span>
                  <p className="text-xs bg-muted/20 p-3 rounded-lg border text-muted-foreground leading-relaxed">
                    {viewCategory.description}
                  </p>
                </div>
              )}

              {/* SEO Summary */}
              <div className="border rounded-xl p-3.5 bg-muted/10 space-y-1.5 text-xs">
                <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Search Engine Optimization
                </span>
                <p>
                  <strong>Title:</strong> {viewCategory.seoTitle || `${viewCategory.name} | YOX`}
                </p>
                {viewCategory.seoDescription && (
                  <p className="text-muted-foreground">
                    <strong>Description:</strong> {viewCategory.seoDescription}
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
        title="Crop Category Cover Image"
      />
    </div>
  );
}
