import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function HomeSkeleton() {
  return (
    <main className="w-full flex flex-col bg-white min-h-screen pb-16 animate-in fade-in duration-300">
      {/* 1. Hero Banner Skeleton */}
      <section className="w-full relative z-0 isolate py-0 overflow-hidden">
        <div className="w-full">
          <div className="relative overflow-hidden border-0 bg-gray-100 w-full h-[calc(100svh-114px)] min-h-[calc(100svh-114px)] sm:h-auto sm:aspect-[1440/680] sm:min-h-[400px] md:min-h-[500px] flex items-end justify-center pb-8 sm:pb-10">
            <Skeleton className="w-36 h-10 sm:h-11 rounded-full bg-gray-300 shadow-md" />
          </div>
        </div>
      </section>

      {/* 2. Shop By Category Section Skeleton */}
      <section className="w-full mt-6 py-12 sm:py-16 bg-white overflow-hidden">
        <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-8 mb-10 md:mb-12 flex items-center justify-between">
          <Skeleton className="h-8 w-60 rounded bg-gray-200" />
          <div className="flex gap-2">
            <Skeleton className="w-9 h-9 rounded-full bg-gray-200" />
            <Skeleton className="w-9 h-9 rounded-full bg-gray-200" />
          </div>
        </div>
        <div className="flex w-max items-end gap-4 px-4 md:px-8 overflow-hidden">
          {[450, 300, 450, 300, 450, 300].map((h, idx) => (
            <Skeleton 
              key={idx} 
              className="flex-shrink-0 w-[240px] md:w-[280px] lg:w-[320px] rounded-sm bg-gray-100" 
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </section>

      {/* 4. Featured Section Skeleton */}
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="w-48 h-8 rounded-md bg-gray-200" />
            <Skeleton className="w-20 h-5 rounded-xs bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex flex-col">
                <Skeleton className="w-full aspect-[3/4] rounded-sm bg-gray-100 mb-3" />
                <Skeleton className="w-3/4 h-4 rounded-xs mb-2 bg-gray-200" />
                <Skeleton className="w-1/3 h-5 rounded-xs mb-2 bg-gray-200" />
                <div className="flex gap-1.5 mt-1">
                  <Skeleton className="w-2.5 h-2.5 bg-gray-200 rounded-none" />
                  <Skeleton className="w-2.5 h-2.5 bg-gray-200 rounded-none" />
                  <Skeleton className="w-2.5 h-2.5 bg-gray-200 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Exclusive Offers Section Skeleton */}
      <section className="w-full bg-[#F1EFEA] py-16 border-t border-gray-200">
        <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-0">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
            <div>
              <Skeleton className="h-8 w-64 md:w-80 rounded bg-gray-300/60 mb-2" />
              <Skeleton className="h-4 w-48 rounded bg-gray-300/60" />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
              <span className="text-gray-400 font-bold">:</span>
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
              <span className="text-gray-400 font-bold">:</span>
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
              <span className="text-gray-400 font-bold">:</span>
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center">
                <Skeleton className="w-[110px] md:w-[130px] shrink-0 aspect-[3/4] rounded-none bg-gray-300/60" />
                <div className="flex flex-col justify-center pl-4 py-2 flex-1 gap-2">
                  <Skeleton className="h-3 w-20 rounded bg-gray-300/60" />
                  <Skeleton className="h-4 w-24 rounded bg-gray-300/60" />
                  <Skeleton className="h-3 w-16 rounded bg-gray-300/60" />
                  <Skeleton className="h-4 w-32 rounded bg-gray-300/60 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. New and Popular Skeleton */}
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="w-56 h-8 rounded-md bg-gray-200 mb-6" />
            <div className="flex flex-wrap justify-center gap-3">
              <Skeleton className="w-20 h-9 rounded-full bg-gray-200" />
              <Skeleton className="w-20 h-9 rounded-full bg-gray-200" />
              <Skeleton className="w-20 h-9 rounded-full bg-gray-200" />
              <Skeleton className="w-20 h-9 rounded-full bg-gray-200" />
              <Skeleton className="w-20 h-9 rounded-full bg-gray-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex flex-col">
                <Skeleton className="w-full aspect-[3/4] rounded-sm bg-gray-100 mb-3" />
                <Skeleton className="w-3/4 h-4 rounded-xs mb-2 bg-gray-200" />
                <Skeleton className="w-1/3 h-5 rounded-xs mb-2 bg-gray-200" />
                <div className="flex gap-1.5 mt-1">
                  <Skeleton className="w-2.5 h-2.5 bg-gray-200 rounded-none" />
                  <Skeleton className="w-2.5 h-2.5 bg-gray-200 rounded-none" />
                  <Skeleton className="w-2.5 h-2.5 bg-gray-200 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
