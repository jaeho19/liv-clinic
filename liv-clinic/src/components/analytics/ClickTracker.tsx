'use client';

import type { ReactNode } from 'react';
import { trackContentClick } from '@/lib/analytics-events';

/**
 * 서버 컴포넌트 안에서 링크 클릭을 계측하기 위한 최소 래퍼.
 * display: contents라 레이아웃에 영향이 없다.
 */
export default function ClickTracker({
  type,
  id,
  children,
}: {
  type: 'media' | 'review' | 'blog';
  id?: string;
  children: ReactNode;
}) {
  return (
    <span className="contents" onClickCapture={() => trackContentClick(type, id)}>
      {children}
    </span>
  );
}
