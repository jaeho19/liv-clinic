'use client';

import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';

// ─── 타입 ──────────────────────────────
interface CsvColumnMapping {
  date: string;
  patientName: string;
  procedureName: string;
  category?: string;
  doctor: string;
  priceKrw: string;
  discountKrw?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; field: string; message: string }[];
  batchId: string;
}

type UploadStep = 'select' | 'mapping' | 'preview' | 'uploading' | 'result';

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const REQUIRED_FIELDS: { key: keyof CsvColumnMapping; label: string; required: boolean }[] = [
  { key: 'date', label: '날짜', required: true },
  { key: 'patientName', label: '환자명', required: true },
  { key: 'procedureName', label: '시술명', required: true },
  { key: 'doctor', label: '담당의', required: true },
  { key: 'priceKrw', label: '금액', required: true },
  { key: 'discountKrw', label: '할인', required: false },
  { key: 'paymentMethod', label: '결제수단', required: false },
  { key: 'paymentStatus', label: '결제상태', required: false },
];

function formatMoney(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export default function CsvUploadModal({ open, onClose, onComplete }: Props) {
  const [step, setStep] = useState<UploadStep>('select');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<CsvColumnMapping>({
    date: '', patientName: '', procedureName: '', doctor: '', priceKrw: '',
  });
  const [saveMappingAsDefault, setSaveMappingAsDefault] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved mapping
  const loadSavedMapping = useCallback(async (columns: string[]) => {
    try {
      const res = await fetch('/api/admin/revenue/mapping');
      if (!res.ok) return;
      const data = await res.json();
      if (data.mapping && typeof data.mapping === 'object') {
        const saved = data.mapping as Record<string, string>;
        const newMappings: Record<string, string> = {};
        for (const field of REQUIRED_FIELDS) {
          const savedCol = saved[field.key];
          if (savedCol && columns.includes(savedCol)) {
            newMappings[field.key] = savedCol;
          }
        }
        setMappings((prev) => ({ ...prev, ...newMappings }));
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-detect column mapping by name similarity
  const autoDetectMappings = useCallback((columns: string[]) => {
    const detection: Partial<CsvColumnMapping> = {};
    const lowerCols = columns.map((c) => c.toLowerCase().trim());

    const patterns: { key: keyof CsvColumnMapping; matches: string[] }[] = [
      { key: 'date', matches: ['날짜', 'date', '일자', '시술일', '접수일'] },
      { key: 'patientName', matches: ['환자명', '환자', '이름', 'name', 'patient'] },
      { key: 'procedureName', matches: ['시술명', '시술', 'procedure', '항목'] },
      { key: 'doctor', matches: ['담당의', '의사', 'doctor', '시술자', '원장'] },
      { key: 'priceKrw', matches: ['금액', '가격', 'price', '결제금액', '매출'] },
      { key: 'discountKrw', matches: ['할인', 'discount', '할인액'] },
      { key: 'paymentMethod', matches: ['결제수단', '결제방법', 'payment', '수단'] },
      { key: 'paymentStatus', matches: ['결제상태', '상태', 'status'] },
    ];

    for (const { key, matches } of patterns) {
      const idx = lowerCols.findIndex((c) => matches.some((m) => c.includes(m)));
      if (idx !== -1) detection[key] = columns[idx];
    }

    return detection;
  }, []);

  // File handling
  const handleFile = useCallback((file: File) => {
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError('CSV 파싱 오류: ' + results.errors[0].message);
          return;
        }
        const rows = results.data as Record<string, string>[];
        const columns = results.meta.fields || [];

        if (columns.length === 0 || rows.length === 0) {
          setError('CSV 파일이 비어있거나 헤더가 없습니다.');
          return;
        }

        setParsedRows(rows);
        setCsvColumns(columns);

        // Auto-detect then load saved mappings (saved overrides auto)
        const detected = autoDetectMappings(columns);
        setMappings((prev) => ({ ...prev, ...detected }));
        loadSavedMapping(columns);

        setStep('mapping');
      },
      error: () => {
        setError('CSV 파일을 읽을 수 없습니다.');
      },
    });
  }, [autoDetectMappings, loadSavedMapping]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFile(file);
    } else {
      setError('CSV 파일만 업로드 가능합니다.');
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Mapping validation
  const requiredMapped = REQUIRED_FIELDS
    .filter((f) => f.required)
    .every((f) => mappings[f.key]);

  // Preview data (first 5 rows)
  const previewRows = parsedRows.slice(0, 5).map((row) => ({
    date: row[mappings.date] || '-',
    patientName: row[mappings.patientName] || '-',
    procedureName: row[mappings.procedureName] || '-',
    doctor: row[mappings.doctor] || '-',
    priceKrw: row[mappings.priceKrw] || '-',
    discountKrw: mappings.discountKrw ? (row[mappings.discountKrw] || '-') : '-',
    paymentStatus: mappings.paymentStatus ? (row[mappings.paymentStatus] || '-') : '-',
  }));

  // Total price estimate
  const totalEstimate = parsedRows.reduce((sum, row) => {
    const raw = row[mappings.priceKrw] || '0';
    const cleaned = raw.replace(/[,\s원₩\\]/g, '');
    const num = Number(cleaned);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  // Upload
  const handleUpload = async () => {
    setStep('uploading');
    try {
      // Save mapping if checked
      if (saveMappingAsDefault) {
        await fetch('/api/admin/revenue/mapping', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mapping: mappings }),
        });
      }

      // Import
      const res = await fetch('/api/admin/revenue/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows, mappings, skipDuplicates }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || '업로드 실패');
        setStep('preview');
        return;
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep('result');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('select');
    setParsedRows([]);
    setCsvColumns([]);
    setMappings({ date: '', patientName: '', procedureName: '', doctor: '', priceKrw: '' });
    setResult(null);
    setError('');
    onClose();
  };

  const handleDone = () => {
    handleClose();
    onComplete();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
          <h2 className="text-lg font-bold text-[#6d4e42]">CSV 매출 데이터 업로드</h2>
          <button onClick={handleClose} className="text-[#8a8a8a] hover:text-[#575756] text-xl cursor-pointer">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step indicators */}
          <div className="flex items-center gap-2 text-xs">
            {['파일 선택', '컬럼 매핑', '미리보기', '결과'].map((label, i) => {
              const stepOrder: UploadStep[] = ['select', 'mapping', 'preview', 'result'];
              const currentIdx = stepOrder.indexOf(step === 'uploading' ? 'preview' : step);
              const isActive = i <= currentIdx;
              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-6 h-px ${isActive ? 'bg-[#b4988d]' : 'bg-[#e5e5e5]'}`} />}
                  <span className={`px-2 py-1 rounded-full ${isActive ? 'bg-[#b4988d] text-white' : 'bg-[#f6f6f6] text-[#8a8a8a]'}`}>
                    {i + 1}. {label}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          {/* Step 1: File Select */}
          {step === 'select' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e5e5e5] rounded-xl p-12 text-center cursor-pointer hover:border-[#b4988d] hover:bg-[#faf8f7] transition-colors"
            >
              <div className="text-4xl mb-3">📁</div>
              <p className="text-[#575756] font-medium">CSV 파일을 드래그하거나 클릭하세요</p>
              <p className="text-xs text-[#8a8a8a] mt-2">UTF-8 / EUC-KR 자동 감지 지원</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-[#8a8a8a]">
                CSV 파일의 컬럼을 LIV 필드에 매핑해주세요. (<span className="text-red-500">*</span> 필수)
              </p>
              <p className="text-xs text-[#8a8a8a]">감지된 컬럼: {csvColumns.length}개 | 총 {parsedRows.length}행</p>

              <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f6f6] border-b border-[#e5e5e5]">
                      <th className="text-left px-4 py-2 font-medium text-[#575756]">LIV 필드</th>
                      <th className="text-left px-4 py-2 font-medium text-[#575756]">CSV 컬럼</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REQUIRED_FIELDS.map((field) => (
                      <tr key={field.key} className="border-b border-[#e5e5e5]">
                        <td className="px-4 py-2 text-[#575756]">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={mappings[field.key] || ''}
                            onChange={(e) => setMappings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full px-2 py-1.5 border border-[#e5e5e5] rounded text-sm"
                          >
                            <option value="">-- 선택 --</option>
                            {csvColumns.map((col) => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#575756]">
                <input
                  type="checkbox"
                  checked={saveMappingAsDefault}
                  onChange={(e) => setSaveMappingAsDefault(e.target.checked)}
                  className="rounded"
                />
                이 매핑을 기본값으로 저장
              </label>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setStep('select'); setParsedRows([]); setCsvColumns([]); }}
                  className="px-4 py-2 text-sm text-[#8a8a8a] hover:text-[#575756] cursor-pointer"
                >
                  뒤로
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={!requiredMapped}
                  className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08878] disabled:opacity-50 cursor-pointer"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <p className="text-sm text-[#8a8a8a]">미리보기 (처음 5행)</p>

              <div className="border border-[#e5e5e5] rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#f6f6f6] border-b border-[#e5e5e5]">
                      <th className="px-3 py-2 text-left">날짜</th>
                      <th className="px-3 py-2 text-left">환자명</th>
                      <th className="px-3 py-2 text-left">시술명</th>
                      <th className="px-3 py-2 text-left">담당의</th>
                      <th className="px-3 py-2 text-right">금액</th>
                      <th className="px-3 py-2 text-right">할인</th>
                      <th className="px-3 py-2 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-[#e5e5e5]">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2 font-medium">{row.patientName}</td>
                        <td className="px-3 py-2">{row.procedureName}</td>
                        <td className="px-3 py-2">{row.doctor}</td>
                        <td className="px-3 py-2 text-right">{row.priceKrw}</td>
                        <td className="px-3 py-2 text-right">{row.discountKrw}</td>
                        <td className="px-3 py-2 text-center">{row.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8a8a8a]">
                  총 <strong className="text-[#6d4e42]">{parsedRows.length}행</strong> |
                  예상 매출 합계: <strong className="text-[#6d4e42]">{formatMoney(totalEstimate)}</strong>
                </span>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#575756]">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded"
                />
                중복 건 자동 스킵 (동일 날짜+환자명+시술명)
              </label>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-sm text-[#8a8a8a] hover:text-[#575756] cursor-pointer"
                >
                  뒤로
                </button>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08878] cursor-pointer"
                >
                  업로드 확인 ({parsedRows.length}건)
                </button>
              </div>
            </div>
          )}

          {/* Uploading */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center py-12">
              <div className="w-10 h-10 border-2 border-[#b4988d] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#575756]">{parsedRows.length}건 업로드 중...</p>
              <p className="text-xs text-[#8a8a8a] mt-1">잠시만 기다려주세요</p>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${result.imported > 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
                <p className="font-medium text-lg">
                  {result.imported > 0 ? '✅ 업로드 완료' : '⚠️ 업로드 결과'}
                </p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>성공: <strong className="text-green-700">{result.imported}건</strong></p>
                  {result.skipped > 0 && <p>중복 스킵: <strong className="text-amber-600">{result.skipped}건</strong></p>}
                  {result.errors.length > 0 && <p>오류: <strong className="text-red-600">{result.errors.length}건</strong></p>}
                  <p className="text-xs text-[#8a8a8a]">배치 ID: {result.batchId}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-600 mb-2">오류 상세 (최대 10건)</p>
                  <div className="space-y-1 text-xs text-red-500 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <p key={i}>행 {err.row}: [{err.field}] {err.message}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleDone}
                  className="px-4 py-2 text-sm bg-[#b4988d] text-white rounded-lg hover:bg-[#a08878] cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
