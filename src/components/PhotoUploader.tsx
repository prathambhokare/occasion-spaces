'use client';

import React, { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface PresetImage {
  label: string;
  url: string;
}

interface PhotoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  presets?: PresetImage[];
  label?: string;
  helperText?: string;
}

export function PhotoUploader({
  value,
  onChange,
  presets = [],
  label = 'Add a Photo or Moment',
  helperText = 'Upload a photo from your gallery, snap a live camera shot, or pick a sample preset.',
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMessage('');

    // Check type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WebP, or GIF).');
      return;
    }

    // Check size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 10MB.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      onChange(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Remove photo
          </button>
        )}
      </div>

      {/* Hidden file inputs: one for generic file/gallery, one for camera capture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={onFileInputChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Current Preview or Upload Dropzone */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900/40 aspect-video max-h-56">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white/90 text-stone-900 text-xs font-semibold shadow-md hover:bg-white flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Replace Photo
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-semibold shadow-md hover:bg-amber-400 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Retake Shot
            </button>
          </div>
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-md text-[10px] text-white font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Photo attached
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${
            dragOver
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
              : 'border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850/40 hover:bg-stone-50 dark:hover:bg-stone-800/40'
          }`}
        >
          {uploading ? (
            <div className="py-4 flex flex-col items-center gap-2 text-amber-600 dark:text-amber-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <p className="text-xs font-medium">Uploading high-res photo...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Drag and drop an image, or snap a photo
                </p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {helperText} (Max 10MB)
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  Choose from Gallery
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-xs hover:from-amber-700 hover:to-rose-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Take Photo
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cultural Sample Presets Gallery */}
      {presets.length > 0 && (
        <div className="pt-2">
          <span className="text-[11px] text-stone-400 block mb-2">
            Or select a sample occasion preset:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-400/30'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-stone-950/80 backdrop-blur-xs text-[9px] text-white font-medium py-1 px-1.5 truncate text-center">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

