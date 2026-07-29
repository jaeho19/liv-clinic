'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { sanitizeStorageFolder } from '@/lib/storageFolder';
import Image from 'next/image';

const ALLOWED_MIME_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MIME_BY_EXTENSION: Record<string, string | undefined> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

const EXTENSION_BY_MIME: Record<string, string | undefined> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Windows Chrome resolves MIME -> extension through the registry; a broken entry greys out
// valid JPG/PNG files when `accept` lists MIME types only. List extensions as well.
const ACCEPT_ATTRIBUTE = '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif';

type UploadFailure = { readonly name: string; readonly reason: string; readonly message: string };

const getExtension = (fileName: string): string => {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
};

// Browsers can report an empty `file.type`; fall back to the extension so supabase-js does not
// send `text/plain` and get rejected by the bucket's allowed_mime_types.
const resolveContentType = (file: File): string | undefined =>
  ALLOWED_MIME_TYPES.includes(file.type) ? file.type : MIME_BY_EXTENSION[getExtension(file.name)];

const validateFile = (file: File, maxSizeMb: number): UploadFailure | null => {
  if (file.size > maxSizeMb * 1024 * 1024) {
    return { name: file.name, reason: `${maxSizeMb}MB 초과`, message: `파일 크기는 ${maxSizeMb}MB 이하여야 합니다.` };
  }
  if (!resolveContentType(file)) {
    return { name: file.name, reason: '지원하지 않는 형식', message: 'JPG, PNG, WebP, GIF 파일만 업로드 가능합니다.' };
  }
  return null;
};

const buildStoragePath = (folder: string, index: number, file: File, contentType: string): string => {
  const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  const rawExt = getExtension(file.name);
  const ext = MIME_BY_EXTENSION[rawExt] ? rawExt : EXTENSION_BY_MIME[contentType] ?? 'jpg';
  // Korean event slugs reach us verbatim; an unsanitized folder makes Storage answer 400 InvalidKey.
  return `${sanitizeStorageFolder(folder)}/${Date.now()}-${index}-${suffix}.${ext}`;
};

interface ImageUploaderBaseProps {
  bucket: 'events' | 'popups' | 'patient-photos' | 'before-after';
  folder: string;
  label?: string;
  maxSizeMb?: number;
}

type ImageUploaderProps = ImageUploaderBaseProps &
  (
    | { multiple?: false; value: string | null; onChange: (url: string | null) => void; onUploadMany?: never }
    | { multiple: true; onUploadMany: (urls: string[]) => void; value?: never; onChange?: never }
  );

export default function ImageUploader(props: ImageUploaderProps) {
  const { bucket, folder, label, maxSizeMb = 5 } = props;
  const isMultiple = props.multiple === true;
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reportFailures = (failures: readonly UploadFailure[], total: number) => {
    if (failures.length === 0) return;
    if (total === 1) {
      alert(failures[0].message);
      return;
    }
    const lines = failures.map((failure) => `- ${failure.name}: ${failure.reason}`).join('\n');
    alert(`${total}개 중 ${failures.length}개 실패:\n${lines}`);
  };

  const deliver = (urls: readonly string[]) => {
    if (props.multiple) {
      props.onUploadMany([...urls]);
      return;
    }
    if (urls.length > 0) props.onChange(urls[0]);
  };

  const uploadFiles = async (selected: readonly File[]) => {
    const sorted = [...selected].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    const checked = sorted.map((file) => ({ file, failure: validateFile(file, maxSizeMb) }));
    const accepted = checked.filter((item) => item.failure === null).map((item) => item.file);
    const rejected = checked.flatMap((item) => (item.failure ? [item.failure] : []));

    if (accepted.length === 0) {
      reportFailures(rejected, sorted.length);
      return;
    }

    setUploading(true);
    let urls: readonly string[] = [];
    let failures: readonly UploadFailure[] = rejected;

    for (let i = 0; i < accepted.length; i += 1) {
      const file = accepted[i];
      setProgress({ current: i + 1, total: accepted.length });

      const contentType = resolveContentType(file) ?? 'image/jpeg';
      const path = buildStoragePath(folder, i, file, contentType);
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

      if (error) {
        failures = [
          ...failures,
          { name: file.name, reason: error.message, message: `업로드 실패 (${file.name}): ${error.message}` },
        ];
        continue;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      urls = [...urls, urlData.publicUrl];
    }

    setProgress(null);
    setUploading(false);
    deliver(urls);
    reportFailures(failures, sorted.length);
  };

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const all = Array.from(list);
    void uploadFiles(isMultiple ? all : all.slice(0, 1));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = async () => {
    if (props.multiple) return;
    const { value, onChange } = props;
    if (!value) return;
    // Extract path from URL
    const url = new URL(value);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`);
    if (pathParts[1]) {
      await supabase.storage.from(bucket).remove([pathParts[1]]);
    }
    onChange(null);
  };

  const previewUrl = props.multiple ? null : props.value;

  return (
    <div>
      {label && <label className="block text-sm font-medium text-[#575756] mb-1.5">{label}</label>}

      {previewUrl ? (
        <div className="relative inline-block">
          <Image
            src={previewUrl}
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
            <p className="text-sm text-[#8a8a8a]">
              {progress && progress.total > 1 ? `업로드 중... (${progress.current}/${progress.total})` : '업로드 중...'}
            </p>
          ) : (
            <>
              <p className="text-sm text-[#8a8a8a] mb-1">
                {isMultiple ? '클릭하거나 여러 장을 한 번에 드래그하세요' : '클릭하거나 파일을 드래그하세요'}
              </p>
              <p className="text-xs text-[#b4b4b4]">
                {isMultiple
                  ? `JPG, PNG, WebP · 여러 장 선택 가능 (장당 최대 ${maxSizeMb}MB)`
                  : `JPG, PNG, WebP (최대 ${maxSizeMb}MB)`}
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple={isMultiple}
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
