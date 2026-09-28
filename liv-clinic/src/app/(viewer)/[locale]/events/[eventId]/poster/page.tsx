import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { EventRow } from '@/types/admin';
import { getSiteName } from '@/lib/seo';
import { pickLocalized } from '@/lib/i18nFallback';
import { getPublishedEventRow } from '@/lib/eventsServer';
import PosterViewerClose from './PosterViewerClose';

/**
 * /{locale}/events/{slug}/poster — 포스터 「크게 보기」 전용 페이지.
 *
 * 상세 갤러리 없이 포스터 1장에 모든 내용이 들어 있는 이벤트(예: 2026-10 프로모션, 1122×1402)는
 * 상세 페이지의 2단 레이아웃(약 600px)으로는 글자가 작다. 상세 페이지의 포스터 링크가 이 페이지를
 * 새 탭으로 열고, 여기서는 원본 이미지를 화면 폭까지 원본 크기 그대로 보여준다(next/image 축소 없음).
 * 모바일은 뷰포트 핀치 확대(레이아웃 maximum-scale=5)로 더 키운다.
 *
 * (viewer) 루트 레이아웃 아래라 헤더·푸터·팝업·채팅 위젯이 없다. 얇은 페이지라 색인하지 않는다.
 */

// 이벤트 상세와 같은 짧은 ISR — 관리자가 포스터를 바꾸면 곧 반영된다
export const revalidate = 60;

type Params = Promise<{ locale: string; eventId: string }>;

function posterOf(event: EventRow, locale: string): string {
  return (
    pickLocalized(
      {
        ko: event.poster_image,
        en: event.poster_image_en,
        ja: event.poster_image_ja,
        zh: event.poster_image_zh,
      },
      locale as Locale,
    ) || ''
  );
}

function titleOf(event: EventRow, locale: string): string {
  return (
    pickLocalized(
      { ko: event.title_ko, en: event.title_en, ja: event.title_ja, zh: event.title_zh },
      locale as Locale,
    ) || event.title_ko
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, eventId } = await params;
  const event = await getPublishedEventRow(eventId);
  const siteName = getSiteName(locale);

  return {
    title: event ? `${titleOf(event, locale)} | ${siteName}` : siteName,
    // 이미지 한 장뿐인 보조 화면 — 이벤트 상세 페이지와 중복 색인되지 않게 한다
    robots: { index: false, follow: true },
  };
}

export default async function EventPosterPage({ params }: { params: Params }) {
  const { locale, eventId } = await params;
  const event = await getPublishedEventRow(eventId);
  const poster = event ? posterOf(event, locale) : '';

  if (!event || !poster || poster.includes('placeholder')) {
    notFound();
  }

  const title = titleOf(event, locale);
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 상단 바 — 병원명·이벤트 제목·닫기. 새 탭에서 열렸으면 닫기가 탭을 닫고, 아니면 이벤트 페이지로 돌아간다 */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-black/70 px-4 pb-2.5 backdrop-blur-sm"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.625rem)' }}
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{getSiteName(locale)}</p>
          <h1 className="truncate text-sm font-medium">{title}</h1>
        </div>
        <PosterViewerClose label={tCommon('close')} fallbackHref={`/${locale}/events/${eventId}`} />
      </header>

      {/* 원본 이미지를 원본 크기(최대 화면 폭)로 — 세로가 길면 페이지가 스크롤된다 */}
      <main className="flex flex-1 justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- 확대해 읽는 화면이라 원본 해상도가 필요하다 */}
        <img
          src={poster}
          alt={title}
          className="block h-auto max-w-full self-start"
          decoding="async"
          fetchPriority="high"
          draggable={false}
        />
      </main>
    </div>
  );
}
