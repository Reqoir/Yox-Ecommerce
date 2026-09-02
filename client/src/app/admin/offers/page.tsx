'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, LayoutTemplate, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/admin/useProducts';
import { settingsApi } from '@/api/admin/settings';

export default function AdminOffersPage() {
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

  const handleSaveStorefront = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await settingsApi.updateSetting('storefront.exclusive_offers', {
        endDate: offerEndDate ? new Date(offerEndDate).toISOString() : null,
        productIds: selectedProductIds
      });
      toast.success('Exclusive Offers updated successfully!');
    } catch (error) {
      toast.error('Failed to update Exclusive Offers.');
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
        <h1 className="text-3xl font-bold tracking-tight">Exclusive Offers</h1>
        <p className="text-muted-foreground mt-1">
          Manage the storefront Exclusive Offers section and countdown timer.
        </p>
      </div>

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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
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
            Save Configuration
          </button>
        </div>
      </form>
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
