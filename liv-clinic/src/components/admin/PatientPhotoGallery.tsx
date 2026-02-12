'use client';

import { useState, useEffect, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import Image from 'next/image';

interface PatientPhoto {
  id: string;
  patient_name: string;
  phone: string | null;
  photo_type: string;
  photo_url: string;
  procedure_name: string | null;
  memo: string | null;
  taken_at: string;
  uploaded_by: string | null;
  created_at: string;
}

interface PatientPhotoGalleryProps {
  patientName: string;
  phone: string | null;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: 'Before',
  after: 'After',
  progress: '경과',
};

const PHOTO_TYPE_COLORS: Record<string, string> = {
  before: 'bg-blue-50 text-blue-700',
  after: 'bg-emerald-50 text-emerald-700',
  progress: 'bg-[#b4988d]/10 text-[#b4988d]',
};

export default function PatientPhotoGallery({ patientName, phone }: PatientPhotoGalleryProps) {
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState<PatientPhoto | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  // Upload form state
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<string>('progress');
  const [procedureName, setProcedureName] = useState('');
  const [memo, setMemo] = useState('');
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchPhotos = useCallback(async () => {
    setFetchError(null);
    try {
      const params = new URLSearchParams({ name: patientName });
      if (phone) params.set('phone', phone);
      const res = await fetch(`/api/admin/patients/photos?${params}`);
      if (res.ok) {
        setPhotos(await res.json());
      } else {
        setFetchError('사진 목록을 불러오지 못했습니다.');
      }
    } catch {
      setFetchError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [patientName, phone]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleUpload = async () => {
    if (!uploadUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/patients/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          phone: phone || null,
          photo_type: photoType,
          photo_url: uploadUrl,
          procedure_name: procedureName || null,
          memo: memo || null,
          taken_at: takenAt,
        }),
      });
      if (res.ok) {
        await fetchPhotos();
        resetUploadForm();
      } else {
        const err = await res.json();
        alert(err.error || '업로드 실패');
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/patients/photos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        if (lightbox?.id === id) setLightbox(null);
      }
    } catch {
      alert('삭제 실패');
    }
  };

  const resetUploadForm = () => {
    setShowUpload(false);
    setUploadUrl(null);
    setPhotoType('progress');
    setProcedureName('');
    setMemo('');
    setTakenAt(new Date().toISOString().split('T')[0]);
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    const dt = new Date(d);
    return `${dt.getFullYear()}.${(dt.getMonth() + 1).toString().padStart(2, '0')}.${dt.getDate().toString().padStart(2, '0')}`;
  };

  // Before/After comparison view
  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="inline-block w-6 h-6 border-[3px] border-[#b4988d]/30 border-t-[#b4988d] rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#a09080]">
        <p className="text-sm text-red-500 mb-3">{fetchError}</p>
        <button onClick={fetchPhotos} className="text-xs text-[#6d4e42] font-semibold hover:underline cursor-pointer">다시 시도</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#ebe7e4]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a09080] font-medium">{photos.length}장</span>
          {beforePhotos.length > 0 && afterPhotos.length > 0 && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                compareMode ? 'bg-[#6d4e42] text-white' : 'bg-[#f6f4f2] text-[#6d4e42] hover:bg-[#ebe7e4]'
              }`}
            >
              Before/After 비교
            </button>
          )}
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-3 py-1.5 bg-[#b4988d] text-white rounded-lg text-xs font-semibold hover:bg-[#a08878] transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
          사진 업로드
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="px-5 py-4 border-b border-[#ebe7e4] bg-[#faf8f7]">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] text-[#a09080] font-semibold mb-1 uppercase tracking-wide">사진 구분</label>
              <select
                value={photoType}
                onChange={e => setPhotoType(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-lg px-3 py-2 text-sm"
              >
                <option value="before">Before</option>
                <option value="after">After</option>
                <option value="progress">경과</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#a09080] font-semibold mb-1 uppercase tracking-wide">촬영일</label>
              <input
                type="date"
                value={takenAt}
                onChange={e => setTakenAt(e.target.value)}
                className="w-full border border-[#ebe7e4] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#a09080] font-semibold mb-1 uppercase tracking-wide">시술명</label>
              <input
                type="text"
                value={procedureName}
                onChange={e => setProcedureName(e.target.value)}
                placeholder="울쎄라 시술"
                className="w-full border border-[#ebe7e4] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#a09080] font-semibold mb-1 uppercase tracking-wide">메모</label>
              <input
                type="text"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="메모 입력"
                className="w-full border border-[#ebe7e4] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <ImageUploader
            bucket="patient-photos"
            folder={`${patientName}/${takenAt}`}
            value={uploadUrl}
            onChange={setUploadUrl}
            label="사진 선택"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={resetUploadForm}
              className="px-3 py-2 text-xs text-[#a09080] border border-[#ebe7e4] rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadUrl || submitting}
              className="px-4 py-2 text-xs bg-[#6d4e42] text-white rounded-lg font-semibold hover:bg-[#5a3d33] transition-colors cursor-pointer disabled:opacity-40"
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* Compare mode */}
      {compareMode && beforePhotos.length > 0 && afterPhotos.length > 0 && (
        <div className="px-5 py-4 border-b border-[#ebe7e4]">
          <h4 className="text-xs font-semibold text-[#6d4e42] mb-3">Before / After 비교</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-blue-600 font-semibold mb-1.5">Before</p>
              <div className="space-y-2">
                {beforePhotos.slice(0, 3).map(p => (
                  <div key={p.id} className="relative cursor-pointer" onClick={() => setLightbox(p)}>
                    <Image src={p.photo_url} alt="Before" width={300} height={200}
                      className="rounded-lg border border-[#ebe7e4] object-cover w-full" style={{ height: 180 }} />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                      {formatDate(p.taken_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 font-semibold mb-1.5">After</p>
              <div className="space-y-2">
                {afterPhotos.slice(0, 3).map(p => (
                  <div key={p.id} className="relative cursor-pointer" onClick={() => setLightbox(p)}>
                    <Image src={p.photo_url} alt="After" width={300} height={200}
                      className="rounded-lg border border-[#ebe7e4] object-cover w-full" style={{ height: 180 }} />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                      {formatDate(p.taken_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid gallery */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#a09080]">
          <div className="w-12 h-12 rounded-2xl bg-[#f6f4f2] flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-[#c5b8b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </div>
          <span className="text-sm">등록된 사진이 없습니다</span>
          <p className="text-xs text-[#c5b8b0] mt-1">위 업로드 버튼으로 사진을 추가하세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 p-5">
          {photos.map(p => (
            <div key={p.id} className="group relative cursor-pointer" onClick={() => setLightbox(p)}>
              <Image
                src={p.photo_url}
                alt={`${p.patient_name} ${p.photo_type}`}
                width={200}
                height={150}
                className="rounded-lg border border-[#ebe7e4] object-cover w-full transition-shadow group-hover:shadow-md"
                style={{ height: 140 }}
              />
              <div className="absolute top-1.5 left-1.5 flex gap-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${PHOTO_TYPE_COLORS[p.photo_type] || 'bg-gray-100 text-gray-600'}`}>
                  {PHOTO_TYPE_LABELS[p.photo_type] || p.photo_type}
                </span>
              </div>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-end justify-between">
                <span className="text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                  {formatDate(p.taken_at)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
              {p.procedure_name && (
                <p className="text-[10px] text-[#a09080] mt-1 truncate">{p.procedure_name}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <Image
              src={lightbox.photo_url}
              alt={`${lightbox.patient_name} ${lightbox.photo_type}`}
              width={800}
              height={600}
              className="rounded-xl object-contain max-h-[80vh]"
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '80vh' }}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => handleDelete(lightbox.id)}
                title="삭제"
                className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setLightbox(null)}
                title="닫기"
                className="w-8 h-8 bg-white/90 text-[#6d4e42] rounded-full flex items-center justify-center hover:bg-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-xl">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-semibold ${PHOTO_TYPE_COLORS[lightbox.photo_type] || 'bg-gray-100 text-gray-600'}`}>
                  {PHOTO_TYPE_LABELS[lightbox.photo_type] || lightbox.photo_type}
                </span>
                <span className="text-white/80 text-xs">{formatDate(lightbox.taken_at)}</span>
                {lightbox.procedure_name && (
                  <span className="text-white/60 text-xs">| {lightbox.procedure_name}</span>
                )}
              </div>
              {lightbox.memo && <p className="text-white/70 text-xs mt-1">{lightbox.memo}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
