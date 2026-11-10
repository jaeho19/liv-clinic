'use client';

import { useEffect } from 'react';
import { captureUtm } from '@/lib/utm';

/**
 * 랜딩 시 URL의 utm_* 파라미터를 세션 첫 터치로 저장한다.
 * UTM이 없고 AI 답변 화면(ChatGPT·Perplexity 등)에서 넘어온 방문이면 리퍼러로 출처를 채운다.
 * 상담 폼 제출 시 readStoredUtm으로 읽어 consultation_requests.utm_*에 기록된다.
 * 렌더링 없음 · 실패해도 무해(스토리지 불가 환경은 조용히 무시).
 */
export default function UtmCapture() {
  useEffect(() => {
    try {
      captureUtm(window.location.search, window.sessionStorage, document.referrer);
    } catch {
      // sessionStorage 접근 자체가 차단된 환경 — 무시
    }
  }, []);
  return null;
}
