import React from 'react';
import { TbTruckDelivery, TbCurrentLocation } from "react-icons/tb";
import { MdOutlineLocationOn } from "react-icons/md";

export function TopBar() {
  return (
    <div className="w-full bg-black text-white text-sm h-10 flex items-center justify-center">
      <div className="w-[75%] mx-auto flex items-center justify-center gap-8">
        <div className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
          <TbTruckDelivery size={18} />
          <span className="font-semibold">Free Shipping</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
          <MdOutlineLocationOn size={18} />
          <span className="font-semibold">Delivering To</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
          <TbCurrentLocation size={18} />
          <span className="font-semibold">Store Locator</span>
        </div>
      </div>
    </div>
  );
}
