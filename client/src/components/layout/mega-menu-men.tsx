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

const featuredProducts = [
  {
    id: 1,
    name: "Men's Casual Quilted Jacket",
    price: '8,500.00',
    comparePrice: '9,300.00',
    badge: 'Sale',
    image: '/images/nav/men/1.jpg',
  },
  {
    id: 2,
    name: "Men's Modern Shirt Jacket",
    price: '7,200.00',
    comparePrice: '7,700.00',
    badge: 'Sale',
    image: '/images/nav/men/2.jpg',
  },
  {
    id: 3,
    name: "Men's Warm Sports Jacket",
    price: '7,300.00',
    comparePrice: null,
    badge: null,
    image: '/images/nav/men/3.jpg',
  },
  {
    id: 4,
    name: "Men's Training Sports Jacket",
    price: '7,100.00',
    comparePrice: null,
    badge: null,
    image: '/images/nav/men/4.jpg',
  },
  {
    id: 5,
    name: "Men's Athletic Stripe Jacket",
    price: '7,300.00',
    comparePrice: '7,700.00',
    badge: 'Sale',
    image: '/images/nav/men/5.jpg',
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

        {/* Bottom Featured Products */}
        <div className="grid grid-cols-5 gap-4">
          {featuredProducts.map((product) => (
            <Link href="/shop" key={product.id} className="group block">
              <div className="relative aspect-[4/5] bg-[#F2F2F2] mb-3 overflow-hidden rounded-[2px]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {product.badge && (
                  <div className="absolute top-2 left-2 bg-white px-2 py-0.5 text-[10px] font-bold text-[#C15849] rounded-sm shadow-sm">
                    {product.badge}
                  </div>
                )}
              </div>
              <div className="space-y-1 px-1">
                <h3 className="text-[12px] font-semibold text-gray-800">{product.name}</h3>
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-600">
                  <span>From Rs. {product.price} INR</span>
                  {product.comparePrice && (
                    <span className="text-[#C15849] line-through">Rs. {product.comparePrice} INR</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
