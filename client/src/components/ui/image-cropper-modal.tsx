'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCw, ZoomIn, ZoomOut, Check, X, Crop as CropIcon } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSource: File | string | null;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
  title?: string;
}

type AspectRatioOption = 'free' | '1:1' | '3:4' | '4:3' | '16:9';

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSource,
  onCropComplete,
  title = 'Crop Product Image',
}: ImageCropperModalProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('3:4');
  const [cropRect, setCropRect] = useState({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load image from File or URL
  useEffect(() => {
    if (!imageSource) {
      setImgSrc(null);
      return;
    }

    if (typeof imageSource === 'string') {
      setImgSrc(imageSource);
    } else {
      const url = URL.createObjectURL(imageSource);
      setImgSrc(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageSource]);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setAspectRatio('3:4');
      setCropRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
      setImgLoaded(false);
    }
  }, [isOpen]);

  // Adjust crop rect when aspect ratio changes
  const applyAspectRatio = useCallback((ratioType: AspectRatioOption) => {
    setAspectRatio(ratioType);
    if (!imgRef.current) return;

    if (ratioType === 'free') return;

    let targetRatio = 1;
    if (ratioType === '1:1') targetRatio = 1;
    else if (ratioType === '3:4') targetRatio = 3 / 4;
    else if (ratioType === '4:3') targetRatio = 4 / 3;
    else if (ratioType === '16:9') targetRatio = 16 / 9;

    const imgWidth = imgRef.current.clientWidth || 400;
    const imgHeight = imgRef.current.clientHeight || 400;
    const currentContainerRatio = imgWidth / imgHeight;

    let newWidth = 0.8;
    let newHeight = (newWidth * currentContainerRatio) / targetRatio;

    if (newHeight > 0.9) {
      newHeight = 0.8;
      newWidth = (newHeight * targetRatio) / currentContainerRatio;
    }

    setCropRect({
      x: Math.max(0.05, (1 - newWidth) / 2),
      y: Math.max(0.05, (1 - newHeight) / 2),
      width: Math.min(0.9, newWidth),
      height: Math.min(0.9, newHeight),
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !dragMode) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / rect.width;
    const dy = (e.clientY - dragStart.y) / rect.height;

    setCropRect((prev) => {
      let { x, y, width, height } = prev;

      if (dragMode === 'move') {
        const nextX = Math.min(Math.max(0, x + dx), 1 - width);
        const nextY = Math.min(Math.max(0, y + dy), 1 - height);
        return { ...prev, x: nextX, y: nextY };
      }

      if (dragMode === 'se') {
        const nextW = Math.min(Math.max(0.1, width + dx), 1 - x);
        const nextH = Math.min(Math.max(0.1, height + dy), 1 - y);
        return { ...prev, width: nextW, height: nextH };
      }

      if (dragMode === 'nw') {
        const nextX = Math.min(Math.max(0, x + dx), x + width - 0.1);
        const nextY = Math.min(Math.max(0, y + dy), y + height - 0.1);
        const nextW = width - (nextX - x);
        const nextH = height - (nextY - y);
        return { x: nextX, y: nextY, width: nextW, height: nextH };
      }

      if (dragMode === 'ne') {
        const nextY = Math.min(Math.max(0, y + dy), y + height - 0.1);
        const nextW = Math.min(Math.max(0.1, width + dx), 1 - x);
        const nextH = height - (nextY - y);
        return { ...prev, y: nextY, width: nextW, height: nextH };
      }

      if (dragMode === 'sw') {
        const nextX = Math.min(Math.max(0, x + dx), x + width - 0.1);
        const nextW = width - (nextX - x);
        const nextH = Math.min(Math.max(0.1, height + dy), 1 - y);
        return { ...prev, x: nextX, width: nextW, height: nextH };
      }

      return prev;
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragMode, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragMode(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCrop = async () => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate natural image dimensions
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const cropX = cropRect.x * naturalWidth;
    const cropY = cropRect.y * naturalHeight;
    const cropW = cropRect.width * naturalWidth;
    const cropH = cropRect.height * naturalHeight;

    canvas.width = cropW;
    canvas.height = cropH;

    // Handle rotation if applied
    if (rotation !== 0) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      if (rotation === 90 || rotation === 270) {
        tempCanvas.width = naturalHeight;
        tempCanvas.height = naturalWidth;
      } else {
        tempCanvas.width = naturalWidth;
        tempCanvas.height = naturalHeight;
      }

      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2);

      const rotCropX = cropRect.x * tempCanvas.width;
      const rotCropY = cropRect.y * tempCanvas.height;
      const rotCropW = cropRect.width * tempCanvas.width;
      const rotCropH = cropRect.height * tempCanvas.height;

      canvas.width = rotCropW;
      canvas.height = rotCropH;
      ctx.drawImage(tempCanvas, rotCropX, rotCropY, rotCropW, rotCropH, 0, 0, rotCropW, rotCropH);
    } else {
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const filename = `cropped-product-${Date.now()}.jpg`;
      const croppedFile = new File([blob], filename, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      onCropComplete(croppedFile, previewUrl);
      onClose();
    }, 'image/jpeg', 0.92);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CropIcon className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Aspect Ratio Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-2.5 rounded-lg border text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Ratio:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['3:4', '1:1', '4:3', '16:9', 'free'] as AspectRatioOption[]).map((r) => (
                <Button
                  key={r}
                  type="button"
                  size="sm"
                  variant={aspectRatio === r ? 'default' : 'outline'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => applyAspectRatio(r)}
                >
                  {r === '3:4' ? '3:4 (Portrait)' : r === '1:1' ? '1:1 (Square)' : r}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                title="Rotate 90°"
              >
                <RotateCw className="h-3.5 w-3.5 mr-1" />
                {rotation}°
              </Button>
            </div>
          </div>

          {/* Image Workspace Area */}
          <div className="relative w-full h-[360px] bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center select-none">
            {imgSrc ? (
              <div
                ref={containerRef}
                className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={() => {
                    setImgLoaded(true);
                    applyAspectRatio(aspectRatio);
                  }}
                  className="max-h-[360px] w-auto object-contain pointer-events-none transition-transform"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                />

                {/* Dark Overlay with Transparent Crop Window */}
                {imgLoaded && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Darkened mask */}
                    <div
                      className="absolute inset-0 bg-black/60 pointer-events-auto"
                      style={{
                        clipPath: `polygon(
                          0% 0%, 0% 100%, 
                          ${cropRect.x * 100}% 100%, 
                          ${cropRect.x * 100}% ${cropRect.y * 100}%, 
                          ${(cropRect.x + cropRect.width) * 100}% ${cropRect.y * 100}%, 
                          ${(cropRect.x + cropRect.width) * 100}% ${(cropRect.y + cropRect.height) * 100}%, 
                          ${cropRect.x * 100}% ${(cropRect.y + cropRect.height) * 100}%, 
                          ${cropRect.x * 100}% 100%, 
                          100% 100%, 100% 0%
                        )`,
                      }}
                    />

                    {/* Crop Box Frame */}
                    <div
                      className="absolute border-2 border-primary shadow-2xl pointer-events-auto cursor-move"
                      style={{
                        left: `${cropRect.x * 100}%`,
                        top: `${cropRect.y * 100}%`,
                        width: `${cropRect.width * 100}%`,
                        height: `${cropRect.height * 100}%`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'move')}
                    >
                      {/* Grid Lines inside crop window */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                        <div className="border-r border-b border-white/60" />
                        <div className="border-r border-b border-white/60" />
                        <div className="border-b border-white/60" />
                        <div className="border-r border-b border-white/60" />
                        <div className="border-r border-b border-white/60" />
                        <div className="border-b border-white/60" />
                        <div className="border-r border-white/60" />
                        <div className="border-r border-white/60" />
                        <div />
                      </div>

                      {/* Resize Corner Handles */}
                      <div
                        className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full cursor-nwse-resize pointer-events-auto"
                        onMouseDown={(e) => handleMouseDown(e, 'nw')}
                      />
                      <div
                        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full cursor-nesw-resize pointer-events-auto"
                        onMouseDown={(e) => handleMouseDown(e, 'ne')}
                      />
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full cursor-nesw-resize pointer-events-auto"
                        onMouseDown={(e) => handleMouseDown(e, 'sw')}
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full cursor-nwse-resize pointer-events-auto"
                        onMouseDown={(e) => handleMouseDown(e, 'se')}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No image selected</div>
            )}
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-lg border">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(val: any) => setZoom(Array.isArray(val) ? val[0] : (typeof val === 'number' ? val : 1))}
              className="flex-1 cursor-pointer"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono text-muted-foreground w-12 text-right">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex sm:justify-between items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1.5" /> Cancel
          </Button>
          <Button type="button" onClick={handleCrop} className="gap-1.5">
            <Check className="h-4 w-4" /> Apply & Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
