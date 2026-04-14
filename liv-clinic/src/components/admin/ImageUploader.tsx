'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Image from 'next/image';

interface ImageUploaderProps {
  bucket: 'events' | 'popups' | 'patient-photos' | 'before-after';
  folder: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  maxSizeMb?: number;
}

export default function ImageUploader({ bucket, folder, value, onChange, label, maxSizeMb = 5 }: ImageUploaderProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`파일 크기는 ${maxSizeMb}MB 이하여야 합니다.`);
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      alert('JPG, PNG, WebP, GIF 파일만 업로드 가능합니다.');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      alert('업로드 실패: ' + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    onChange(urlData.publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleRemove = async () => {
    if (!value) return;
    // Extract path from URL
    const url = new URL(value);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`);
    if (pathParts[1]) {
      await supabase.storage.from(bucket).remove([pathParts[1]]);
    }
    onChange(null);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-[#575756] mb-1.5">{label}</label>}

      {value ? (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Uploaded"
            width={240}
            height={160}
            className="rounded-lg border border-[#e5e5e5] object-cover"
            style={{ width: 240, height: 160 }}
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-[#b4988d] bg-[#b4988d]/5' : 'border-[#e5e5e5] hover:border-[#b4988d]'
          }`}
        >
          {uploading ? (
            <p className="text-sm text-[#8a8a8a]">업로드 중...</p>
          ) : (
            <>
              <p className="text-sm text-[#8a8a8a] mb-1">클릭하거나 파일을 드래그하세요</p>
              <p className="text-xs text-[#b4b4b4]">JPG, PNG, WebP (최대 {maxSizeMb}MB)</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
