import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { handleAvatarImageError } from '../utils/avatarHelper';

interface ImageLightboxModalProps {
  imageUrl: string;
  caption?: string;
  senderName?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  caption,
  senderName,
  onClose,
}) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[92vh] flex flex-col items-center justify-center"
      >
        {/* Top Control Bar */}
        <div className="absolute -top-12 inset-x-0 flex items-center justify-between text-white px-2">
          <div className="text-xs font-medium text-slate-300">
            {senderName ? `Shared by ${senderName}` : 'Image Preview'}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download="pulsedirect_share.png"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1"
              title="Open full resolution"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Image */}
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-2xl max-h-[80vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Full Preview"
            referrerPolicy="no-referrer"
            onError={(e) => handleAvatarImageError(e, senderName || 'Preview')}
            className="max-h-[78vh] w-auto max-w-full object-contain select-none"
          />
        </div>

        {/* Caption */}
        {caption && (
          <div className="mt-3 px-4 py-2 bg-[#131622]/90 border border-white/10 rounded-2xl text-xs text-slate-200 max-w-xl text-center shadow-lg">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};
