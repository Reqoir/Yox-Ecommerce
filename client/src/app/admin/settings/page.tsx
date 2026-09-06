'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Store,
  Truck,
  CreditCard,
  RotateCcw,
  Megaphone,
  Save,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Banknote,
  Percent,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  Camera,
  Layers,
  ShoppingBag,
  Info,
  Sliders,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { StoreConfig, DEFAULT_STORE_CONFIG } from '@/api/admin/settings';
import { offersApi, Offer } from '@/api/admin/offers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type SettingsTab = 'general' | 'shipping' | 'payments' | 'returns' | 'announcement';

export default function AdminSettingsPage() {
  const { config, isLoading, isSaving, fetchSettings, updateSettings, resetToDefaults } = useStoreSettingsStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [formData, setFormData] = useState<StoreConfig>(config);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [isCustomLink, setIsCustomLink] = useState(false);

  // Load active offers for banner action destination selector
  useEffect(() => {
    offersApi.getActive()
      .then((offers) => setActiveOffers(offers || []))
      .catch((err) => console.error('Failed to load active offers for announcement selector', err));
  }, []);

  // Determine which option is currently selected in the destination dropdown
  const matchedKnownAction = useMemo(() => {
    const link = formData.announcementLink;
    if (link === '' || link === undefined || link === null) return 'none';
    if (link === '/') return '/';
    if (link === '/shop') return '/shop';
    if (link === '/offers') return '/offers';
    if (link === '/shop?tag=NEW') return '/shop?tag=NEW';
    const foundOffer = activeOffers.find((o) => `/offers/${o.id}` === link);
    if (foundOffer) return `/offers/${foundOffer.id}`;
    return 'custom';
  }, [formData.announcementLink, activeOffers]);

  const currentSelectValue = isCustomLink ? 'custom' : matchedKnownAction;

  const handleActionSelect = (val: string) => {
    if (val === 'custom') {
      setIsCustomLink(true);
      if (!formData.announcementLink) {
        handleChange('announcementLink', '');
      }
    } else if (val === 'none') {
      setIsCustomLink(false);
      handleChange('announcementLink', '');
    } else {
      setIsCustomLink(false);
      handleChange('announcementLink', val);
    }
  };

  // Sync form state when config loads from server
  useEffect(() => {
    fetchSettings().then((fresh) => {
      setFormData(fresh);
      setHasInitialized(true);
    });
  }, [fetchSettings]);

  // Track dirty state
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(config);
  }, [formData, config]);

  const handleChange = <K extends keyof StoreConfig>(key: K, value: StoreConfig[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const [justSaved, setJustSaved] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const fresh = await updateSettings(formData);
      setFormData(fresh);
      setJustSaved(true);
      toast.success('Store settings saved successfully!', {
        description: 'Customer storefront policies and thresholds have been updated in real-time.',
      });
      setTimeout(() => {
        setJustSaved(false);
      }, 2500);
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save store settings. Please check your connection.');
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset all store settings to default operational values?')) {
      try {
        const reset = await resetToDefaults();
        setFormData(reset);
        toast.success('Settings restored to defaults!');
      } catch (err) {
        toast.error('Failed to reset settings.');
      }
    }
  };

  const handleDiscard = () => {
    setFormData(config);
    toast.info('Changes discarded');
  };

  // Preview computations
  const previewSampleSubtotal = 499;
  const previewFreeRemaining = Math.max(0, formData.freeShippingThreshold - previewSampleSubtotal);
  const previewProgress = Math.min(100, Math.round((previewSampleSubtotal / (formData.freeShippingThreshold || 1)) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-36 max-w-[1400px]">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Store Settings</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-xs">
              Live E-Commerce Engine
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage store identity, dynamic shipping thresholds, payment policies, return rules, and storefront announcements.
          </p>
        </div>

        {/* Global Overview Pills & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <span>Customer Storefront</span>
            <ExternalLink size={12} />
          </Link>

          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              Discard
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || !isDirty}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isDirty
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Settings</span>
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Multi-Tab Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tabs Navigation & Settings Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Custom Tabs Header */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-2xl border flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'general'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Store size={15} className={activeTab === 'general' ? 'text-primary' : ''} />
              <span>Identity & Contact</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'shipping'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Truck size={15} className={activeTab === 'shipping' ? 'text-primary' : ''} />
              <span>Shipping & Delivery</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'payments'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <CreditCard size={15} className={activeTab === 'payments' ? 'text-primary' : ''} />
              <span>Payments & COD</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('returns')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'returns'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <RotateCcw size={15} className={activeTab === 'returns' ? 'text-primary' : ''} />
              <span>Returns & Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('announcement')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'announcement'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Megaphone size={15} className={activeTab === 'announcement' ? 'text-primary' : ''} />
              <span>Announcement Bar</span>
            </button>
          </div>

          {/* TAB 1: General Store Identity & Contact */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Store size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Store Brand & Identity</CardTitle>
                      <CardDescription className="text-xs">
                        Configure customer-facing brand name, tagline, and regional defaults.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Store Name</label>
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => handleChange('storeName', e.target.value)}
                        placeholder="e.g. YOX Men's Fashion"
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Currency Symbol & Code</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={formData.currencySymbol}
                          onChange={(e) => handleChange('currencySymbol', e.target.value)}
                          placeholder="e.g. ₹"
                          className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                        />
                        <input
                          type="text"
                          value={formData.currency}
                          onChange={(e) => handleChange('currency', e.target.value)}
                          placeholder="e.g. INR"
                          className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Brand Tagline & Mission</label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => handleChange('tagline', e.target.value)}
                      placeholder="e.g. Elevate Your Style with Premium Contemporary Apparel"
                      className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Displayed on the storefront footer, meta tags, and welcome messages.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Phone size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Customer Support & Headquarters</CardTitle>
                      <CardDescription className="text-xs">
                        Official contact channels displayed across the top bar, footer, and emails.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Mail size={13} className="text-muted-foreground" />
                        <span>Support Email Address</span>
                      </label>
                      <input
                        type="email"
                        value={formData.supportEmail}
                        onChange={(e) => handleChange('supportEmail', e.target.value)}
                        placeholder="e.g. support@yox.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Phone size={13} className="text-muted-foreground" />
                        <span>Support Hotline / Phone</span>
                      </label>
                      <input
                        type="text"
                        value={formData.supportPhone}
                        onChange={(e) => handleChange('supportPhone', e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MapPin size={13} className="text-muted-foreground" />
                      <span>Physical Store & Return Warehouse Address</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.storeAddress}
                      onChange={(e) => handleChange('storeAddress', e.target.value)}
                      placeholder="e.g. YOX Fashion House, BKC, Bandra East, Mumbai, Maharashtra 400051"
                      className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: Shipping, Logistics & Delivery */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Truck size={18} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">Free Shipping Threshold & Delivery Fee</CardTitle>
                        <CardDescription className="text-xs">
                          Orders meeting or exceeding this threshold dynamically receive 100% Free Shipping.
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Free Shipping Threshold ({formData.currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                          {formData.currencySymbol}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={formData.freeShippingThreshold}
                          onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      {/* Preset Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">Presets:</span>
                        {[499, 699, 899, 999, 1499].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleChange('freeShippingThreshold', amt)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                              formData.freeShippingThreshold === amt
                                ? 'bg-primary text-primary-foreground font-bold'
                                : 'bg-muted hover:bg-muted/80 text-foreground'
                            }`}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Standard Delivery Charge ({formData.currencySymbol})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                          {formData.currencySymbol}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={formData.standardShippingFee}
                          onChange={(e) => handleChange('standardShippingFee', Number(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Charged on orders whose subtotal is below the Free Shipping threshold.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Info size={14} className="text-primary" />
                      <span>Live Customer Impact</span>
                    </div>
                    <p>
                      When customer bag is below <strong>{formData.currencySymbol}{formData.freeShippingThreshold}</strong>, Cart and Checkout will automatically display a progress bar and add <strong>{formData.currencySymbol}{formData.standardShippingFee}</strong> delivery fee.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Clock size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Estimated Delivery Timeframe</CardTitle>
                      <CardDescription className="text-xs">
                        Displayed on checkout and order confirmation receipts.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Minimum Delivery (Days)</label>
                      <input
                        type="number"
                        min={1}
                        max={14}
                        value={formData.estimatedDeliveryDaysMin}
                        onChange={(e) => handleChange('estimatedDeliveryDaysMin', Number(e.target.value) || 1)}
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Maximum Delivery (Days)</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formData.estimatedDeliveryDaysMax}
                        onChange={(e) => handleChange('estimatedDeliveryDaysMax', Number(e.target.value) || 1)}
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-xs font-bold text-foreground">Primary Courier Partner</label>
                      <input
                        type="text"
                        value={formData.deliveryPartner}
                        onChange={(e) => handleChange('deliveryPartner', e.target.value)}
                        placeholder="e.g. Delhivery / BlueDart Express"
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Payments, Taxes & COD */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Banknote size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Cash on Delivery (COD) Controls</CardTitle>
                      <CardDescription className="text-xs">
                        Control risk by enabling/disabling cash on delivery or capping order amounts.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card/60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Allow Cash on Delivery</span>
                        {formData.codEnabled ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            ACTIVE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-rose-600 border-rose-200 text-[10px]">
                            DISABLED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        When disabled, customers at checkout will only see online payment options (Razorpay/UPI).
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.codEnabled}
                        onChange={(e) => handleChange('codEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {formData.codEnabled && (
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-foreground">
                        Maximum Order Value for COD ({formData.currencySymbol})
                      </label>
                      <div className="relative max-w-sm">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                          {formData.currencySymbol}
                        </span>
                        <input
                          type="number"
                          min={500}
                          step={500}
                          value={formData.codMaxLimit}
                          onChange={(e) => handleChange('codMaxLimit', Number(e.target.value) || 0)}
                          className="w-full pl-8 pr-4 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Orders above this amount must be paid online to prevent high-value shipping fraud.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Percent size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Tax & GST Configuration</CardTitle>
                      <CardDescription className="text-xs">
                        Configure regional taxation calculations on orders.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Standard Tax / GST Rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={1}
                          value={formData.taxRatePercent}
                          onChange={(e) => handleChange('taxRatePercent', Number(e.target.value) || 0)}
                          className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Tax Display Policy</label>
                      <div className="flex items-center justify-between p-2.5 rounded-xl border bg-card/60">
                        <span className="text-xs text-foreground font-medium">Prices are Inclusive of Tax</span>
                        <input
                          type="checkbox"
                          checked={formData.isTaxInclusive}
                          onChange={(e) => handleChange('isTaxInclusive', e.target.checked)}
                          className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: Returns Policy & RMA */}
          {activeTab === 'returns' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <RotateCcw size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Customer Return Window & Eligibility</CardTitle>
                      <CardDescription className="text-xs">
                        Configure return request deadlines and mandatory photographic verification.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card/60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Accept Customer Return Requests</span>
                        {formData.returnsEnabled ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            ACTIVE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-rose-600 border-rose-200 text-[10px]">
                            SUSPENDED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Allow customers to submit return requests for delivered items in their order history.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.returnsEnabled}
                        onChange={(e) => handleChange('returnsEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Return Window (Days from Delivery)</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={formData.returnWindowDays}
                        onChange={(e) => handleChange('returnWindowDays', Number(e.target.value) || 7)}
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">Presets:</span>
                        {[7, 10, 14, 30].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => handleChange('returnWindowDays', days)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                              formData.returnWindowDays === days
                                ? 'bg-primary text-primary-foreground font-bold'
                                : 'bg-muted hover:bg-muted/80 text-foreground'
                            }`}
                          >
                            {days} Days
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Camera size={13} className="text-muted-foreground" />
                        <span>Minimum Required Photos</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.minEvidencePhotos}
                        onChange={(e) => handleChange('minEvidencePhotos', Number(e.target.value) || 3)}
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Customer must attach this many photos (e.g. front, back, tag/defect) to submit.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Customer Return Terms Notice</label>
                    <textarea
                      rows={2}
                      value={formData.returnPolicyNotice}
                      onChange={(e) => handleChange('returnPolicyNotice', e.target.value)}
                      placeholder="e.g. Hassle-free 7-day returns on unworn items with original tags."
                      className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Displayed on customer product pages and inside the return modal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: Announcement Bar & Maintenance */}
          {activeTab === 'announcement' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="rounded-2xl border shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Megaphone size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Top Announcement Banner</CardTitle>
                      <CardDescription className="text-xs">
                        Broadcast flash sales, coupon codes, and notices at the very top of every store page.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card/60">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Show Announcement Bar</span>
                        {formData.announcementEnabled ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            ACTIVE ON STORE
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            HIDDEN
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Toggle the global announcement strip on or off.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.announcementEnabled}
                        onChange={(e) => handleChange('announcementEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Announcement Message</label>
                    <input
                      type="text"
                      value={formData.announcementText}
                      onChange={(e) => handleChange('announcementText', e.target.value)}
                      placeholder="e.g. ⚡ Festive Sale: Extra 10% Off with Code YOX10 | Free Shipping on Orders Above ₹699"
                      className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground">Banner Click Action Link</label>
                        <span className="text-[11px] text-muted-foreground">Select destination</span>
                      </div>

                      <select
                        value={currentSelectValue}
                        onChange={(e) => handleActionSelect(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                      >
                        <optgroup label="Standard Store Pages">
                          <option value="/">🏠 Homepage (/)</option>
                          <option value="/shop">🛍️ Shop Page — All Products (/shop)</option>
                          <option value="/offers">🎁 Offers & Deals Page (/offers)</option>
                          <option value="/shop?tag=NEW">✨ New Arrivals (/shop?tag=NEW)</option>
                        </optgroup>

                        {activeOffers.length > 0 && (
                          <optgroup label="Active Campaigns & Offers">
                            {activeOffers.map((offer) => (
                              <option key={offer.id} value={`/offers/${offer.id}`}>
                                🔥 Offer: {offer.title} {offer.badgeText ? `[${offer.badgeText}]` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}

                        <optgroup label="Other Actions">
                          <option value="custom">🔗 Custom URL / External Link...</option>
                          <option value="none">🚫 No Action (Text Only — Unclickable)</option>
                        </optgroup>
                      </select>

                      {/* If custom is selected or active, show the custom text input */}
                      {currentSelectValue === 'custom' && (
                        <div className="pt-1 space-y-1">
                          <input
                            type="text"
                            value={formData.announcementLink}
                            onChange={(e) => handleChange('announcementLink', e.target.value)}
                            placeholder="Enter custom path (e.g. /shop?category=shirts) or full URL"
                            className="w-full px-3.5 py-2 text-xs bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                        <ExternalLink size={12} className="shrink-0 text-primary" />
                        <span>Redirects to:</span>
                        <span className="font-mono font-semibold text-foreground px-1.5 py-0.5 rounded-md bg-muted/60 text-[11px] truncate max-w-[240px]">
                          {formData.announcementLink ? formData.announcementLink : '(None — click disabled)'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Theme Background</label>
                      <select
                        value={formData.announcementBgColor}
                        onChange={(e) => handleChange('announcementBgColor', e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="bg-black">Sleek Jet Black (Classic)</option>
                        <option value="bg-[#1A2E4C]">Navy Blue Brand (#1A2E4C)</option>
                        <option value="bg-emerald-900">Emerald Pine (Festive)</option>
                        <option value="bg-purple-900">Royal Purple (Luxury)</option>
                        <option value="bg-rose-900">Crimson Red (Sale Event)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Mode Emergency Card */}
              <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-xs">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-amber-900 dark:text-amber-200">
                        Maintenance Mode & Store Pause
                      </CardTitle>
                      <CardDescription className="text-xs text-amber-700/80 dark:text-amber-300/80">
                        Displays an emergency alert banner across the storefront during system upgrades.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border">
                    <div>
                      <span className="font-bold text-sm text-foreground">Activate Maintenance Mode</span>
                      <p className="text-xs text-muted-foreground">
                        Show maintenance banner advising customers of ongoing service upgrades.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.maintenanceMode}
                        onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Maintenance Notice Message</label>
                    <input
                      type="text"
                      value={formData.maintenanceNotice}
                      onChange={(e) => handleChange('maintenanceNotice', e.target.value)}
                      placeholder="e.g. Store maintenance in progress. We will be back online shortly."
                      className="w-full px-3.5 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Live Storefront Preview */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          <Card className="rounded-2xl border shadow-md bg-card overflow-hidden">
            <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-primary" />
                <span className="font-bold text-sm tracking-tight text-foreground">Live Storefront Preview</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-card border px-2 py-0.5 rounded-md">
                Simulated View
              </span>
            </div>

            <CardContent className="p-5 space-y-6">
              {/* Preview 1: Top Announcement Bar */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  1. Top Announcement Header
                </span>
                <div className={`w-full ${formData.announcementBgColor || 'bg-black'} text-white rounded-xl p-3 text-xs shadow-xs space-y-1`}>
                  {formData.maintenanceMode && (
                    <div className="bg-amber-500 text-amber-950 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span className="truncate">{formData.maintenanceNotice}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold truncate">
                      <Truck size={12} className="shrink-0" />
                      <span>Free Over ₹{formData.freeShippingThreshold}</span>
                    </div>
                    <span className="text-amber-300 font-bold truncate text-[11px]">
                      {formData.announcementEnabled ? formData.announcementText : formData.tagline}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview 2: Cart Summary Free Shipping Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    2. Cart Free Shipping Indicator
                  </span>
                  <span className="text-[10px] text-muted-foreground">Sample Bag: ₹{previewSampleSubtotal}</span>
                </div>
                <div className="border rounded-xl p-3.5 bg-card space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Truck size={14} />
                      {previewFreeRemaining === 0 ? (
                        <span>You qualify for FREE Delivery!</span>
                      ) : (
                        <span>Add ₹{previewFreeRemaining} more for FREE Delivery</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">{previewProgress}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                    <span>Estimated Shipping Fee:</span>
                    <span className="font-bold text-foreground">
                      {previewFreeRemaining === 0 ? 'FREE' : `₹${formData.standardShippingFee}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview 3: Footer Policy Badges */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  3. Footer Policy Badges
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border bg-muted/20 flex items-center gap-2">
                    <Truck size={16} className="text-primary shrink-0" />
                    <div className="truncate">
                      <span className="font-bold block text-[11px]">Free Shipping</span>
                      <span className="text-[10px] text-muted-foreground">Above ₹{formData.freeShippingThreshold}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border bg-muted/20 flex items-center gap-2">
                    <RotateCcw size={16} className="text-primary shrink-0" />
                    <div className="truncate">
                      <span className="font-bold block text-[11px]">{formData.returnWindowDays}-Day Returns</span>
                      <span className="text-[10px] text-muted-foreground">Hassle-Free Policy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats Overview */}
              <div className="pt-3 border-t space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Store Currency:</span>
                  <span className="font-bold text-foreground">{formData.currency} ({formData.currencySymbol})</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash on Delivery:</span>
                  <span className="font-bold text-foreground">
                    {formData.codEnabled ? `Enabled (up to ₹${formData.codMaxLimit})` : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Tax / GST:</span>
                  <span className="font-bold text-foreground">
                    {formData.taxRatePercent}% ({formData.isTaxInclusive ? 'Inclusive' : 'Added at checkout'})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Sticky Save & Discard Bar - Only shows when unsaved or just saved */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl px-5 py-3.5 shadow-2xl transition-all duration-300 ease-out flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDirty || justSaved
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-28 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 text-xs">
          {justSaved ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Settings saved and synced to storefront in real-time!</span>
            </div>
          ) : isDirty ? (
            <div className="flex items-center gap-2.5 font-medium animate-in fade-in duration-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="font-bold text-amber-600 dark:text-amber-400">
                You have unsaved changes!
              </span>
              <span className="text-muted-foreground hidden md:inline">
                — Save to update storefront policies immediately.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>All settings are up to date.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              Discard
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={isSaving}
            className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border rounded-xl hover:bg-muted transition-colors"
          >
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || !isDirty}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isDirty
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
