import React from 'react';
import { TbTruckDelivery, TbCurrentLocation } from "react-icons/tb";
import { MdOutlineLocationOn } from "react-icons/md";

export function TopBar() {
  return (
    <div className="w-full bg-black text-white h-10 flex items-center justify-center">
      <div className="w-[98%] max-w-[1500px] px-4 md:px-0 mx-auto flex items-center justify-between md:justify-center gap-2 md:gap-8 text-[10px] sm:text-xs md:text-sm">
        <div className="flex items-center gap-1 md:gap-2 cursor-pointer hover:text-gray-300">
          <TbTruckDelivery className="text-base md:text-[18px]" />
          <span className="font-semibold whitespace-nowrap">Free Shipping</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 cursor-pointer hover:text-gray-300">
          <MdOutlineLocationOn className="text-base md:text-[18px]" />
          <span className="font-semibold whitespace-nowrap">Delivering To</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2 cursor-pointer hover:text-gray-300">
          <TbCurrentLocation className="text-base md:text-[18px]" />
          <span className="font-semibold whitespace-nowrap">Store Locator</span>
        </div>
      </div>
    </div>
  );
}
