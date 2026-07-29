'use client';

import React, { useState } from 'react';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export function OrderItemsReview() {
  const { items } = useCartStore();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-md p-5 lg:p-6 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pb-3 border-b border-gray-100 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1A2E4C] text-white rounded-full flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              Review Order Items ({items.length})
            </h2>
            <p className="text-xs text-gray-500">Verify items before completing purchase</p>
          </div>
        </div>

        <div className="text-gray-500 hover:text-gray-900 p-1">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-18 object-cover object-top rounded bg-gray-50 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                <p className="text-[11px] text-gray-500">
                  Size: <span className="font-semibold text-gray-700">{item.size}</span> • Color: <span className="font-semibold text-gray-700">{item.color}</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  Qty: <span className="font-bold text-gray-900">{item.quantity}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
