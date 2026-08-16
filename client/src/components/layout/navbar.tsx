"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, ArrowRight, LogOut, ChevronDown, Shield } from 'lucide-react';
import { IoPersonOutline } from "react-icons/io5";
import { BsHandbag } from "react-icons/bs";
import { useProductFilters } from '@/hooks/useProductFilters';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { authApi } from '@/api/auth';

export function Navbar() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, filteredProducts } = useProductFilters();
  const user = useAuthStore((state) => state.user);
  const logoutUserStore = useAuthStore((state) => state.logoutUser);
  const cartCount = useCartStore((state) => state.getItemCount());
  
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

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
    <nav className="w-full border-b bg-white sticky top-0 z-40">
      <div className="w-full px-4 lg:px-0 lg:w-[95%] mx-auto h-20 flex items-center justify-between">
        
        {/* Left Side: Categories */}
        <div className="hidden lg:flex items-center gap-6 flex-1">
          {['Shop All', 'Women', 'Men', 'Kids', 'Footwear', 'Sleepwear', 'GenZ Store', 'Accessories'].map(cat => (
             <Link key={cat} href={cat === 'Shop All' ? '/shop' : `/shop?category=${cat.toLowerCase()}`} className="flex items-center gap-1 text-[13px] font-bold text-gray-800 hover:text-black transition-colors">
                {cat}
                <ChevronDown size={14} className="text-gray-500" />
             </Link>
          ))}
        </div>

        {/* Center: Logo */}
        <div className="flex justify-start lg:justify-center items-center flex-1">
          <Link href="/" className="flex-shrink-0 h-10 md:h-12 relative overflow-hidden flex items-center justify-center">
            <img 
              src="/images/logo.png" 
              alt="YOX Men's Fashion" 
              className="h-full w-auto object-contain" 
            />
          </Link>
        </div>

        {/* Right Actions & Search */}
        <div className="flex items-center justify-end gap-5 flex-1">
          
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
                          <p className="text-[11px] text-gray-500">{item.category} • ₹{item.price}</p>
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

          {/* User Icon */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                if (user) {
                  setIsUserDropdownOpen((prev) => !prev);
                } else {
                  router.push('/login');
                }
              }}
              className="flex items-center text-black hover:opacity-70 transition-opacity"
            >
              <IoPersonOutline size={22} />
            </button>

            {/* User Dropdown Menu */}
            {isUserDropdownOpen && user && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-md shadow-xl py-2 z-50 animate-in fade-in-50 duration-150">
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
                    <IoPersonOutline size={15} className="text-gray-500" />
                    <span>My Profile</span>
                  </Link>
                  {user.permissions?.includes('admin:access') && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <Shield size={15} />
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

          {/* Mobile Search Trigger */}
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden flex items-center text-black hover:opacity-70 transition-opacity"
          >
            <Search size={22} />
          </button>

          {/* Cart Icon */}
          <Link href="/cart" className="flex items-center relative text-black hover:opacity-70 transition-opacity">
            <div className="relative">
              <BsHandbag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-black text-white text-[10px] font-bold h-4 px-1 min-w-[16px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </Link>

          {/* Mobile Menu */}
          <button className="lg:hidden flex items-center text-black hover:opacity-70 transition-opacity ml-2">
            <Menu size={24} />
          </button>

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
                      <p className="text-[11px] text-gray-500">{item.category} • ₹{item.price}</p>
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
