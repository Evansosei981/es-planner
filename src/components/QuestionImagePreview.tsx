import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, X, Eye } from 'lucide-react';

interface QuestionImagePreviewProps {
  imageUrl: string;
  alt?: string;
  className?: string;
}

export const QuestionImagePreview: React.FC<QuestionImagePreviewProps> = ({
  imageUrl,
  alt = "Problem illustration or document",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  // Reset scale when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!imageUrl) return null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Thumbnail / In-Card Preview */}
      <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#0E0E14] max-h-72 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-auto max-h-72 object-contain select-none cursor-pointer group-hover:scale-[1.01] transition-transform duration-200"
          onClick={() => setIsOpen(true)}
          loading="lazy"
        />

        {/* Hover / Tap Overlay to Enlarge */}
        <div
          onClick={() => setIsOpen(true)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2 backdrop-blur-[2px]"
        >
          <div className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Click to Enlarge / Zoom</span>
          </div>
        </div>

        {/* Image Source Badge */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/10 pointer-events-none">
          <Eye className="w-3 h-3 text-[#00D4A1]" />
          <span>Uploaded Problem Image</span>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          {/* Header Controls */}
          <div
            className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-white">
              <Eye className="w-4 h-4 text-[#00D4A1]" />
              <span className="text-sm font-bold">Uploaded Problem Image</span>
              <span className="text-xs text-gray-400">· Use controls to inspect math details</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-gray-300 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setScale(prev => Math.min(3.5, prev + 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-[#EF4444]/80 text-white transition-colors ml-2"
                title="Close (Escape)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Zoomable Image Container */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={alt}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out'
              }}
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
