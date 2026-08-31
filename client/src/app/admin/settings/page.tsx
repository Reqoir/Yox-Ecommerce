'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Bell, Store, LayoutTemplate, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from '@/hooks/admin/useProducts';
import { settingsApi } from '@/api/admin/settings';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('YOX Men\'s Fashion');
  const [supportEmail, setSupportEmail] = useState('support@yox.com');
  const [currency, setCurrency] = useState('INR (₹)');
  const [taxRate, setTaxRate] = useState('18');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Storefront Settings State
  const [offerEndDate, setOfferEndDate] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  const { products, isLoading: isLoadingProducts } = useProducts();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const config: any = await settingsApi.getSetting('storefront.exclusive_offers');
        if (config) {
          if (config.endDate) {
            // format for input type="datetime-local" (YYYY-MM-DDThh:mm)
            const date = new Date(config.endDate);
            if (!isNaN(date.getTime())) {
              setOfferEndDate(date.toISOString().slice(0, 16));
            }
          }
          if (config.productIds) {
            setSelectedProductIds(config.productIds);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('General settings updated successfully!');
  };

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await settingsApi.updateSetting('storefront.exclusive_offers', {
        endDate: offerEndDate ? new Date(offerEndDate).toISOString() : null,
        productIds: selectedProductIds
      });
      toast.success('Storefront settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update storefront settings.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProductSelection = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system configurations, store preferences, and administrative controls.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Configuration</TabsTrigger>
          <TabsTrigger value="storefront">Storefront (Exclusive Offers)</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">General Store Information</CardTitle>
                </div>
                <CardDescription>Configure basic store details and regional defaults.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Store Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Support Email</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Default Currency</label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Notifications & System Controls</CardTitle>
                </div>
                <CardDescription>Control automated alerts and maintenance operations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Email Alerts & Order Updates</p>
                    <p className="text-xs text-muted-foreground">Receive real-time notifications for new orders and stock updates.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableNotifications}
                    onChange={(e) => setEnableNotifications(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Temporarily restrict store frontend access for maintenance.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="storefront">
          <form onSubmit={handleSaveStorefront} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Exclusive Offers Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure the countdown timer and select up to 8 products to feature on the homepage's Exclusive Offers section.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="max-w-md">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                        <Calendar size={16} />
                        Offer End Date (Countdown Timer)
                      </label>
                      <input
                        type="datetime-local"
                        value={offerEndDate}
                        onChange={(e) => setOfferEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        The countdown timer on the homepage will stop when this date is reached.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-gray-900">
                          Select Featured Products
                        </label>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">
                          {selectedProductIds.length} Selected
                        </span>
                      </div>
                      
                      {isLoadingProducts ? (
                        <div className="flex justify-center py-4">
                           <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-1">
                          {products.map(product => {
                            const isSelected = selectedProductIds.includes(product.id);
                            return (
                              <div 
                                key={product.id}
                                onClick={() => toggleProductSelection(product.id)}
                                className={`border rounded-lg p-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                              >
                                <div className="aspect-square bg-muted rounded overflow-hidden mb-2">
                                  {product.thumbnail ? (
                                    <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                  )}
                                </div>
                                <h4 className="text-xs font-medium line-clamp-2 leading-tight" title={product.name}>{product.name}</h4>
                                <div className="mt-1 flex items-center justify-between">
                                   <span className="text-[10px] text-muted-foreground">₹{product.variants?.[0]?.price?.toFixed(2) || '0.00'}</span>
                                   {isSelected && <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><CheckIcon /></span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || isLoadingSettings}
                className="flex items-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Storefront Configuration
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
