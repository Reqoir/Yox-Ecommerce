'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

type SonnerToasterProps = ToasterProps;

const Toaster = ({ ...props }: SonnerToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as SonnerToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-[#EAE6DF] group-[.toaster]:shadow-lg group-[.toaster]:rounded-none group-[.toaster]:py-3 group-[.toaster]:px-4 font-sans',
          description: 'group-[.toast]:text-gray-500 text-xs mt-0.5',
          actionButton:
            'group-[.toast]:bg-[#1A2E4C] group-[.toast]:text-white group-[.toast]:rounded-none text-xs font-semibold uppercase tracking-wider',
          cancelButton:
            'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:rounded-none text-xs',
          closeButton:
            'group-[.toast]:bg-white group-[.toast]:text-gray-400 group-[.toast]:border-[#EAE6DF] group-[.toast]:hover:text-black group-[.toast]:hover:bg-gray-50',
          error:
            'group-[.toaster]:!border-rose-200 group-[.toaster]:!bg-white group-[.toaster]:!text-gray-900 [&_[data-icon]]:!text-rose-600',
          success:
            'group-[.toaster]:!border-emerald-200 group-[.toaster]:!bg-white group-[.toaster]:!text-gray-900 [&_[data-icon]]:!text-emerald-600',
          warning:
            'group-[.toaster]:!border-amber-200 group-[.toaster]:!bg-white group-[.toaster]:!text-gray-900 [&_[data-icon]]:!text-amber-600',
          info:
            'group-[.toaster]:!border-blue-200 group-[.toaster]:!bg-white group-[.toaster]:!text-gray-900 [&_[data-icon]]:!text-[#1A2E4C]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

