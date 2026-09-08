'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  Plus,
  Trash2,
  Upload,
  Eye,
  Smartphone,
  Monitor,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Clock,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import {
  contentApi,
  HeroBannerSlide,
  HeroBannersConfig,
  DEFAULT_HERO_CONFIG,
} from '@/api/admin/content';
import { toast } from 'sonner';

import { useCategories } from '@/hooks/admin/useCategories';

export default function AdminContentPage() {
  const { categories } = useCategories();
  const [config, setConfig] = useState<HeroBannersConfig>(DEFAULT_HERO_CONFIG);
  const [selectedSlideId, setSelectedSlideId] = useState<string>('default-hero-1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await contentApi.getHeroBanners();
        setConfig(data);
        if (data.slides.length > 0) {
          setSelectedSlideId(data.slides[0].id);
        }
      } catch (err) {
        console.error('Failed to load content config:', err);
        toast.error('Failed to load current content settings');
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const currentSlide =
    config.slides.find((s) => s.id === selectedSlideId) || config.slides[0];

  const updateCurrentSlide = (field: keyof HeroBannerSlide, value: any) => {
    if (!currentSlide) return;
    setConfig((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === currentSlide.id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleAddSlide = () => {
    const newId = `hero-${Date.now()}`;
    const newSlide: HeroBannerSlide = {
      id: newId,
      badgeText: 'SPECIAL COLLECTION',
      title: 'NEW SEASON ARRIVALS',
      subtitle: 'Discover refined craftsmanship with modern silhouettes tailored for luxury comfort.',
      buttonText: 'Shop The Drop',
      buttonLink: '/shop',
      secondaryButtonText: 'Learn More',
      secondaryButtonLink: '/shop',
      imageUrl: DEFAULT_HERO_CONFIG.slides[0]?.imageUrl || '',
      textAlign: 'left',
      theme: 'dark',
      overlayOpacity: 45,
      isActive: true,
      order: config.slides.length + 1,
    };

    setConfig((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setSelectedSlideId(newId);
    toast.success('New banner slide added');
  };

  const handleDeleteSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.slides.length <= 1) {
      toast.error('At least one banner slide must remain');
      return;
    }

    const filtered = config.slides.filter((s) => s.id !== id);
    setConfig((prev) => ({ ...prev, slides: filtered }));
    if (selectedSlideId === id) {
      setSelectedSlideId(filtered[0]?.id || '');
    }
    toast.info('Slide removed');
  };

  const [uploadingField, setUploadingField] = useState<'desktop' | 'mobile' | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'mobileImageUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingField(field === 'mobileImageUrl' ? 'mobile' : 'desktop');
    setIsUploading(true);
    try {
      const url = await contentApi.uploadImage(file);
      updateCurrentSlide(field, url);
      toast.success(`${field === 'mobileImageUrl' ? 'Mobile' : 'Desktop'} banner uploaded successfully`);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to reset banners to initial defaults?')) {
      setConfig(DEFAULT_HERO_CONFIG);
      setSelectedSlideId(DEFAULT_HERO_CONFIG.slides[0].id);
      toast.info('Reset to default template');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await contentApi.updateHeroBanners(config);
      toast.success('Homepage banner content published successfully!');
    } catch (err: any) {
      console.error('Failed to save banner config:', err);
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Content Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Customize homepage hero banners, promotional headlines, CTA buttons, and visuals with live preview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-5"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save & Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Slides & Form Settings (7 cols on XL) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Banner Carousel Settings Bar */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Homepage Hero Slides</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddSlide}
                  className="flex items-center gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Slide
                </Button>
              </div>
              <CardDescription className="text-xs">
                Select a slide to edit its text, button, and image. Toggle active slides to display in the carousel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {/* Slide Tabs / Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {config.slides.map((slide, idx) => {
                  const isSelected = slide.id === selectedSlideId;
                  return (
                    <div
                      key={slide.id}
                      onClick={() => setSelectedSlideId(slide.id)}
                      className={`relative p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
                          : 'border-border hover:border-muted-foreground/40 bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Slide #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              slide.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                          />
                          {config.slides.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSlide(slide.id, e)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                              title="Delete Slide"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-foreground line-clamp-1">
                        {slide.title || 'Untitled Banner'}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        CTA: {slide.buttonText || 'No Button'}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[120px]">
                          {slide.badgeText || 'No Badge'}
                        </span>
                        <span className={slide.isActive ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                          {slide.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Carousel Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t text-sm">
                <div className="flex items-center gap-3">
                  <Switch
                    id="autoplay-toggle"
                    checked={config.autoPlay}
                    onCheckedChange={(val) => setConfig((prev) => ({ ...prev, autoPlay: val }))}
                  />
                  <Label htmlFor="autoplay-toggle" className="text-xs font-medium cursor-pointer">
                    Autoplay carousel transitions
                  </Label>
                </div>

                {config.autoPlay && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Slide duration:</span>
                    <select
                      value={config.autoPlayInterval}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          autoPlayInterval: Number(e.target.value),
                        }))
                      }
                      className="px-2 py-1 text-xs border rounded-md bg-background focus:ring-1 focus:ring-primary"
                    >
                      <option value={4}>4 seconds</option>
                      <option value={6}>6 seconds</option>
                      <option value={8}>8 seconds</option>
                      <option value={10}>10 seconds</option>
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Slide Form Editor */}
          {currentSlide && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>Edit Slide Content</span>
                    <span className="text-xs font-normal px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {currentSlide.id}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="slide-active" className="text-xs text-muted-foreground">
                      Display on Storefront
                    </Label>
                    <Switch
                      id="slide-active"
                      checked={currentSlide.isActive}
                      onCheckedChange={(val) => updateCurrentSlide('isActive', val)}
                    />
                  </div>
                </div>
                <CardDescription className="text-xs">
                  All changes appear instantly in the live preview on the right.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Category Selection for Banner Route */}
                <div className="space-y-1.5 pt-2 border-t">
                  <Label className="text-xs font-semibold">Banner Category Link</Label>
                  <select
                    value={currentSlide.categorySlug || ''}
                    onChange={(e) => {
                      const selectedSlug = e.target.value;
                      const matchedCat = categories?.find((c) => c.slug === selectedSlug || c.id === selectedSlug) as any;
                      setConfig((prev) => ({
                        ...prev,
                        slides: prev.slides.map((s) =>
                          s.id === currentSlide.id
                            ? {
                                ...s,
                                categoryId: matchedCat?.id || matchedCat?._id || '',
                                categorySlug: selectedSlug,
                                buttonLink: selectedSlug ? `/shop?category=${selectedSlug}` : s.buttonLink,
                              }
                            : s
                        ),
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- No Category Link (Custom URL) --</option>
                    {categories?.map((cat) => (
                      <option key={cat.id || (cat as any)._id || cat.slug} value={cat.slug}>
                        {cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Selecting a category will automatically route users to that category page when clicking the banner image.
                  </p>
                </div>

                {/* Show Text Overlay Toggle */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-text-overlay" className="text-xs font-semibold">
                      Show Text Overlay on Banner
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Turn off to display clean graphics without title, subtitle, or buttons overlaid on top of the image.
                    </p>
                  </div>
                  <Switch
                    id="show-text-overlay"
                    checked={currentSlide.showTextOverlay ?? false}
                    onCheckedChange={(val) => updateCurrentSlide('showTextOverlay', val)}
                  />
                </div>

                {/* Text fields (Badge, Title, Subtitle, Buttons) - conditionally disabled/dimmed or shown */}
                {currentSlide.showTextOverlay && (
                  <div className="space-y-5 pt-2 border-t animate-in fade-in duration-200">
                    {/* Badge / Tag & Text Alignment */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label className="text-xs font-semibold">Badge / Eyebrow Tag</Label>
                        <Input
                          value={currentSlide.badgeText || ''}
                          onChange={(e) => updateCurrentSlide('badgeText', e.target.value)}
                          placeholder="e.g. NEW ARRIVALS, SUMMER 2026, EXCLUSIVE"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Text Alignment</Label>
                        <select
                          value={currentSlide.textAlign || 'left'}
                          onChange={(e) => updateCurrentSlide('textAlign', e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-primary"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>

                    {/* Title / Headline */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Banner Title / Headline <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={currentSlide.title}
                        onChange={(e) => updateCurrentSlide('title', e.target.value)}
                        placeholder="e.g. THE ART OF EFFORTLESS LUXURY"
                        className="font-medium"
                      />
                    </div>

                    {/* Subtitle / Description */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Subtitle / Description</Label>
                      <Textarea
                        value={currentSlide.subtitle || ''}
                        onChange={(e) => updateCurrentSlide('subtitle', e.target.value)}
                        placeholder="Provide a brief compelling description of the collection or offer..."
                        rows={3}
                        className="resize-none text-sm"
                      />
                    </div>

                    {/* Button 1 (Primary) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Primary Button Text <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={currentSlide.buttonText}
                          onChange={(e) => updateCurrentSlide('buttonText', e.target.value)}
                          placeholder="e.g. Shop Collection"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Primary Button Link URL <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={currentSlide.buttonLink}
                          onChange={(e) => updateCurrentSlide('buttonLink', e.target.value)}
                          placeholder="e.g. /shop or /shop?category=linen"
                        />
                      </div>
                    </div>

                    {/* Button 2 (Secondary, Optional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Secondary Button Text <span className="text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Input
                          value={currentSlide.secondaryButtonText || ''}
                          onChange={(e) => updateCurrentSlide('secondaryButtonText', e.target.value)}
                          placeholder="e.g. Explore Offers"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Secondary Button Link URL <span className="text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Input
                          value={currentSlide.secondaryButtonLink || ''}
                          onChange={(e) => updateCurrentSlide('secondaryButtonLink', e.target.value)}
                          placeholder="e.g. /offers"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Banner Image Selection & Upload */}
                <div className="space-y-4 pt-2 border-t">
                  <Label className="text-xs font-semibold">Banner Background Images</Label>

                  {/* Desktop Banner Image Card */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Desktop Banner Graphic (Default)</span>
                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-card">
                      <div className="relative w-24 h-14 rounded overflow-hidden bg-muted border flex items-center justify-center shrink-0">
                        {currentSlide.imageUrl ? (
                          <img
                            src={currentSlide.imageUrl}
                            alt="Desktop Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {currentSlide.imageUrl ? 'Desktop Image Attached' : 'No Desktop Image'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Used on desktop and wide screens (1440 x 680 ratio).
                        </p>
                      </div>
                      <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border rounded-md bg-secondary text-secondary-foreground text-xs font-medium cursor-pointer hover:bg-secondary/80 transition-colors shrink-0">
                        {isUploading && uploadingField === 'desktop' ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>{isUploading && uploadingField === 'desktop' ? 'Uploading...' : 'Upload Desktop'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'imageUrl')}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Mobile Banner Image Card */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Mobile Banner Graphic (Optional)</span>
                    <div className="flex items-center gap-4 p-3 border rounded-lg bg-card">
                      <div className="relative w-16 h-20 rounded overflow-hidden bg-muted border flex items-center justify-center shrink-0">
                        {currentSlide.mobileImageUrl || currentSlide.imageUrl ? (
                          <img
                            src={currentSlide.mobileImageUrl || currentSlide.imageUrl}
                            alt="Mobile Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-foreground">
                          {currentSlide.mobileImageUrl ? 'Mobile Image Attached' : 'Using Desktop Fallback'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Upload portrait/square banner optimized specifically for smartphones.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {currentSlide.mobileImageUrl && (
                          <button
                            type="button"
                            onClick={() => updateCurrentSlide('mobileImageUrl', '')}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors text-xs"
                            title="Remove Mobile Image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border rounded-md bg-secondary text-secondary-foreground text-xs font-medium cursor-pointer hover:bg-secondary/80 transition-colors">
                          {isUploading && uploadingField === 'mobile' ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <span>{isUploading && uploadingField === 'mobile' ? 'Uploading...' : 'Upload Mobile'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'mobileImageUrl')}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Overlay & Contrast Control */}
                {currentSlide.showTextOverlay && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Overlay Darkness</Label>
                        <span className="text-xs text-muted-foreground font-mono">
                          {currentSlide.overlayOpacity ?? 45}%
                        </span>
                      </div>
                      <input
                        type="range"
                        value={currentSlide.overlayOpacity ?? 45}
                        onChange={(e) => updateCurrentSlide('overlayOpacity', Number(e.target.value))}
                        min={0}
                        max={90}
                        step={5}
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Increases darkness to ensure white text stays crisp and readable over bright images.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Color Scheme Theme</Label>
                      <select
                        value={currentSlide.theme || 'dark'}
                        onChange={(e) => updateCurrentSlide('theme', e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-primary"
                      >
                        <option value="dark">Dark Overlay (Crisp White Text)</option>
                        <option value="light">Light Overlay (Contrast Dark Text)</option>
                      </select>
                      <p className="text-[11px] text-muted-foreground">
                        Choose dark overlay for fashion photography with prominent white headings.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Interactive Preview (5 cols on XL) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-4">
            <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
              <CardHeader className="bg-muted/40 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Storefront Live Preview</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 bg-background border rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                        previewMode === 'desktop'
                          ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Desktop View"
                    >
                      <Monitor className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                        previewMode === 'mobile'
                          ? 'bg-primary text-primary-foreground font-medium shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Mobile View"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Mobile</span>
                    </button>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Real-time preview of how visitors see this banner on the storefront.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 bg-gray-900/5 flex flex-col items-center justify-center">
                {/* Container for Preview with Desktop or Mobile viewport simulation */}
                <div
                  className={`transition-all duration-300 w-full overflow-hidden ${
                    previewMode === 'mobile' ? 'max-w-[340px] shadow-2xl rounded-3xl border-4 border-gray-800' : 'w-full'
                  }`}
                >
                  {/* Banner Card Simulation */}
                  <div
                    className={`relative w-full overflow-hidden shadow-md bg-gray-950 flex flex-col justify-center ${
                      previewMode === 'mobile' ? 'aspect-[4/5] min-h-[320px]' : 'aspect-[1440/680] min-h-[240px]'
                    }`}
                  >
                    {/* Background Image */}
                    {(previewMode === 'mobile' && currentSlide?.mobileImageUrl) || currentSlide?.imageUrl ? (
                      <img
                        src={
                          previewMode === 'mobile' && currentSlide?.mobileImageUrl
                            ? currentSlide.mobileImageUrl
                            : currentSlide?.imageUrl
                        }
                        alt={currentSlide?.title || 'Banner'}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        onError={(e) => {
                          if (DEFAULT_HERO_CONFIG.slides[0]?.imageUrl) {
                            (e.target as HTMLImageElement).src = DEFAULT_HERO_CONFIG.slides[0].imageUrl;
                          }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-black" />
                    )}

                    {/* Dynamic Gradient Overlay */}
                    {currentSlide?.showTextOverlay && (
                      <div
                        className={`absolute inset-0 transition-opacity duration-300 ${
                          currentSlide?.theme === 'light'
                            ? 'bg-gradient-to-r from-white via-white/80 to-transparent'
                            : 'bg-gradient-to-r from-black via-black/60 to-transparent'
                        }`}
                        style={{
                          opacity: (currentSlide?.overlayOpacity ?? 45) / 100,
                        }}
                      />
                    )}

                    {/* Content Container */}
                    {currentSlide?.showTextOverlay && (
                      <div
                        className={`relative z-10 p-6 sm:p-8 flex flex-col ${
                          currentSlide?.textAlign === 'center'
                            ? 'items-center text-center'
                            : currentSlide?.textAlign === 'right'
                            ? 'items-end text-right'
                            : 'items-start text-left'
                        } ${currentSlide?.theme === 'light' ? 'text-gray-900' : 'text-white'}`}
                      >
                        {/* Badge */}
                        {currentSlide?.badgeText && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/30 text-white mb-2 shadow-xs">
                            <Sparkles className="h-3 w-3 text-amber-300" />
                            <span>{currentSlide.badgeText}</span>
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight drop-shadow-md max-w-md">
                          {currentSlide?.title || 'Your Banner Title'}
                        </h2>

                        {/* Subtitle */}
                        {currentSlide?.subtitle && (
                          <p className="text-xs sm:text-sm mt-1.5 opacity-90 line-clamp-3 max-w-sm drop-shadow-xs font-normal">
                            {currentSlide.subtitle}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          {currentSlide?.buttonText && (
                            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-gray-950 text-xs font-bold shadow-md hover:bg-gray-100 transition-transform">
                              <span>{currentSlide.buttonText}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          )}
                          {currentSlide?.secondaryButtonText && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-black/40 backdrop-blur-md border border-white/30 text-white text-xs font-semibold hover:bg-black/60 transition-colors">
                              <span>{currentSlide.secondaryButtonText}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full mt-4 p-3 rounded-lg bg-background border text-xs space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Live Changes are Saved Instantly to Preview</span>
                  </div>
                  <p className="text-[11px]">
                    Click <strong>"Save & Publish"</strong> above to apply your changes directly to the live homepage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

