'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock, 
  Percent, 
  DollarSign, 
  Tag, 
  Layers, 
  Package, 
  PartyPopper, 
  Flame, 
  Check, 
  X, 
  Upload, 
  Loader2, 
  Save, 
  ArrowRight,
  Sparkles,
  LayoutTemplate,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  offersApi, 
  Offer, 
  OfferType, 
  DiscountType, 
  BannerPosition, 
  CreateOfferDTO 
} from '@/api/admin/offers';
import { useProducts } from '@/hooks/admin/useProducts';
import { useCategories } from '@/hooks/admin/useCategories';
import { useBrands } from '@/hooks/admin/useBrands';
import { uploadApi } from '@/api/admin/upload';
import { Pagination } from '@/components/ui/pagination';

const OFFER_TYPES: { type: OfferType; label: string; desc: string; icon: any; color: string }[] = [
  { 
    type: 'PRODUCT', 
    label: 'Product Offer', 
    desc: 'Special discount on one or multiple specific products', 
    icon: Package, 
    color: 'bg-purple-50 text-purple-700 border-purple-200' 
  },
  { 
    type: 'CATEGORY', 
    label: 'Category Offer', 
    desc: 'Discount on apparel categories with optional product selection', 
    icon: Layers, 
    color: 'bg-blue-50 text-blue-700 border-blue-200' 
  },
  { 
    type: 'BRAND', 
    label: 'Brand Offer', 
    desc: 'Brand-specific promotional discount with optional product selection', 
    icon: Tag, 
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200' 
  },
  { 
    type: 'CELEBRATION', 
    label: 'Celebration Offer', 
    desc: 'Festivals, seasonal events, Diwali, New Year specials', 
    icon: PartyPopper, 
    color: 'bg-amber-50 text-amber-700 border-amber-200' 
  },
  { 
    type: 'LIMITED_TIME', 
    label: 'Limited-Time Flash Sale', 
    desc: 'Time-sensitive countdown deals with real-time timer', 
    icon: Flame, 
    color: 'bg-rose-50 text-rose-700 border-rose-200' 
  },
];

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for Create / Edit Offer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('PRODUCT');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<string>('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [isLimitedTime, setIsLimitedTime] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [badgeColor, setBadgeColor] = useState('#DC2626');
  const [priority, setPriority] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Banner fields
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerCtaText, setBannerCtaText] = useState('Shop Offer');
  const [bannerCtaLink, setBannerCtaLink] = useState('');
  const [bannerPosition, setBannerPosition] = useState<BannerPosition>('BANNER_STRIP');
  const [showBannerOnHome, setShowBannerOnHome] = useState(true);

  // Data dependencies
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { categories } = useCategories();
  const { brands } = useBrands();

  // Search filter for product picker in modal
  const [modalProductSearch, setModalProductSearch] = useState('');

  // Dynamically filter products in modal based on selected categories and brands
  const availableModalProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    let list = products;

    const hasCategoryFilter = offerType === 'CATEGORY' || selectedCategoryIds.length > 0;
    const hasBrandFilter = offerType === 'BRAND' || selectedBrandIds.length > 0;

    // Filter by selected categories if category offer or categories are chosen
    if (hasCategoryFilter) {
      if (selectedCategoryIds.length === 0) {
        return [];
      }
      list = list.filter((p: any) => {
        const pCatId = p.categoryId 
          ? (typeof p.categoryId === 'object' ? String(p.categoryId._id || p.categoryId.id) : String(p.categoryId))
          : '';
        const pSubCatId = p.subCategoryId 
          ? (typeof p.subCategoryId === 'object' ? String(p.subCategoryId._id || p.subCategoryId.id) : String(p.subCategoryId))
          : '';
        return selectedCategoryIds.some((id) => String(id) === pCatId || String(id) === pSubCatId);
      });
    }

    // Filter by selected brands if brand offer or brands are chosen
    if (hasBrandFilter) {
      if (selectedBrandIds.length === 0) {
        return [];
      }
      list = list.filter((p: any) => {
        const pBrandId = p.brandId 
          ? (typeof p.brandId === 'object' ? String(p.brandId._id || p.brandId.id) : String(p.brandId))
          : '';
        return selectedBrandIds.some((id) => String(id) === pBrandId);
      });
    }

    return list;
  }, [products, offerType, selectedCategoryIds, selectedBrandIds]);

  // Apply in-modal search to available products
  const searchedModalProducts = useMemo(() => {
    if (!modalProductSearch.trim()) return availableModalProducts;
    const q = modalProductSearch.toLowerCase();
    return availableModalProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [availableModalProducts, modalProductSearch]);

  // Fetch all offers
  const fetchOffers = async () => {
    try {
      setIsLoadingOffers(true);
      const res = await offersApi.getAll();
      setOffers(res.data);
    } catch (error) {
      console.error('Failed to load offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setIsLoadingOffers(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Filtered offers list
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesType = filterType === 'ALL' || offer.offerType === filterType;
      const matchesSearch = 
        !searchQuery ||
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (offer.code && offer.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (offer.description && offer.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [offers, filterType, searchQuery]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOffers.slice(start, start + itemsPerPage);
  }, [filteredOffers, currentPage, itemsPerPage]);

  // Key metrics
  const metrics = useMemo(() => {
    const total = offers.length;
    const active = offers.filter((o) => o.isActive).length;
    const flashSales = offers.filter((o) => o.isLimitedTime || o.offerType === 'LIMITED_TIME').length;
    const homeBanners = offers.filter((o) => o.isActive && o.banner?.showOnHome).length;
    return { total, active, flashSales, homeBanners };
  }, [offers]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingOfferId(null);
    setTitle('');
    setDescription('');
    setCode('');
    setOfferType('PRODUCT');
    setDiscountType('PERCENTAGE');
    setDiscountValue(15);
    setMinOrderValue('');
    setMaxDiscountAmount('');
    setSelectedProductIds([]);
    setSelectedCategoryIds([]);
    setSelectedBrandIds([]);
    setIsLimitedTime(false);
    setStartDate('');
    setEndDate('');
    setBadgeText('');
    setBadgeColor('#DC2626');
    setPriority(1);
    setIsActive(true);
    setBannerImageUrl('');
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerCtaText('Explore Offer');
    setBannerCtaLink('');
    setBannerPosition('BANNER_STRIP');
    setShowBannerOnHome(true);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description || '');
    setCode(offer.code || '');
    setOfferType(offer.offerType);
    setDiscountType(offer.discountType);
    setDiscountValue(offer.discountValue);
    setMinOrderValue(offer.minOrderValue ? String(offer.minOrderValue) : '');
    setMaxDiscountAmount(offer.maxDiscountAmount ? String(offer.maxDiscountAmount) : '');
    setSelectedProductIds(offer.applicableProductIds || []);
    setSelectedCategoryIds(offer.applicableCategoryIds || []);
    setSelectedBrandIds(offer.applicableBrandIds || []);
    setIsLimitedTime(offer.isLimitedTime);
    setStartDate(offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '');
    setEndDate(offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '');
    setBadgeText(offer.badgeText || '');
    setBadgeColor(offer.badgeColor || '#DC2626');
    setPriority(offer.priority);
    setIsActive(offer.isActive);
    setBannerImageUrl(offer.banner?.imageUrl || '');
    setBannerTitle(offer.banner?.title || '');
    setBannerSubtitle(offer.banner?.subtitle || '');
    setBannerCtaText(offer.banner?.ctaText || 'Explore Offer');
    setBannerCtaLink(offer.banner?.ctaLink || `/offers/${offer.id}`);
    setBannerPosition(offer.banner?.position || 'BANNER_STRIP');
    setShowBannerOnHome(offer.banner?.showOnHome ?? true);
    setIsModalOpen(true);
  };

  // Handle Banner Image Upload to Cloudinary
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      const url = await uploadApi.uploadImage(file);
      setBannerImageUrl(url);
      toast.success('Banner uploaded successfully!');
    } catch (error) {
      console.error('Banner upload failed:', error);
      toast.error('Failed to upload banner image');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Submit Offer (Create or Update)
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Offer title is required');
      return;
    }
    if (discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    const payload: CreateOfferDTO = {
      title: title.trim(),
      description: description.trim() || null,
      code: code.trim().toUpperCase() || null,
      offerType,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : null,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      applicableProductIds: selectedProductIds,
      applicableCategoryIds: selectedCategoryIds,
      applicableBrandIds: selectedBrandIds,
      isLimitedTime: Boolean(isLimitedTime || offerType === 'LIMITED_TIME'),
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      badgeText: badgeText.trim() || null,
      badgeColor: badgeColor || null,
      priority: Number(priority || 0),
      isActive,
      banner: bannerImageUrl.trim() ? {
        imageUrl: bannerImageUrl.trim(),
        title: bannerTitle.trim() || null,
        subtitle: bannerSubtitle.trim() || null,
        ctaText: bannerCtaText.trim() || 'Explore Offer',
        ctaLink: bannerCtaLink.trim() || '',
        position: bannerPosition,
        showOnHome: showBannerOnHome,
      } : null,
    };

    try {
      setIsSaving(true);
      if (editingOfferId) {
        await offersApi.update(editingOfferId, payload);
        toast.success('Offer updated successfully!');
      } else {
        await offersApi.create(payload);
        toast.success('Offer created successfully!');
      }
      setIsModalOpen(false);
      fetchOffers();
    } catch (error: any) {
      console.error('Failed to save offer:', error);
      toast.error(error?.response?.data?.message || 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (id: string) => {
    try {
      await offersApi.toggleStatus(id);
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o))
      );
      toast.success('Offer status updated');
    } catch (error) {
      toast.error('Failed to toggle offer status');
    }
  };

  // Delete offer
  const handleDeleteOffer = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete offer "${title}"?`)) return;

    try {
      await offersApi.delete(id);
      setOffers((prev) => prev.filter((o) => o.id !== id));
      toast.success('Offer deleted successfully');
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  // Helper to format remaining time
  const formatCountdown = (endDateStr?: string | null) => {
    if (!endDateStr) return null;
    const diff = new Date(endDateStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m left`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Offers & Promotions Manager</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure Brand, Category, Product, Celebration, and Flash Countdown sales. Discounts auto-apply on products with dedicated offer pages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create New Offer
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Offers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.total}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Offers</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.active}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flash Sales</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.flashSales}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Home Banners</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.homeBanners}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <LayoutTemplate size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls: Search and Type Pills */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search offer title, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-w-full">
            {['ALL', 'PRODUCT', 'CATEGORY', 'BRAND', 'CELEBRATION', 'LIMITED_TIME'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide cursor-pointer transition-colors ${
                  filterType === type
                    ? 'bg-[#1A2E4C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Offers Grid / List */}
        {isLoadingOffers ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-[#1A2E4C]" size={36} />
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Tag size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-base font-bold text-gray-800">No Offers Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-5">
              {searchQuery || filterType !== 'ALL'
                ? 'No offers match your current search and type filters.'
                : 'Get started by creating your first celebration, category, brand, or flash countdown offer!'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 bg-[#1A2E4C] text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-[#132238] transition-colors cursor-pointer"
            >
              <Plus size={14} /> Create Offer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedOffers.map((offer) => {
                const typeConfig = OFFER_TYPES.find((t) => t.type === offer.offerType) || OFFER_TYPES[0];
                const TypeIcon = typeConfig.icon;
                const countdown = formatCountdown(offer.endDate);

                return (
                  <Card key={offer.id} className="flex flex-col justify-between border-gray-200 hover:shadow-md transition-shadow overflow-hidden group">
                    <div>
                      {/* Banner thumbnail preview if set */}
                      {offer.banner?.imageUrl && (
                        <div className="relative aspect-[21/9] w-full bg-gray-100 overflow-hidden border-b">
                          <img
                            src={offer.banner.imageUrl}
                            alt={offer.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            {offer.banner.showOnHome && (
                              <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                Home Banner
                              </span>
                            )}
                            {offer.banner.position && (
                              <span className="bg-blue-600/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                {offer.banner.position}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-md ${typeConfig.color} shrink-0`}>
                              <TypeIcon size={16} />
                            </span>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                {typeConfig.label}
                              </span>
                              <CardTitle className="text-base font-bold text-gray-900 line-clamp-1">
                                {offer.title}
                              </CardTitle>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              offer.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {offer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {offer.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{offer.description}</p>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3 pb-3">
                        {/* Discount Banner Preview */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discount Rate</p>
                            <p className="text-lg font-black text-gray-900">
                              {offer.discountType === 'PERCENTAGE'
                                ? `${offer.discountValue}% OFF`
                                : `₹${offer.discountValue} OFF`}
                            </p>
                          </div>
                          {offer.badgeText && (
                            <span
                              className="text-[11px] font-bold px-2.5 py-1 rounded text-white shadow-2xs"
                              style={{ backgroundColor: offer.badgeColor || '#DC2626' }}
                            >
                              {offer.badgeText}
                            </span>
                          )}
                        </div>

                        {/* Flash sale timer status */}
                        {offer.isLimitedTime && (
                          <div className="flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded border border-rose-100">
                            <Clock size={14} className="shrink-0 animate-pulse text-rose-600" />
                            <span>{countdown ? countdown : 'Flash deal active'}</span>
                          </div>
                        )}

                        {/* Scope summary */}
                        <div className="text-[11px] text-gray-600 space-y-1">
                          {offer.applicableProductIds?.length > 0 && (
                            <p>🎯 <span className="font-semibold">{offer.applicableProductIds.length}</span> specific products targeted</p>
                          )}
                          {offer.applicableCategoryIds?.length > 0 && (
                            <p>📂 <span className="font-semibold">{offer.applicableCategoryIds.length}</span> categories selected</p>
                          )}
                          {offer.applicableBrandIds?.length > 0 && (
                            <p>🏷️ <span className="font-semibold">{offer.applicableBrandIds.length}</span> brands selected</p>
                          )}
                          {offer.offerType === 'CELEBRATION' && (
                            <p>🎉 Celebration event with auto-applied savings</p>
                          )}
                        </div>
                      </CardContent>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 py-3 bg-gray-50/75 border-t flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(offer.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          offer.isActive
                            ? 'text-gray-700 hover:bg-gray-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(offer)}
                          className="p-1.5 text-gray-500 hover:text-[#1A2E4C] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          title="Edit Offer"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOffer(offer.id, offer.title)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete Offer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOffers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[6, 9, 18, 36]}
            />
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Offer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/80">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingOfferId ? 'Edit Promotional Offer' : 'Create New Promotional Offer'}
                </h3>
                <p className="text-xs text-gray-500">Configure offer type, discount, products, and dedicated offer page banner.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSubmitOffer} className="overflow-y-auto p-6 space-y-6 flex-1">
              
              {/* Step 1: Offer Type Selector */}
              <div>
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-2">
                  Select Offer Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {OFFER_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = offerType === t.type;
                    return (
                      <div
                        key={t.type}
                        onClick={() => {
                          setOfferType(t.type);
                          if (t.type === 'LIMITED_TIME') setIsLimitedTime(true);
                        }}
                        className={`border rounded-lg p-3 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#1A2E4C] bg-[#1A2E4C]/5 ring-1 ring-[#1A2E4C]'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`p-1.5 rounded-md ${t.color}`}>
                            <Icon size={14} />
                          </div>
                          <span className="text-xs font-bold text-gray-900">{t.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-snug">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Offer Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Diwali Celebration 30% OFF"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Display Tag / Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., FESTIVE SALE or FLASH DEAL"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Describe the offer highlights for the offer page..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20"
                />
              </div>

              {/* Step 3: Discount Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Discount Value (Auto-Applied to Products)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Discount Type</label>
                    <div className="flex rounded-md border overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => setDiscountType('PERCENTAGE')}
                        className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          discountType === 'PERCENTAGE' ? 'bg-[#1A2E4C] text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Percent size={12} /> Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('FLAT')}
                        className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          discountType === 'FLAT' ? 'bg-[#1A2E4C] text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <DollarSign size={12} /> Flat (₹)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Discount Value ({discountType === 'PERCENTAGE' ? '%' : '₹'}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={discountType === 'PERCENTAGE' ? 100 : 50000}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Max Discount Cap (Optional ₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1500"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Target Selection (Categories, Brands, and Products) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Target Selection (Select Category, Brand, & Specific Products)
                  </h4>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {selectedProductIds.length} Products Chosen
                  </span>
                </div>

                {/* Category Selector if Category or Celebration */}
                {(offerType === 'CATEGORY' || offerType === 'CELEBRATION') && (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Select Target Categories {offerType === 'CATEGORY' && '(Products in category qualify)'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const isSelected = selectedCategoryIds.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== cat.id));
                              } else {
                                setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected ? 'bg-[#1A2E4C] text-white border-[#1A2E4C]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Brand Selector if Brand or Celebration */}
                {(offerType === 'BRAND' || offerType === 'CELEBRATION') && (
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      Select Target Brands {offerType === 'BRAND' && '(Products of brand qualify)'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {brands.map((brand) => {
                        const isSelected = selectedBrandIds.includes(brand.id);
                        return (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedBrandIds(selectedBrandIds.filter((id) => id !== brand.id));
                              } else {
                                setSelectedBrandIds([...selectedBrandIds, brand.id]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected ? 'bg-[#1A2E4C] text-white border-[#1A2E4C]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {brand.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Product Multi-Picker (Context-Aware to Category & Brand) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">
                        {offerType === 'CATEGORY' 
                          ? 'Select Specific Products from Selected Category' 
                          : offerType === 'BRAND'
                          ? 'Select Specific Products from Selected Brand'
                          : 'Select Specific Products for this Offer'}
                      </label>
                      <p className="text-[11px] text-gray-500">
                        {offerType === 'CATEGORY' && selectedCategoryIds.length > 0 && (
                          <span>Showing {availableModalProducts.length} products belonging to selected category(s). (Optional: leave blank to apply to all products in category)</span>
                        )}
                        {offerType === 'BRAND' && selectedBrandIds.length > 0 && (
                          <span>Showing {availableModalProducts.length} products belonging to selected brand(s). (Optional: leave blank to apply to all products of brand)</span>
                        )}
                        {offerType !== 'CATEGORY' && offerType !== 'BRAND' && (
                          <span>Pick individual products to include in this promotion.</span>
                        )}
                      </p>
                    </div>

                    {availableModalProducts.length > 0 && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const idsToAdd = availableModalProducts.map((p) => p.id);
                            setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...idsToAdd])));
                          }}
                          className="text-[11px] text-[#1A2E4C] hover:underline font-semibold cursor-pointer"
                        >
                          Select All ({availableModalProducts.length})
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            const availableIds = new Set(availableModalProducts.map((p) => p.id));
                            setSelectedProductIds(selectedProductIds.filter((id) => !availableIds.has(id)));
                          }}
                          className="text-[11px] text-gray-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Empty Guidance States */}
                  {offerType === 'CATEGORY' && selectedCategoryIds.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed rounded-lg bg-gray-50/70">
                      <Layers size={22} className="mx-auto text-blue-500 mb-2" />
                      <p className="text-xs font-bold text-gray-800">No Categories Selected</p>
                      <p className="text-[11px] text-gray-500 max-w-sm mx-auto mt-0.5">
                        Please select one or more categories above. Only products belonging to the selected categories will appear here.
                      </p>
                    </div>
                  ) : offerType === 'BRAND' && selectedBrandIds.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed rounded-lg bg-gray-50/70">
                      <Tag size={22} className="mx-auto text-indigo-500 mb-2" />
                      <p className="text-xs font-bold text-gray-800">No Brands Selected</p>
                      <p className="text-[11px] text-gray-500 max-w-sm mx-auto mt-0.5">
                        Please select one or more brands above. Only products belonging to the selected brands will appear here.
                      </p>
                    </div>
                  ) : availableModalProducts.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed rounded-lg bg-gray-50/70">
                      <Package size={22} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-xs font-bold text-gray-800">No Products Found</p>
                      <p className="text-[11px] text-gray-500 max-w-sm mx-auto mt-0.5">
                        There are currently no products associated with the selected category or brand.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search in available products..."
                          value={modalProductSearch}
                          onChange={(e) => setModalProductSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 border rounded-md bg-gray-50/50">
                        {searchedModalProducts.map((p) => {
                          const isSelected = selectedProductIds.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                                } else {
                                  setSelectedProductIds([...selectedProductIds, p.id]);
                                }
                              }}
                              className={`p-2 border rounded-md bg-white cursor-pointer transition-all flex items-center gap-2 ${
                                isSelected ? 'border-[#1A2E4C] ring-1 ring-[#1A2E4C] bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="w-9 h-9 rounded bg-gray-100 overflow-hidden shrink-0">
                                {p.thumbnail ? (
                                  <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">No img</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-gray-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-gray-500">₹{p.variants?.[0]?.price || '0'}</p>
                              </div>
                              {isSelected && <Check size={14} className="text-[#1A2E4C] shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 5: Countdown Timing */}
              <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-700" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Flash Sale Countdown Timing
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLimitedTime}
                      onChange={(e) => setIsLimitedTime(e.target.checked)}
                      className="rounded text-[#1A2E4C] focus:ring-[#1A2E4C]"
                    />
                    Enable Countdown Timer
                  </label>
                </div>

                {isLimitedTime && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">End Date & Time (Expiry) *</label>
                      <input
                        type="datetime-local"
                        required={isLimitedTime}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 6: Homepage Banner Configuration */}
              <div className="bg-blue-50/40 border border-blue-200 p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate size={16} className="text-blue-700" />
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Storefront Banner & Offer Page
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBannerOnHome}
                      onChange={(e) => setShowBannerOnHome(e.target.checked)}
                      className="rounded text-[#1A2E4C] focus:ring-[#1A2E4C]"
                    />
                    Feature Banner on Home Page
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Banner Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste banner image URL or upload below..."
                        value={bannerImageUrl}
                        onChange={(e) => setBannerImageUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                      />
                      <label className="flex items-center gap-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer shrink-0">
                        {isUploadingBanner ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={isUploadingBanner}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Banner Live Preview */}
                  {bannerImageUrl && (
                    <div className="relative aspect-[21/8] w-full rounded-md overflow-hidden bg-gray-900 border">
                      <img src={bannerImageUrl} alt="Banner Preview" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center p-4 sm:p-6 text-white">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 mb-1">
                          {badgeText || `${discountValue}% OFF`}
                        </span>
                        <h4 className="text-lg sm:text-2xl font-black">{bannerTitle || title}</h4>
                        <p className="text-xs sm:text-sm text-gray-200 line-clamp-1 max-w-sm mt-0.5">{bannerSubtitle || description}</p>
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-1 bg-white text-black text-xs font-bold px-3 py-1 rounded">
                            {bannerCtaText || 'Explore Offer'} <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Banner Heading</label>
                      <input
                        type="text"
                        placeholder="e.g. Flash Sale Ending Tonight"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Banner Subheading</label>
                      <input
                        type="text"
                        placeholder="e.g. Extra 20% off all apparel"
                        value={bannerSubtitle}
                        onChange={(e) => setBannerSubtitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        placeholder="Explore Offer"
                        value={bannerCtaText}
                        onChange={(e) => setBannerCtaText(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Placement Position</label>
                      <select
                        value={bannerPosition}
                        onChange={(e) => setBannerPosition(e.target.value as BannerPosition)}
                        className="w-full px-3 py-1.5 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                      >
                        <option value="HERO">Hero Banner Carousel</option>
                        <option value="BANNER_STRIP">Promotional Strip</option>
                        <option value="EXCLUSIVE">Exclusive Bar</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 7: Priority & Active Status */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-[#1A2E4C] focus:ring-[#1A2E4C]"
                  />
                  Activate Offer Immediately
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-700">Display Priority:</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs border rounded text-center focus:outline-none focus:ring-1 focus:ring-[#1A2E4C]"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white px-5 py-2 text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingOfferId ? 'Save Changes' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
