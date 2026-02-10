'use client';

import { useState, useCallback } from 'react';
import VoiceNoteInput from '@/components/admin/VoiceNoteInput';
import HybridForm from '@/components/admin/hybrid-form/HybridForm';
import FormTemplateSelector from '@/components/admin/hybrid-form/FormTemplateSelector';
import type { SmartFormTemplate, HybridFormData } from '@/types/smart-forms';
import { hybridFormDataToText, getSmartFormById } from '@/types/smart-forms';
import { parseRoomId, parseDuration, matchProcedure, matchDoctor, inferTreatmentType } from '@/types/voice-templates';

type ViewState = 'select' | 'hybrid' | 'free' | 'success';

export default function VoiceNotePage() {
  const [viewState, setViewState] = useState<ViewState>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<SmartFormTemplate | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSavedNote, setLastSavedNote] = useState<string | null>(null);

  const handleTemplateSelect = (template: SmartFormTemplate) => {
    setSelectedTemplate(template);
    setViewState('hybrid');
  };

  const handleFreeInput = () => {
    setVoiceText('');
    setViewState('free');
  };

  const handleHybridSubmit = useCallback(async (data: HybridFormData, textOutput: string) => {
    setSaving(true);
    try {
      if (selectedTemplate?.category === 'operation') {
        // 운영현황: operation_cases에 케이스 생성
        const res = await fetch('/api/admin/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName: (data.patientName || '').trim(),
            treatmentType: inferTreatmentType(data.procedure),
            status: 'WAITING',
            location: 'LOUNGE',
            doctor: matchDoctor(data.doctor),
            procedure: matchProcedure(data.procedure),
            expectedDurationMin: parseDuration(data.estimatedDuration),
            roomId: parseRoomId(data.room),
            memo: (data.memo || '').trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error('저장 실패');
        setLastSavedNote(`${data.patientName} - ${data.procedure || '시술 배정'}`);
      } else {
        // 상담/퀵노트: localStorage 임시 저장
        const notes = JSON.parse(localStorage.getItem('voice_notes') || '[]');
        notes.unshift({
          id: crypto.randomUUID(),
          templateId: selectedTemplate?.id,
          templateName: selectedTemplate?.name,
          structuredData: data,
          rawText: textOutput,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('voice_notes', JSON.stringify(notes.slice(0, 50)));
        setLastSavedNote(textOutput.substring(0, 60) + (textOutput.length > 60 ? '...' : ''));
      }
      setViewState('success');
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [selectedTemplate]);

  const handleFreeSave = async () => {
    setSaving(true);
    try {
      const notes = JSON.parse(localStorage.getItem('voice_notes') || '[]');
      notes.unshift({
        id: crypto.randomUUID(),
        templateId: 'free',
        templateName: '자유 입력',
        rawText: voiceText,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('voice_notes', JSON.stringify(notes.slice(0, 50)));
      setLastSavedNote(voiceText.substring(0, 60) + (voiceText.length > 60 ? '...' : ''));
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
    setLastSavedNote(null);
    setSaving(false);
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
          <p className="text-xs text-[#8a8a8a]">
            {viewState === 'select'
              ? '양식을 선택하고 음성으로 빠르게 기록하세요'
              : viewState === 'free'
              ? '자유롭게 음성으로 입력하세요'
              : viewState === 'hybrid' && selectedTemplate
              ? `${selectedTemplate.icon} ${selectedTemplate.name}`
              : '저장 완료'}
          </p>
        </div>
      </div>

      {/* 양식 선택 */}
      {viewState === 'select' && (
        <FormTemplateSelector
          onSelect={handleTemplateSelect}
          onFreeInput={handleFreeInput}
        />
      )}

      {/* 하이브리드 폼 */}
      {viewState === 'hybrid' && selectedTemplate && (
        <HybridForm
          template={selectedTemplate}
          onSubmit={handleHybridSubmit}
          onCancel={handleReset}
          saving={saving}
        />
      )}

      {/* 자유 입력 */}
      {viewState === 'free' && (
        <div>
          <VoiceNoteInput
            value={voiceText}
            onChange={setVoiceText}
            mobileOptimized
            rows={6}
            placeholder="음성으로 자유롭게 메모를 입력하세요..."
          />

          {voiceText.trim() && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 border border-[#e5e5e5] rounded-xl text-sm text-[#8a8a8a] hover:bg-[#f6f6f6] cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleFreeSave}
                disabled={saving || !voiceText.trim()}
                className="flex-1 py-3 bg-[#b4988d] text-white rounded-xl text-sm font-medium hover:bg-[#a08878] disabled:opacity-50 cursor-pointer"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
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
            <p className="text-xs text-[#8a8a8a] mb-6 whitespace-pre-wrap">{lastSavedNote}</p>
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
