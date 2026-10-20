'use client';

import React, { useState, useMemo } from 'react';
import { generateQRCodeSVG } from '@/lib/qrcode';
import { QrCode, Copy, Check, Download, Printer, X, Sparkles, MapPin } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceName: string;
  spaceUrl: string;
  venue?: string;
  city?: string;
  inviteCode?: string;
}

export function QRCodeModal({
  isOpen,
  onClose,
  spaceName,
  spaceUrl,
  venue,
  city,
  inviteCode,
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const qrSvgString = useMemo(() => {
    if (!isOpen || !spaceUrl) return '';
    try {
      return generateQRCodeSVG(spaceUrl, {
        size: 260,
        margin: 2,
        color: '#1c1917', // stone-900
        bgColor: '#ffffff',
      });
    } catch (e) {
      console.error('Failed to generate QR code SVG:', e);
      return '';
    }
  }, [isOpen, spaceUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(spaceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${spaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-150 print:bg-white print:p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden print:shadow-none print:border-none print:max-w-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Hidden during print) */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Share & Print QR Code
              </h3>
              <p className="text-[11px] text-stone-400">
                Place on tables, entryway easels, or digital screens
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center space-y-4 print:p-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-semibold tracking-wide uppercase">
              <Sparkles className="w-3 h-3" />
              Scan with any phone camera
            </div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 print:text-2xl">
              {spaceName}
            </h2>
            {(venue || city) && (
              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{[venue, city].filter(Boolean).join(', ')}</span>
              </p>
            )}
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl shadow-inner border border-stone-100 dark:border-stone-800 inline-block mx-auto print:border-2 print:border-stone-300">
            {qrSvgString ? (
              <div
                dangerouslySetInnerHTML={{ __html: qrSvgString }}
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                Generating QR code...
              </div>
            )}
          </div>

          <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-xs mx-auto print:text-sm">
            Point your mobile camera at this code to open the Occasion Space, share memories, and view live blessings.
          </p>

          {inviteCode && (
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 max-w-xs mx-auto text-xs">
              <span className="text-stone-400 block text-[10px]">Invite-Only Code:</span>
              <strong className="font-mono text-stone-900 dark:text-stone-100 tracking-wider text-sm">
                {inviteCode}
              </strong>
            </div>
          )}
        </div>

        {/* Action Controls (Hidden during print) */}
        <div className="p-4 bg-stone-50/70 dark:bg-stone-850/50 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                Copy Link
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-stone-400" />
              Download SVG
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
