import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const menuLinks = [
  {
    title: 'Tops',
    links: [
      { name: 'T-shirts', href: '/shop' },
      { name: 'Polo shirts', href: '/shop' },
      { name: 'Casual shirts', href: '/shop' },
      { name: 'Hoodies', href: '/shop' },
    ],
  },
  {
    title: 'Outerwear',
    links: [
      { name: 'Jackets', href: '/shop' },
      { name: 'Coats', href: '/shop', badge: 'NEW RELEASES', badgeColor: 'bg-[#4B3E33] text-white' },
      { name: 'Denim jackets', href: '/shop' },
      { name: 'Trench coats', href: '/shop' },
    ],
  },
  {
    title: 'Activewear',
    links: [
      { name: 'Athletic shorts', href: '/shop' },
      { name: 'Running shirts', href: '/shop' },
      { name: 'Gym shorts', href: '/shop', badge: 'FLEX FIT', badgeColor: 'bg-[#E5DCC5] text-gray-800' },
      { name: 'Athletic jackets', href: '/shop' },
    ],
  },
  {
    title: 'Accessories',
    links: [
      { name: 'Bag', href: '/shop' },
      { name: 'Cap', href: '/shop' },
      { name: 'Socks', href: '/shop' },
      { name: 'Scarf', href: '/shop' },
    ],
  },
];


export function MegaMenuMen() {
  return (
    <div className="absolute left-0 right-0 top-full bg-white border-t border-gray-100 shadow-[0_10px_20px_rgba(0,0,0,0.05)] cursor-default pt-8 pb-10 z-50">
      <div className="max-w-[1400px] w-[95%] mx-auto">
        
        {/* Top Links Section */}
        <div className="grid grid-cols-4 gap-8 mb-10 pl-2">
          {menuLinks.map((column, idx) => (
            <div key={idx} className="flex flex-col">
              <h3 className="font-bold text-gray-900 text-[13px] mb-5">{column.title}</h3>
              <ul className="space-y-3.5">
                {column.links.map((link, lIdx) => (
                  <li key={lIdx} className="flex items-center gap-2">
                    <Link href={link.href} className="text-[12px] font-medium text-gray-600 hover:text-black transition-colors">
                      {link.name}
                    </Link>
                    {link.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider ${link.badgeColor}`}>
                        {link.badge}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>



      </div>
    </div>
  );
}
