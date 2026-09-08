"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { matchesProductSearch } from '@/lib/search';
import { toast } from 'sonner';
import { Heart, Search, Menu, X, ArrowRight, LogOut, ChevronDown, ChevronRight, Shield, User, Package, MapPin, Settings } from 'lucide-react';
import { IoPersonOutline } from "react-icons/io5";
import { BsHandbag } from "react-icons/bs";
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { authApi } from '@/api/auth';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, allProducts } = useProductFilters();
  const user = useAuthStore((state) => state.user);
  const logoutUserStore = useAuthStore((state) => state.logoutUser);
  const cartCount = useCartStore((state) => state.getItemCount());
  const favouritesCount = useFavouritesStore((state) => state.items.length);
  const [mounted, setMounted] = useState(false);
  
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Typing animation for search placeholder
  const searchVariables = ["FORMAL SHIRTS", "POLO SHIRTS", "BLACK SHIRTS"];
  const [variableText, setVariableText] = useState("");
  const [variableIndex, setVariableIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    
    if (isTyping) {
      if (charIndex < searchVariables[variableIndex].length) {
        typingTimeout = setTimeout(() => {
          setVariableText((prev) => prev + searchVariables[variableIndex][charIndex]);
          setCharIndex(charIndex + 1);
        }, 80); // typing speed
      } else {
        typingTimeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000); // pause at end
      }
    } else {
      if (charIndex > 0) {
        typingTimeout = setTimeout(() => {
          setVariableText((prev) => prev.slice(0, -1));
          setCharIndex(charIndex - 1);
        }, 40); // backspace speed
      } else {
        setIsTyping(true);
        setVariableIndex((prev) => (prev + 1) % searchVariables.length);
      }
    }

    return () => clearTimeout(typingTimeout);
  }, [charIndex, isTyping, variableIndex, searchVariables]);


  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (user) {
      useCartStore.getState().syncWithServer();
      useFavouritesStore.getState().fetchWishlist();
    }
  }, [user]);

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

  const suggestions = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    return (allProducts || [])
      .filter((p) => matchesProductSearch(p, inputValue))
      .slice(0, 6);
  }, [inputValue, allProducts]);

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
    <nav suppressHydrationWarning className={`w-full bg-white sticky top-0 z-40 ${pathname !== '/' ? 'shadow-sm border-b border-gray-100' : 'border-b border-gray-100'}`}>
      <div className="w-full px-4 lg:px-0 lg:w-[95%] mx-auto h-20 flex items-center justify-between">
        
        {/* Left Side: Hamburger Menu on Mobile, Empty Flex-1 on Desktop */}
        <div className="flex-1 flex items-center justify-start">
          <Sheet>
            <SheetTrigger 
              className="lg:hidden flex items-center text-black hover:opacity-70 transition-opacity p-1 -ml-1 cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              <Menu size={24} />
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 bg-white border-r border-gray-200">
              <SheetHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between">
                <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
                <Link href="/" className="h-9 relative overflow-hidden block">
                  <img src="/images/logo.png" alt="YOX Men's Fashion" className="h-full w-auto object-contain" />
                </Link>
              </SheetHeader>

              <div className="flex flex-col py-3 overflow-y-auto">
                <div className="px-5 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Navigation</p>
                  <div className="space-y-1">
                    <SheetClose render={<Link href="/" className="block py-2 text-sm font-semibold text-gray-800 hover:text-black" />}>
                      Home
                    </SheetClose>
                    <SheetClose render={<Link href="/shop" className="block py-2 text-sm font-semibold text-gray-800 hover:text-black" />}>
                      Shop All Catalog
                    </SheetClose>
                    <SheetClose render={<Link href="/offers" className="block py-2 text-sm font-semibold text-gray-800 hover:text-black" />}>
                      Exclusive Offers & Drops
                    </SheetClose>
                  </div>
                </div>

                <div className="border-t border-gray-100 my-2 pt-3 px-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Categories</p>
                  <div className="space-y-1">
                    {['T-SHIRT', 'JACKET', 'ACCESSORIES', 'PANTS', 'SHIRTS'].map((cat) => (
                      <SheetClose 
                        key={cat} 
                        render={
                          <Link 
                            href={`/shop?category=${cat.toLowerCase()}`}
                            className="block py-1.5 text-xs font-medium text-gray-600 hover:text-black uppercase tracking-wider"
                          />
                        }
                      >
                        {cat}
                      </SheetClose>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 my-2 pt-3 px-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">My Account & Bag</p>
                  <div className="space-y-2">
                    <SheetClose render={<Link href="/cart" className="flex items-center justify-between py-1.5 text-xs font-semibold text-gray-800 hover:text-black" />}>
                      <span className="flex items-center gap-2">
                        <BsHandbag size={18} />
                        My Shopping Bag
                      </span>
                      {mounted && cartCount > 0 && (
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </SheetClose>

                    <SheetClose render={<Link href="/profile/favourites" className="flex items-center justify-between py-1.5 text-xs font-semibold text-gray-800 hover:text-black" />}>
                      <span className="flex items-center gap-2">
                        <Heart size={18} />
                        My Wishlist
                      </span>
                      {mounted && favouritesCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {favouritesCount}
                        </span>
                      )}
                    </SheetClose>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Center: Logo (Centered on Mobile & Desktop) */}
        <div className="flex justify-center items-center flex-1">
          <Link href="/" className="flex-shrink-0 h-10 md:h-12 relative overflow-hidden flex items-center justify-center">
            <img 
              src="/images/logo.png" 
              alt="YOX Men's Fashion" 
              className="h-full w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Right Side: Search & Profile (Mobile & Desktop), Wishlist & Cart (Desktop Only) */}
        <div className="flex items-center justify-end gap-3.5 sm:gap-4 lg:gap-5 flex-1">
          
          {/* Desktop Search Bar */}
          <div className="hidden md:block relative w-full max-w-[280px]" ref={containerRef}>
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white border border-black rounded-none px-3 h-10 transition-all">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder={isFocused ? "" : `Search '${variableText}'`} 
                className="bg-transparent border-none outline-none w-full text-xs font-medium text-gray-800 placeholder-gray-500"
              />
              {inputValue ? (
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-black p-1"
                >
                  <X size={16} />
                </button>
              ) : (
                <button type="submit" className="text-black ml-1">
                  <Search size={18} strokeWidth={2} />
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {isFocused && inputValue.trim().length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-xl py-2 z-50 animate-in fade-in-50 duration-150">
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
                          <p className="text-[11px] text-gray-500">
                            {item.brand ? `${item.brand} • ` : ''}{item.category}{item.currentColor ? ` • ${item.currentColor}` : ''} • ₹{item.price}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-gray-400" />
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs font-bold text-black flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <span>View all results for &quot;{inputValue}&quot;</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-4 text-center text-xs text-gray-500">
                    No products matching &quot;{inputValue}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Search Trigger Button (Right Side) */}
          <button 
            suppressHydrationWarning
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden flex items-center text-black hover:opacity-70 transition-opacity p-1 cursor-pointer"
            aria-label="Search"
          >
            <Search size={22} />
          </button>

          {/* User Icon & Account Dropdown (Right Side on Mobile & Desktop) */}
          <div className="relative" ref={userDropdownRef}>
            {mounted && user ? (
              <button
                suppressHydrationWarning
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 p-1 rounded-md hover:bg-gray-100 transition-all focus:outline-none group cursor-pointer"
                aria-expanded={isUserDropdownOpen}
                aria-label="User account menu"
                title={user.fullName || "My Account"}
              >
                <IoPersonOutline size={22} className="text-black shrink-0" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-black max-w-[90px] sm:max-w-[120px] truncate">
                  {user.fullName ? user.fullName.split(' ')[0] : 'Account'}
                </span>
                <ChevronDown 
                  size={14} 
                  className={`text-gray-500 group-hover:text-black transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
            ) : (
              <button
                suppressHydrationWarning
                onClick={() => router.push('/login')}
                className="flex items-center text-black hover:opacity-70 transition-opacity p-1 cursor-pointer"
                title="Sign In / Register"
                aria-label="Sign In"
              >
                <IoPersonOutline size={22} />
              </button>
            )}

            {/* User Dropdown Menu */}
            {mounted && isUserDropdownOpen && user && (
              <div className="absolute right-0 top-12 w-[270px] sm:w-72 bg-white border border-gray-200 rounded-sm shadow-xl z-50 animate-in fade-in-50 duration-150 divide-y divide-gray-100 overflow-hidden">
                {/* Header Banner */}
                <div className="px-4 py-3 bg-gray-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900 truncate">
                      Welcome, {user.fullName ? user.fullName.split(' ')[0] : 'Member'}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                      YOX Member
                    </p>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="divide-y divide-gray-100">
                  <Link
                    href="/profile/personal-info"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:text-black transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-gray-700 shrink-0" />
                      <span>My Profile</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </Link>

                  <Link
                    href="/profile/orders"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:text-black transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Package size={16} className="text-gray-700 shrink-0" />
                      <span>My Orders</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </Link>

                  <Link
                    href="/profile/addresses"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:text-black transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-gray-700 shrink-0" />
                      <span>Saved Addresses</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </Link>

                  <Link
                    href="/profile/favourites"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:text-black transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Heart size={16} className="text-gray-700 shrink-0" />
                      <span>My Wishlist</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </Link>

                  <Link
                    href="/profile/settings"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-800 hover:bg-gray-50 hover:text-black transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={16} className="text-gray-700 shrink-0" />
                      <span>Account Settings</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </Link>

                  {user.permissions?.includes('admin:access') && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-[#1A2E4C] hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={16} className="text-[#1A2E4C] shrink-0" />
                        <span>Admin Dashboard</span>
                      </div>
                      <ChevronRight size={14} className="text-[#1A2E4C] group-hover:text-black transition-colors" />
                    </Link>
                  )}
                </div>

                {/* Sign Out Button */}
                <div className="p-1 bg-gray-50/50">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-sm transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={16} className="text-rose-500 shrink-0" />
                      <span>Sign Out Account</span>
                    </div>
                    <ChevronRight size={14} className="text-rose-300" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist Icon (Desktop Only - Hidden on Mobile) */}
          <Link href="/profile/favourites" className="hidden lg:flex items-center relative text-black hover:opacity-70 transition-opacity" title="Wishlist">
            <div className="relative">
              <Heart size={21} />
              {mounted && favouritesCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 px-1 min-w-[16px] rounded-full flex items-center justify-center">
                  {favouritesCount}
                </span>
              )}
            </div>
          </Link>

          {/* Cart Icon (Desktop Only - Hidden on Mobile) */}
          <Link href="/cart" className="hidden lg:flex items-center relative text-black hover:opacity-70 transition-opacity">
            <div className="relative">
              <BsHandbag size={22} />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 px-1 min-w-[16px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </Link>

        </div>
      </div>

      {/* Mobile Search Modal */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 border-b pb-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-white border border-black rounded-none px-3 h-10">
              <Search size={18} className="text-gray-500 mr-2" />
              <input 
                type="text" 
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search..."
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
                      <p className="text-[11px] text-gray-500">
                        {item.brand ? `${item.brand} • ` : ''}{item.category}{item.currentColor ? ` • ${item.currentColor}` : ''} • ₹{item.price}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : inputValue.trim() ? (
              <p className="text-xs text-gray-500 text-center pt-8">No products matching &quot;{inputValue}&quot;</p>
            ) : (
              <div className="pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Polo T-shirt', 'Oversized Tee', 'Cargo Pants', 'Linen Shirt'].map((term) => (
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
