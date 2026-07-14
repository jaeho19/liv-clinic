'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { MediaType } from '@/lib/data/mediaNewsData';

interface MediaNewsCardMediaProps {
  /** 해상된 썸네일 경로. 없으면(undefined/null) 브랜드 폴백 렌더 */
  src?: string | null;
  /** 의미 있는 대체텍스트 (= item.title) */
  alt: string;
  /** 폴백 색조 구분 (press=브라운 / news=로즈) */
  type: MediaType;
  /** 폴백에 표기할 라벨 */
  badge: string;
  /** 홈 1행만 true → LCP 대상 최소화 */
  priority?: boolean;
  /** 얼굴 검출 기반 초점(object-position). 없으면 중앙 크롭 */
  imagePosition?: string;
}

// Design Ref: §4.1 — 16:9 미디어 슬롯(이미지 | 폴백), 카드 3개 wrapper 공용
export default function MediaNewsCardMedia({
  src,
  alt,
  type,
  badge,
  priority = false,
  imagePosition,
}: MediaNewsCardMediaProps) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-background">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <Placeholder type={type} badge={badge} />
      )}
    </div>
  );
}

// 이미지가 없을 때의 브랜드 톤 폴백 (이미지 자산 0 · 순수 CSS)
function Placeholder({ type, badge }: { type: MediaType; badge: string }) {
  const t = useTranslations('mediaNews');
  const grad =
    type === 'press'
      ? 'from-secondary to-secondary/60' // 다크 브라운 톤
      : 'from-primary to-primary/55'; // 더스티 로즈 톤
  return (
    <div
      role="img"
      aria-label={t('thumbnailAlt', { badge })}
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${grad}`}
    >
      <span className="font-serif text-4xl tracking-[0.2em] text-white/95">LIV</span>
      <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/80">
        {badge}
      </span>
    </div>
  );
}
