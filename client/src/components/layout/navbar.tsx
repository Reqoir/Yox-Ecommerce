import React from 'react';
import Link from 'next/link';
import { Search, Heart, ShoppingBag, User } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="w-full border-b bg-[#F7F8F7]">
      <div className="w-[75%] mx-auto h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Search */}
        <div className="flex items-center gap-2">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 h-11 w-24 relative overflow-hidden rounded-[2px] flex items-center justify-center">
            <img 
              src="/images/chatgpt-logo.png" 
              alt="YOX" 
              className="h-full w-full object-contain drop-shadow-md" 
            />
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-[#ECEDEB] rounded-[2px] px-4 h-11 w-[400px]">
            <Search className="text-gray-500 mr-3" size={18} />
            <input 
              type="text" 
              placeholder="What are you looking for?" 
              className="bg-transparent border-none outline-none w-full text-base text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <button className="hidden lg:block bg-[#1A2E4C] text-white text-xs font-semibold tracking-wide py-2.5 px-6 rounded-[2px] hover:bg-[#233f68] transition-colors">
            SIGN UP / SIGN IN
          </button>

          <div className="flex items-center gap-5 text-black">
            <button className="flex flex-col items-center gap-1 hover:text-gray-700 transition-colors">
              <Heart size={20} strokeWidth={2} />
              <span className="text-xs font-medium">Favourites</span>
            </button>
            <button className="flex flex-col items-center gap-1 hover:text-gray-700 transition-colors">
              <ShoppingBag size={20} strokeWidth={2} />
              <span className="text-xs font-medium">Cart</span>
            </button>
            <button className="flex flex-col items-center gap-1 hover:text-gray-700 transition-colors">
              <User size={20} strokeWidth={2} />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}
