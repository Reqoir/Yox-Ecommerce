'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash, Loader2, Search } from 'lucide-react';
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
} from "@/components/ui/select";

export default function AdminCategoryPage() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, isCreating, isUpdating, isDeleting } = useCategories();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const defaultForm = {
    name: '',
    slug: '',
    description: '',
    image: '',
    icon: '',
    parentCategoryId: 'none', // using 'none' for no parent in select
    displayOrder: 0,
    isActive: true,
    seoTitle: '',
    seoDescription: '',
  };

  const [formData, setFormData] = useState(defaultForm);

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
    setEditCategory(null);
    setActiveTab("general");
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
    setActiveTab("general");
    setIsAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare payload, converting empty strings to null for optional fields
    const payload = {
      ...formData,
      sortOrder: formData.displayOrder,
      parentCategoryId: formData.parentCategoryId === 'none' ? null : formData.parentCategoryId,
      description: formData.description || null,
      image: formData.image || null,
      icon: formData.icon || null,
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
    };
    
    // Remove temporary displayOrder property used for form
    const { displayOrder, ...finalPayload } = payload;

    if (editCategory) {
      updateCategory({ id: editCategory.id, data: finalPayload }, {
        onSuccess: () => setIsAddOpen(false)
      });
    } else {
      createCategory(finalPayload, {
        onSuccess: () => setIsAddOpen(false)
      });
    }
  };

  // Helper to find parent name
  const getParentName = (parentId?: string | null) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : 'Unknown';
  };

  // Prevent selecting itself or its children as a parent
  const availableParents = categories.filter(c => !editCategory || c.id !== editCategory.id);

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          category.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
                          || (statusFilter === 'active' && category.isActive)
                          || (statusFilter === 'draft' && !category.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Manage product categories and subcategories.
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search categories..." 
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

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No categories found. {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : ''}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category: Category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {category.icon ? (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xl">
                          {category.icon}
                        </div>
                      ) : category.image ? (
                        <div className="h-8 w-8 rounded border bg-muted overflow-hidden flex items-center justify-center">
                          <img src={category.image} alt={category.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      ) : null}
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    {category.parentCategoryId ? (
                       <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                         {getParentName(category.parentCategoryId)}
                       </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(category)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this category?')) {
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

      {filteredCategories.length > itemsPerPage && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editCategory ? 'Update the details of the category.' : 'Add a new category to your store.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 border-b">
                <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
                  <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">General</TabsTrigger>
                  <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Media</TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Settings</TabsTrigger>
                  <TabsTrigger value="seo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">SEO</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[400px] px-6 py-4">
                <TabsContent value="general" className="space-y-4 m-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required 
                        placeholder="e.g. Men's Clothing"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
                      <Input 
                        id="slug" 
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        required 
                        placeholder="e.g. mens-clothing"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
                    <Select 
                      value={formData.parentCategoryId} 
                      onValueChange={(val) => setFormData({...formData, parentCategoryId: val || 'none'})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Main Category)</SelectItem>
                        {availableParents.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select an existing category to make this a subcategory.</p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Write a brief description about the category..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 m-0">
                  <div className="grid gap-2">
                    <Label htmlFor="image">Category Image</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="image" 
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (url) => setFormData({...formData, image: url}))}
                        disabled={isUploading}
                      />
                      {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Upload a cover image for the category.</p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icon (Emoji or URL)</Label>
                    <Input 
                      id="icon" 
                      value={formData.icon}
                      onChange={(e) => setFormData({...formData, icon: e.target.value})}
                      placeholder="👕"
                    />
                  </div>

                  {formData.image && (
                    <div className="mt-4 border rounded-lg p-4 flex items-center justify-center bg-muted/30">
                      <img src={formData.image} alt="Category preview" className="max-h-[120px] object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x100?text=Invalid+Image'; }} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 m-0">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Determine if this category is visible on the store.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="displayOrder">Sort Order</Label>
                    <Input 
                      id="displayOrder" 
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
                    />
                    <p className="text-xs text-muted-foreground">Lower numbers appear first in lists.</p>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 m-0">
                  <div className="grid gap-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input 
                      id="seoTitle" 
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                      placeholder="Title for search engines"
                    />
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
                {isCreating || isUpdating ? 'Saving...' : 'Save Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
