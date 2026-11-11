'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Share2 } from 'lucide-react';
import { SocialIcon } from 'react-social-icons';
import { toast } from 'sonner';

interface ProductShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    thumbnail?: string;
    currencySymbol?: string;
  };
  url?: string;
}

export function ProductShareModal({
  isOpen,
  onClose,
  product,
  url,
}: ProductShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url ||
    (typeof window !== 'undefined'
      ? window.location.href
      : `https://yoxfashion.in/product/${product.id}`);

  const currency = product.currencySymbol || '₹';
  const shareText = `${product.name} | ${currency}${product.price.toLocaleString()}`;

  // Close modal on Escape key press and prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleInstagramShare = async () => {
    await handleCopy();
    toast.success('Link copied. Open Instagram to paste in your chat or story.');
    window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
  };

  const channels = [
    {
      name: 'WhatsApp',
      network: 'whatsapp',
      onClick: () => {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `${shareText}\n${shareUrl}`
        )}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Instagram',
      network: 'instagram',
      onClick: handleInstagramShare,
    },
    {
      name: 'Facebook',
      network: 'facebook',
      onClick: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        window.open(fbUrl, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Telegram',
      network: 'telegram',
      onClick: () => {
        const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareText)}`;
        window.open(tgUrl, '_blank', 'noopener,noreferrer');
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-gray-200 shadow-2xl p-5 sm:p-6 text-gray-900 animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-gray-800">
              <Share2 size={15} />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Share Product
              </h2>
              <p className="text-[11px] text-gray-500">
                Share this item with friends or copy the link.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-none border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-colors cursor-pointer"
            aria-label="Close share dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Product Preview Snippet */}
        <div className="flex items-center gap-3 p-3 my-4 bg-gray-50 border border-gray-200/80">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="w-14 h-16 object-cover bg-gray-200 shrink-0 border border-gray-200"
            />
          ) : (
            <div className="w-14 h-16 bg-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">
              YOX
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
              {product.name}
            </h3>
            <p className="text-xs font-extrabold text-black mt-0.5">
              {currency}{product.price.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              Free Express Delivery
            </span>
          </div>
        </div>

        {/* Social Share Options */}
        <div className="mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2.5">
            Share via
          </span>
          <div className="grid grid-cols-4 gap-2.5 text-center">
            {channels.map((channel) => (
              <button
                key={channel.name}
                type="button"
                onClick={channel.onClick}
                className="flex flex-col items-center gap-1.5 p-2 rounded-none hover:bg-gray-50 transition-all cursor-pointer group"
              >
                <div className="transition-transform group-hover:scale-110 shadow-2xs rounded-full overflow-hidden">
                  <SocialIcon
                    network={channel.network}
                    as="div"
                    style={{ width: 44, height: 44 }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 group-hover:text-black">
                  {channel.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy Link Row */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
            Copy link
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-gray-50 border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none select-all truncate font-mono"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`h-[36px] px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black hover:bg-gray-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

