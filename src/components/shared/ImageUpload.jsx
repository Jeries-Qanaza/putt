import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { prepareImageForUpload } from '@/lib/imageUpload';

export default function ImageUpload({ value, onChange, className = '', restaurantId = '', entityType = 'uploads' }) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const previewUrl = await prepareImageForUpload(file);
      onChange(previewUrl);
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to process image.');
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    await processFile(file);
    e.target.value = '';
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

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <label
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed aspect-video transition-colors ${
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
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{t('uploadImage')}</span>
              <span className="mt-1 text-xs text-muted-foreground/80">Drag and drop or click to upload</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
