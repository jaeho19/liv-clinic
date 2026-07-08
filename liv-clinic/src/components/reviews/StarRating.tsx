'use client';

import { useTranslations } from 'next-intl';

type StarSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<StarSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

/** 단일 별 아이콘 (채움/비움). currentColor로 색을 상속한다. */
function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.4}
      aria-hidden="true"
    >
      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.42 4.36a1 1 0 0 0 .95.69h4.58c.97 0 1.37 1.24.59 1.81l-3.71 2.7a1 1 0 0 0-.36 1.12l1.42 4.36c.3.92-.75 1.69-1.54 1.12l-3.71-2.7a1 1 0 0 0-1.18 0l-3.71 2.7c-.79.57-1.84-.2-1.54-1.12l1.42-4.36a1 1 0 0 0-.36-1.12l-3.71-2.7c-.78-.57-.38-1.81.59-1.81h4.58a1 1 0 0 0 .95-.69L9.05 2.93Z" />
    </svg>
  );
}

interface StarRatingProps {
  /** 표시할 평점 (1~5, 소수 허용 — 반올림하여 별을 채운다). */
  rating: number;
  size?: StarSize;
  className?: string;
}

/** 읽기 전용 별점 표시. 스크린리더에는 "N out of 5 stars"로 읽힌다. */
export default function StarRating({ rating, size = 'md', className }: StarRatingProps) {
  const t = useTranslations('reviews');
  const rounded = Math.round(rating);
  const sizeClass = SIZE_CLASS[size];

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className ?? ''}`}
      role="img"
      aria-label={t('ratingAria', { rating })}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          filled={i <= rounded}
          className={`${sizeClass} ${i <= rounded ? 'text-primary' : 'text-border'}`}
        />
      ))}
    </span>
  );
}

interface StarRatingInputProps {
  /** 현재 선택 값 (0 = 미선택). */
  value: number;
  onChange: (rating: number) => void;
  size?: StarSize;
}

/** 인터랙티브 별점 입력. 각 별은 44px 이상 터치 타깃의 라디오 버튼이다. */
export function StarRatingInput({ value, onChange, size = 'lg' }: StarRatingInputProps) {
  const t = useTranslations('reviews');
  const sizeClass = SIZE_CLASS[size];

  return (
    <div role="radiogroup" className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={t('ratingAria', { rating: i })}
          onClick={() => onChange(i)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Star
            filled={i <= value}
            className={`${sizeClass} ${i <= value ? 'text-primary' : 'text-border hover:text-primary/50'}`}
          />
        </button>
      ))}
    </div>
  );
}
