'use client';

import { useState, useCallback } from 'react';
import VoiceNoteInput from '@/components/admin/VoiceNoteInput';
import { mapVoiceToCase } from '@/types/voice-templates';
import type { TemplateType, TemplateData } from '@/types/voice-templates';
import {
  TREATMENT_TYPE_LABELS,
  TREATMENT_TYPE_ICONS,
  DOCTOR_OPTIONS,
  PROCEDURE_OPTIONS_BY_TYPE,
  DURATION_OPTIONS,
} from '@/types/admin';
import type { TreatmentType } from '@/types/admin';

type ViewState = 'select' | 'input' | 'success';

const TEMPLATE_OPTIONS: { type: TemplateType | 'free'; label: string; icon: string; description: string }[] = [
  { type: 'operation', label: '운영 현황', icon: '🏥', description: '환자 입실, 시술 배정, 소요시간 기록' },
  { type: 'consultation', label: '상담 기록', icon: '📋', description: '상담 내용을 정형화된 포맷으로 기록' },
  { type: 'quickNote', label: '퀵노트', icon: '📝', description: '빠르게 간단한 메모 기록' },
  { type: 'free', label: '자유 입력', icon: '✏️', description: '자유 형식으로 음성 메모' },
];

export default function VoiceNotePage() {
  const [viewState, setViewState] = useState<ViewState>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | 'free' | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSavedNote, setLastSavedNote] = useState<string | null>(null);

  // 운영현황 수동 확인/수정용
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [operationForm, setOperationForm] = useState({
    patientName: '',
    treatmentType: 'PROCEDURE' as TreatmentType,
    doctor: DOCTOR_OPTIONS[0] as string,
    procedure: PROCEDURE_OPTIONS_BY_TYPE['PROCEDURE'][0] as string,
    expectedDurationMin: 60,
    memo: '',
  });

  const handleTemplateSelect = (type: TemplateType | 'free') => {
    setSelectedTemplate(type);
    setVoiceText('');
    setShowManualEdit(false);
    setViewState('input');
  };

  const handleTemplateComplete = useCallback((data: TemplateData) => {
    if (selectedTemplate === 'operation') {
      const mapped = mapVoiceToCase(data);
      setOperationForm(f => ({
        ...f,
        patientName: mapped.patientName || f.patientName,
        treatmentType: mapped.treatmentType || f.treatmentType,
        procedure: mapped.procedure || f.procedure,
        doctor: mapped.doctor || f.doctor,
        expectedDurationMin: mapped.expectedDurationMin || f.expectedDurationMin,
        memo: mapped.memo || f.memo,
      }));
      setShowManualEdit(true);
    }
  }, [selectedTemplate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedTemplate === 'operation' && showManualEdit) {
        // 운영현황: operation_cases에 케이스 생성
        const res = await fetch('/api/admin/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName: operationForm.patientName.trim(),
            treatmentType: operationForm.treatmentType,
            status: 'WAITING',
            location: 'LOUNGE',
            doctor: operationForm.doctor,
            procedure: operationForm.procedure,
            expectedDurationMin: operationForm.expectedDurationMin,
            roomId: 'cons-1',
            memo: operationForm.memo.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error('저장 실패');
        setLastSavedNote(`${operationForm.patientName} - ${operationForm.procedure}`);
      } else {
        // 퀵노트/자유입력/상담: voice_notes API (또는 단순 저장)
        // Phase 4 DB가 아직 없으므로 localStorage에 임시 저장
        const notes = JSON.parse(localStorage.getItem('voice_notes') || '[]');
        notes.unshift({
          id: crypto.randomUUID(),
          templateType: selectedTemplate,
          rawText: voiceText,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('voice_notes', JSON.stringify(notes.slice(0, 50)));
        setLastSavedNote(voiceText.substring(0, 50) + (voiceText.length > 50 ? '...' : ''));
      }

      setViewState('success');
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setViewState('select');
    setSelectedTemplate(null);
    setVoiceText('');
    setShowManualEdit(false);
    setLastSavedNote(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        {viewState !== 'select' && (
          <button
            onClick={handleReset}
            className="p-2 text-[#6d4e42] hover:bg-[#f6f4f2] rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-[#6d4e42]">음성 노트</h2>
          <p className="text-xs text-[#8a8a8a]">음성으로 빠르게 기록하세요</p>
        </div>
      </div>

      {/* 템플릿 선택 */}
      {viewState === 'select' && (
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleTemplateSelect(opt.type)}
              className="p-4 bg-white border border-[#e5e5e5] rounded-xl text-left hover:border-[#b4988d] hover:shadow-md transition-all cursor-pointer group"
            >
              <span className="text-2xl block mb-2">{opt.icon}</span>
              <p className="font-medium text-sm text-[#6d4e42] group-hover:text-[#b4988d]">{opt.label}</p>
              <p className="text-[10px] text-[#8a8a8a] mt-1 leading-tight">{opt.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* 음성 입력 */}
      {viewState === 'input' && selectedTemplate && (
        <div>
          {!showManualEdit ? (
            <>
              <VoiceNoteInput
                value={voiceText}
                onChange={setVoiceText}
                templateType={selectedTemplate === 'free' ? undefined : selectedTemplate}
                mobileOptimized={true}
                onTemplateComplete={handleTemplateComplete}
                rows={5}
                placeholder="음성으로 메모를 입력하세요..."
              />

              {/* 자유입력/퀵노트/상담: 바로 저장 가능 */}
              {(selectedTemplate !== 'operation' || !showManualEdit) && voiceText.trim() && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 border border-[#e5e5e5] rounded-xl text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !voiceText.trim()}
                    className="flex-1 py-3 bg-[#b4988d] text-white rounded-xl text-sm font-medium hover:bg-[#a08878] disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* 운영현황: 수동 확인/수정 폼 */
            <div className="space-y-4">
              <div className="bg-[#faf8f7] rounded-xl p-4 border border-[#ebe7e4]">
                <p className="text-xs text-[#a09080] mb-3">음성 인식 결과를 확인하고 수정하세요</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#575756] mb-1">환자명 *</label>
                    <input
                      type="text"
                      value={operationForm.patientName}
                      onChange={(e) => setOperationForm(f => ({ ...f, patientName: e.target.value }))}
                      className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b4988d]/30 focus:border-[#b4988d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#575756] mb-1">유형</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['CONSULT', 'SKINCARE', 'ANESTHESIA', 'PROCEDURE'] as TreatmentType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOperationForm(f => ({ ...f, treatmentType: type }))}
                          className={`py-2 rounded-lg text-xs font-medium border cursor-pointer ${
                            operationForm.treatmentType === type
                              ? 'border-[#b4988d] bg-[#b4988d]/10 text-[#6d4e42]'
                              : 'border-[#e5e5e5] text-[#8a8a8a]'
                          }`}
                        >
                          {TREATMENT_TYPE_ICONS[type]} {TREATMENT_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#575756] mb-1">시술</label>
                      <select
                        value={operationForm.procedure}
                        onChange={(e) => setOperationForm(f => ({ ...f, procedure: e.target.value }))}
                        className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-sm"
                      >
                        {PROCEDURE_OPTIONS_BY_TYPE[operationForm.treatmentType].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#575756] mb-1">소요(분)</label>
                      <select
                        value={operationForm.expectedDurationMin}
                        onChange={(e) => setOperationForm(f => ({ ...f, expectedDurationMin: parseInt(e.target.value) }))}
                        className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-sm"
                      >
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}분</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#575756] mb-1">담당의</label>
                    <select
                      value={operationForm.doctor}
                      onChange={(e) => setOperationForm(f => ({ ...f, doctor: e.target.value }))}
                      className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-sm"
                    >
                      {DOCTOR_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#575756] mb-1">메모</label>
                    <textarea
                      value={operationForm.memo}
                      onChange={(e) => setOperationForm(f => ({ ...f, memo: e.target.value }))}
                      rows={2}
                      className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2.5 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowManualEdit(false)}
                  className="flex-1 py-3 border border-[#e5e5e5] rounded-xl text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] cursor-pointer"
                >
                  다시 입력
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !operationForm.patientName.trim()}
                  className="flex-1 py-3 bg-[#b4988d] text-white rounded-xl text-sm font-medium hover:bg-[#a08878] disabled:opacity-50 cursor-pointer"
                >
                  {saving ? '저장 중...' : '케이스 추가'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 성공 */}
      {viewState === 'success' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium text-[#6d4e42] mb-1">저장 완료</p>
          {lastSavedNote && (
            <p className="text-xs text-[#8a8a8a] mb-6">{lastSavedNote}</p>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-[#b4988d] text-white rounded-xl text-sm font-medium hover:bg-[#a08878] cursor-pointer"
          >
            새 노트 작성
          </button>
        </div>
      )}
    </div>
  );
}
