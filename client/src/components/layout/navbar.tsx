"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu, X, ArrowRight, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { authApi } from '@/api/auth';

export function Navbar() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, filteredProducts } = useProductFilters();
  const user = useAuthStore((state) => state.user);
  const logoutUserStore = useAuthStore((state) => state.logoutUser);
  const cartCount = useCartStore((state) => state.getItemCount());
  const favouritesCount = useFavouritesStore((state) => state.items.length);
  
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Keep local input state in sync with URL searchQuery
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Handle outside click to close autocomplete and dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      logoutUserStore();
      setIsUserDropdownOpen(false);
      router.push('/');
    }
  };

  // Compute live search suggestions for autocomplete from database products (top 5)
  const suggestions = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    const query = inputValue.toLowerCase().trim();
    return filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
    ).slice(0, 5);
  }, [inputValue, filteredProducts]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsFocused(false);
    setIsMobileSearchOpen(false);
    if (inputValue.trim()) {
      setSearchQuery(inputValue);
    } else {
      setSearchQuery('');
    }
  };

  const handleSelectSuggestion = (productName: string) => {
    setInputValue(productName);
    setSearchQuery(productName);
    setIsFocused(false);
    setIsMobileSearchOpen(false);
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
    setIsFocused(false);
  };

  return (
    <nav className="w-full border-b bg-[#F7F8F7] sticky top-0 z-40">
      <div className="w-full px-4 lg:px-0 lg:w-[75%] mx-auto h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Search */}
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 h-11 w-20 md:w-24 relative overflow-hidden rounded-[2px] flex items-center justify-center">
            <img 
              src="/images/chatgpt-logo.png" 
              alt="YOX Men's Fashion" 
              className="h-full w-full object-contain drop-shadow-md" 
            />
          </Link>

          {/* Desktop Search Bar & Autocomplete */}
          <div className="hidden md:block relative w-full max-w-[440px]" ref={containerRef}>
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#ECEDEB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1A2E4C]/20 rounded-[2px] px-3.5 h-11 transition-all">
              <Search className="text-gray-500 mr-2.5 flex-shrink-0" size={18} />
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Search Men's shirts, polo, cargo, hoodies..." 
                className="bg-transparent border-none outline-none w-full text-sm text-gray-800 placeholder-gray-500"
              />
              {inputValue && (
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {isFocused && inputValue.trim().length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-xl py-2 z-50 animate-in fade-in-50 duration-150">
                <div className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Suggestions ({suggestions.length})
                </div>

                {suggestions.length > 0 ? (
                  <div>
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSuggestion(item.name)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 text-left transition-colors"
                      >
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-9 h-11 object-cover rounded bg-gray-100 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-500">{item.category} • ₹{item.price}</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-400" />
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs font-bold text-[#1A2E4C] flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>View all results for &quot;{inputValue}&quot;</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-4 text-center text-xs text-gray-500">
                    No Men&apos;s products matching &quot;{inputValue}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-200/60 transition-colors border border-gray-200 bg-white"
                aria-expanded={isUserDropdownOpen}
                aria-label="User menu"
              >
                <div className="w-7 h-7 rounded-full bg-[#1A2E4C] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-gray-800 leading-tight max-w-[120px] truncate">
                    {user.fullName || 'Account'}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight max-w-[120px] truncate">
                    {user.email}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-md shadow-xl py-2 z-50 animate-in fade-in-50 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={15} className="text-gray-500" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/favourites"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Heart size={15} className="text-gray-500" />
                      <span>My Favourites</span>
                    </Link>
                    {user.permissions?.includes('admin:access') && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#1A2E4C] font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <Shield size={15} className="text-[#1A2E4C]" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={15} className="text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="hidden lg:block bg-[#1A2E4C] text-white text-xs font-semibold tracking-wide py-2.5 px-6 rounded-[2px] hover:bg-[#233f68] transition-colors"
            >
              SIGN UP / SIGN IN
            </Link>
          )}

          <div className="flex items-center gap-4 md:gap-5 text-black">
            {/* Mobile Search Trigger Icon */}
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="md:hidden flex flex-col items-center gap-1 hover:text-gray-700 transition-colors"
              aria-label="Open search"
            >
              <Search size={22} strokeWidth={2} />
            </button>

            <Link href="/favourites" className="hidden md:flex flex-col items-center gap-1 hover:text-gray-700 transition-colors relative">
              <div className="relative">
                <Heart size={20} strokeWidth={2} />
                {favouritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {favouritesCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">Favourites</span>
            </Link>

            <Link href="/cart" className="flex md:flex-col items-center gap-1 hover:text-gray-700 transition-colors relative">
              <div className="relative">
                <ShoppingBag size={22} strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#1A2E4C] text-white text-[10px] font-bold h-4 px-1 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-medium">Cart</span>
            </Link>
            
            {!user && (
              <Link href="/login" className="hidden md:flex flex-col items-center gap-1 hover:text-gray-700 transition-colors">
                <User size={20} strokeWidth={2} />
                <span className="text-xs font-medium">Sign In</span>
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <button className="md:hidden flex items-center hover:text-gray-700 transition-colors ml-1">
              <Menu size={26} strokeWidth={2} />
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Search Modal Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 border-b pb-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-[#ECEDEB] rounded px-3 h-11">
              <Search size={18} className="text-gray-500 mr-2" />
              <input 
                type="text" 
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search Men's wear..."
                className="bg-transparent border-none outline-none w-full text-sm text-gray-900"
              />
              {inputValue && (
                <button type="button" onClick={() => setInputValue('')} className="p-1 text-gray-400">
                  <X size={18} />
                </button>
              )}
            </form>
            <button 
              onClick={() => setIsMobileSearchOpen(false)}
              className="text-xs font-bold text-gray-700 px-2 py-2"
            >
              Cancel
            </button>
          </div>

          {/* Mobile Search Suggestions */}
          <div className="flex-1 overflow-y-auto pt-3">
            {suggestions.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Suggestions</p>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSuggestion(item.name)}
                    className="w-full py-2.5 flex items-center gap-3 border-b border-gray-50 text-left"
                  >
                    <img src={item.image} alt={item.name} className="w-10 h-12 object-cover rounded bg-gray-100" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">{item.name}</p>
                      <p className="text-[11px] text-gray-500">{item.category} • ₹{item.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : inputValue.trim() ? (
              <p className="text-xs text-gray-500 text-center pt-8">No Men&apos;s products matching &quot;{inputValue}&quot;</p>
            ) : (
              <div className="pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popular Men&apos;s Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Polo T-shirt', 'Oversized Tee', 'Cargo Pants', 'Linen Shirt', 'Fleece Hoodie'].map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSuggestion(term)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs text-gray-800 rounded-full transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
