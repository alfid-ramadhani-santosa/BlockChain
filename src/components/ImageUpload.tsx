'use client';
import React, { useRef, useState } from 'react';
import type { AnalyzeImageResult } from '@/lib/types';

interface ImageUploadProps {
  onAnalyzed: (result: AnalyzeImageResult) => void;
}

export default function ImageUpload({ onAnalyzed }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }

    setError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);

      // Extract base64 and media type
      const [header, base64] = dataUrl.split(',');
      const mediaType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      try {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to analyze image');
        }

        onAnalyzed(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze image');
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${dragOver
            ? 'border-cyan-400 bg-cyan-400/10'
            : 'border-cyan-400/20 hover:border-cyan-400/40 hover:bg-cyan-400/5'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-4xl mb-3">📸</div>
        <div className="text-white font-medium mb-1">
          {dragOver ? 'Drop image here' : 'Upload game screenshot'}
        </div>
        <div className="text-[#a0a8d4] text-sm">
          Drag & drop or click to select • PNG, JPG, JPEG
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="relative rounded-xl overflow-hidden border border-cyan-400/20">
          <img
            src={previewUrl}
            alt="Game screenshot"
            className="w-full h-auto max-h-72 object-contain bg-[#0a0e27]"
          />
          {loading && (
            <div className="absolute inset-0 bg-[#050814]/80 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
              <div className="text-cyan-400 font-medium text-sm animate-pulse">
                🤖 Claude AI analyzing...
              </div>
              <div className="text-[#a0a8d4] text-xs">Detecting grid & pieces</div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="text-red-400 text-sm">❌ {error}</div>
          {error.includes('ANTHROPIC_API_KEY') && (
            <div className="text-[#a0a8d4] text-xs mt-1">
              Add your API key in <code className="text-cyan-400">.env.local</code>:
              <br />
              <code className="text-yellow-400">ANTHROPIC_API_KEY=your_key</code>
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      {!loading && (
        <div className="bg-cyan-400/5 border-l-2 border-cyan-400 rounded-r-lg p-3">
          <div className="text-[#a0a8d4] text-xs">
            💡 <strong className="text-white">Tip:</strong> Upload a clear screenshot of your Block Blast game.
            Claude AI will automatically detect the 8×8 grid state and the 3 available pieces.
          </div>
        </div>
      )}
    </div>
  );
}
