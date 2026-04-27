import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { imageUploadRules, prepareImageForUpload } from '@/lib/imageUpload';

const DEFAULT_CROP = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

function getMaxOffsetPercent(zoom) {
  if (zoom <= 1) return 0;
  return ((zoom - 1) / zoom) * 50;
}

function clampOffset(value, zoom) {
  const maxOffset = getMaxOffsetPercent(zoom);
  return Math.max(-maxOffset, Math.min(maxOffset, value));
}

function getAspectClass(cropAspect) {
  return Math.abs(cropAspect - 1) < 0.01 ? 'aspect-square' : 'aspect-video';
}

export default function ImageUpload({
  value,
  onChange,
  className = '',
  cropAspect = 16 / 9,
}) {
  const { t } = useI18n();
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropState, setCropState] = useState(DEFAULT_CROP);
  const [previewSrc, setPreviewSrc] = useState('');
  const dragStateRef = useRef(null);
  const activePointersRef = useRef(new Map());
  const pinchStateRef = useRef(null);

  const aspectClass = useMemo(() => getAspectClass(cropAspect), [cropAspect]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewSrc('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(pendingFile);
    setPreviewSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingFile]);

  const validateFile = (file) => {
    if (!file) return 'Failed to process image.';
    if (!imageUploadRules.allowedTypes.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WEBP image.';
    }
    if (file.size > imageUploadRules.maxUploadBytes) {
      return 'Image is too large. Please use an image under 2MB.';
    }
    return '';
  };

  const openCropper = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setIsDragging(false);
      return;
    }

    setError('');
    setPendingFile(file);
    setCropState({ ...DEFAULT_CROP });
    setCropOpen(true);
  };

  const processFile = async (file) => {
    openCropper(file);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    await processFile(file);
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    const nextTarget = event.relatedTarget;
    if (!event.currentTarget.contains(nextTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    if (uploading) return;
    const file = event.dataTransfer?.files?.[0];
    await processFile(file);
  };

  const closeCropper = () => {
    setCropOpen(false);
    setPendingFile(null);
    setCropState({ ...DEFAULT_CROP });
    setIsDragging(false);
    activePointersRef.current.clear();
    dragStateRef.current = null;
    pinchStateRef.current = null;
  };

  const applyCrop = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setError('');
    try {
      const nextValue = await prepareImageForUpload(pendingFile, {
        crop: {
          aspectRatio: cropAspect,
          zoom: cropState.zoom,
          offsetX: cropState.offsetX / 100,
          offsetY: cropState.offsetY / 100,
        },
      });
      onChange(nextValue);
      closeCropper();
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to process image.');
    } finally {
      setUploading(false);
    }
  };

  const handleCropPointerDown = (event) => {
    if (!previewSrc) return;
    event.preventDefault();
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointersRef.current.size === 1) {
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startOffsetX: cropState.offsetX,
        startOffsetY: cropState.offsetY,
      };
      pinchStateRef.current = null;
    } else if (activePointersRef.current.size === 2) {
      const [first, second] = [...activePointersRef.current.values()];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      pinchStateRef.current = {
        startDistance: distance || 1,
        startZoom: cropState.zoom,
      };
      dragStateRef.current = null;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleCropPointerMove = (event) => {
    if (!activePointersRef.current.has(event.pointerId)) return;
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointersRef.current.size >= 2 && pinchStateRef.current) {
      const [first, second] = [...activePointersRef.current.values()];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const nextZoom = pinchStateRef.current.startZoom * (distance / pinchStateRef.current.startDistance);
      setCropState((current) => ({
        ...current,
        zoom: Math.max(1, Math.min(3, Number(nextZoom.toFixed(2)))),
        offsetX: clampOffset(current.offsetX, Math.max(1, Math.min(3, Number(nextZoom.toFixed(2))))),
        offsetY: clampOffset(current.offsetY, Math.max(1, Math.min(3, Number(nextZoom.toFixed(2))))),
      }));
      return;
    }

    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    setCropState((current) => ({
      ...current,
      offsetX: clampOffset(dragStateRef.current.startOffsetX + deltaX / 2.2, current.zoom),
      offsetY: clampOffset(dragStateRef.current.startOffsetY + deltaY / 2.2, current.zoom),
    }));
  };

  const handleCropPointerEnd = (event) => {
    activePointersRef.current.delete(event.pointerId);
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
    if (activePointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    if (activePointersRef.current.size === 1) {
      const [remainingId, remainingPoint] = [...activePointersRef.current.entries()][0];
      dragStateRef.current = {
        pointerId: remainingId,
        startX: remainingPoint.x,
        startY: remainingPoint.y,
        startOffsetX: cropState.offsetX,
        startOffsetY: cropState.offsetY,
      };
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className={`relative overflow-hidden rounded-lg bg-muted ${aspectClass}`}>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 bg-white/85 shadow-sm"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              {t('edit')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => onChange('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${aspectClass} ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('uploadImage')}</span>
              <span className="mt-1 text-xs text-muted-foreground/80">Drag and drop or click to upload</span>
            </>
          )}
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />

      {cropOpen ? (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-card p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Crop image</h3>
                <p className="text-sm text-muted-foreground">
                  Resize and reposition the image so it fits nicely before saving.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={closeCropper}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className={`relative overflow-hidden rounded-2xl bg-muted ${aspectClass}`}>
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt=""
                  className="absolute left-1/2 top-1/2 h-full w-full max-w-none cursor-grab object-cover active:cursor-grabbing"
                  style={{
                    transform: `translate(calc(-50% + ${cropState.offsetX}%), calc(-50% + ${cropState.offsetY}%)) scale(${cropState.zoom})`,
                    transformOrigin: 'center',
                  }}
                  draggable={false}
                />
              ) : null}
              <div
                className="absolute inset-0 z-10 touch-none"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerEnd}
                onPointerCancel={handleCropPointerEnd}
              />
              <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl ring-1 ring-white/30" />
              <div className="pointer-events-none absolute inset-y-0 left-1/3 z-20 w-px bg-black/30" />
              <div className="pointer-events-none absolute inset-y-0 left-2/3 z-20 w-px bg-black/30" />
              <div className="pointer-events-none absolute inset-x-0 top-1/3 z-20 h-px bg-black/30" />
              <div className="pointer-events-none absolute inset-x-0 top-2/3 z-20 h-px bg-black/30" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Zoom</Label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropState.zoom}
                  onChange={(event) =>
                    setCropState((current) => {
                      const nextZoom = Number(event.target.value);
                      return {
                        ...current,
                        zoom: nextZoom,
                        offsetX: clampOffset(current.offsetX, nextZoom),
                        offsetY: clampOffset(current.offsetY, nextZoom),
                      };
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeCropper}>
                {t('cancel')}
              </Button>
              <Button type="button" onClick={applyCrop} disabled={uploading}>
                {uploading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
