import React, { useState, useRef } from 'react';
import { Image, Upload, Link2, Sparkles, X, Check, ArrowUp, Camera, AlertCircle } from 'lucide-react';
import { Character, PhotoPreset } from '../types';
import { PHOTO_PRESETS } from '../data/photoPresets';
import { handleAvatarImageError } from '../utils/avatarHelper';

interface SharePhotoModalProps {
  character: Character;
  onSendPhoto: (imageUrl: string, caption: string) => void;
  onClose: () => void;
}

export const SharePhotoModal: React.FC<SharePhotoModalProps> = ({
  character,
  onSendPhoto,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset | null>(PHOTO_PRESETS[0]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image file is too large. Please select an image under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: PhotoPreset) => {
    setSelectedPreset(preset);
  };

  const getEffectiveImageUrl = (): string => {
    if (activeTab === 'upload') return uploadedImageBase64 || '';
    if (activeTab === 'presets') return selectedPreset?.url || '';
    if (activeTab === 'url') return customImageUrl.trim();
    return '';
  };

  const canSend = Boolean(getEffectiveImageUrl());

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const url = getEffectiveImageUrl();
    if (!url) return;
    onSendPhoto(url, caption.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-[#0d0f17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#131622]/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Share a Picture</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-normal">
                  with {character.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Send a snapshot, outfit check, late night food, or custom photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#090a0f] p-1.5 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-[#1a1e2e] text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Gallery</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-[#1a1e2e] text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Device File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-[#1a1e2e] text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Select Photo Drop:
              </span>
              <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {PHOTO_PRESETS.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition group aspect-square bg-[#131622] ${
                        isSelected
                          ? 'border-purple-500 shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/20'
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        onError={(e) => handleAvatarImageError(e, preset.label)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-[10px] text-white font-medium truncate">
                        {preset.label}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadedImageBase64 ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-56 bg-zinc-950 flex items-center justify-center">
                  <img
                    src={uploadedImageBase64}
                    alt="Upload preview"
                    className="max-h-56 w-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImageBase64(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-purple-500/60 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-white/5 hover:bg-white/[0.08] text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    Click to select a photo from your device
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports PNG, JPG, GIF, WebP up to 10MB
                  </p>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                Direct Image Link:
              </label>
              <input
                type="url"
                value={customImageUrl}
                onChange={(e) => {
                  setCustomImageUrl(e.target.value);
                  setUploadError(null);
                }}
                placeholder="https://images.unsplash.com/... or any web image link"
                className="w-full bg-[#131622] border border-white/10 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
              {customImageUrl.trim() && (
                <div className="rounded-2xl overflow-hidden border border-white/10 max-h-48 bg-zinc-950 flex items-center justify-center">
                  <img
                    src={customImageUrl.trim()}
                    alt="URL preview"
                    referrerPolicy="no-referrer"
                    className="max-h-48 w-auto object-contain"
                    onError={(e) => {
                      handleAvatarImageError(e, 'Preview');
                      setUploadError('Unable to load this image URL. Using fallback preview.');
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Caption Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Message or Note with Photo (Optional):
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a note... (optional)"
              className="w-full bg-[#131622] border border-white/10 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#090a0f] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={handleSend}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-purple-600/30"
          >
            <span>Send to {character.name}</span>
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
