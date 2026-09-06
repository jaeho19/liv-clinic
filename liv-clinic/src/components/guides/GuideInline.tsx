import Link from 'next/link';
import type { ReactNode } from 'react';

// **굵게**, [텍스트](url), [검수 필요…] 세 토큰만 인라인으로 처리한다.
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\[검수 필요[^\]]*\])/g;

export default function GuideInline({
  text,
  locale,
  showMarkers,
}: {
  text: string;
  locale: string;
  /** 초안에서만 [검수 필요] 표식을 눈에 띄게 보여준다. 게시본은 빌드가 표식을 막는다. */
  showMarkers: boolean;
}) {
  const parts = text.split(TOKEN).filter((p) => p !== '');
  return (
    <>
      {parts.map((part, i): ReactNode => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-secondary">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('[검수 필요')) {
          return showMarkers ? (
            <mark key={i} className="rounded bg-amber-200 px-1 text-amber-900">
              {part}
            </mark>
          ) : null;
        }
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link;
          if (/^https?:\/\//.test(href)) {
            return (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-secondary">
                {label}
              </a>
            );
          }
          return (
            <Link key={i} href={`/${locale}${href}`} className="text-primary underline underline-offset-2 hover:text-secondary">
              {label}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
