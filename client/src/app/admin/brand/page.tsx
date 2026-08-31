'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash, Loader2, Search, Upload } from 'lucide-react';
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
import { useBrands } from '@/hooks/admin/useBrands';
import { Brand } from '@/api/admin/brands';
import { uploadApi } from '@/api/admin/upload';

export default function AdminBrandPage() {
  const { brands, isLoading, createBrand, updateBrand, deleteBrand, isCreating, isUpdating, isDeleting } = useBrands();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
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
    website: '',
    logo: '',
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
    setEditBrand(null);
    setActiveTab("general");
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
    setActiveTab("general");
    setIsAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare payload, converting empty strings to null for optional fields
    const payload = {
      ...formData,
      description: formData.description || null,
      website: formData.website || null,
      logo: formData.logo || null,
      seoTitle: formData.seoTitle || null,
      seoDescription: formData.seoDescription || null,
    };

    if (editBrand) {
      updateBrand({ id: editBrand.id, data: payload }, {
        onSuccess: () => setIsAddOpen(false)
      });
    } else {
      createBrand(payload, {
        onSuccess: () => setIsAddOpen(false)
      });
    }
  };

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          brand.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' 
                          || (statusFilter === 'active' && brand.isActive)
                          || (statusFilter === 'draft' && !brand.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground mt-1">
            Manage product brands and their details.
          </p>
        </div>
        <Button className="gap-2" onClick={handleOpenAdd}>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search brands..." 
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
              <TableHead>Website</TableHead>
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
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No brands found. {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : ''}
                </TableCell>
              </TableRow>
            ) : (
              paginatedBrands.map((brand: Brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {brand.logo && (
                        <div className="h-8 w-8 rounded-full border bg-muted overflow-hidden flex items-center justify-center">
                          <img src={brand.logo} alt={brand.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      )}
                      {brand.name}
                    </div>
                  </TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>{brand.website || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(brand)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this brand?')) {
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
            <DialogDescription>
              {editBrand ? 'Update the details of the brand.' : 'Add a new brand to your store.'}
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
                      <Label htmlFor="name">Brand Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required 
                        placeholder="e.g. Nike"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
                      <Input 
                        id="slug" 
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        required 
                        placeholder="e.g. nike"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input 
                      id="website" 
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Write a brief description about the brand..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 m-0">
                  <div className="grid gap-2">
                    <Label htmlFor="logo">Logo Image</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="relative">
                        <input
                          id="logo"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleImageUpload(e, (url) => setFormData({...formData, logo: url}))}
                          disabled={isUploading}
                        />
                        <Button type="button" variant="outline" className="pointer-events-none">
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.logo ? 'Change Image' : 'Upload Image'}
                        </Button>
                      </div>
                      {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Upload an image for the brand logo.</p>
                  </div>
                  {formData.logo && (
                    <div className="mt-4 border rounded-lg p-4 flex items-center justify-center bg-muted/30">
                      <img src={formData.logo} alt="Logo preview" className="max-h-[120px] object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x100?text=Invalid+Image'; }} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 m-0">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Determine if this brand is visible on the store.
                      </p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
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
                {isCreating || isUpdating ? 'Saving...' : 'Save Brand'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
