import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { SURVEY_LOCALES, isSurveyLocale } from '@/lib/survey/questions';
import { SURVEY_COPY, SURVEY_LANGUAGE_NAMES } from '@/lib/survey/copy';
import { BASE_URL } from '@/lib/seo';
import SurveyForm from './SurveyForm';

/**
 * /{locale}/survey — 내원객 만족도 설문(익명, 15문항).
 *
 * 시술 후 주의사항 카카오톡에 /ko/survey 주소를 함께 보낸다(대표원장 2026-11-18).
 * (viewer) 루트 레이아웃 아래라 헤더·푸터·팝업·채팅 위젯·분석 스크립트가 없다 — 설문에만 집중하게.
 * 문구는 lib/survey/copy.ts(ko·en·ja·zh·zh-TW). 그 밖의 로케일은 영어 화면으로 보낸다.
 * 검색에 잡히지 않게 noindex, 사이트맵에도 넣지 않는다.
 */

type Params = Promise<{ locale: string }>;

// 바탕 = 브랜드 주색(--color-primary)을 흰색에 12% 섞은 색. themeColor 는 같은 색의 근삿값.
const SURVEY_PAGE_CSS = [
  'body{background-color:color-mix(in srgb,var(--color-primary) 12%,#fff)!important;color:var(--color-mono)!important}',
  '@keyframes survey-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
  '.survey-rise{animation:survey-rise .55s cubic-bezier(.2,.7,.2,1) both}',
  '@media (prefers-reduced-motion:reduce){.survey-rise{animation:none}}',
].join('');

export function generateStaticParams() {
  return SURVEY_LOCALES.map((locale) => ({ locale }));
}

// (viewer) 레이아웃의 어두운 테마 색 대신 설문 바탕색
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f6f3f1',
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const surveyLocale = isSurveyLocale(locale) ? locale : 'en';
  const copy = SURVEY_COPY[surveyLocale];
  // 카카오톡 링크 미리보기(og:*) — 썸네일은 scripts/og/survey-og.html 로 만든 한국어 이미지 하나를 모든 언어가 쓴다
  // (카톡으로 보내는 주소는 짧은 /survey — 미들웨어가 이 화면으로 rewrite). 카카오는 주소별로 미리보기를 캐시한다 —
  // 바꾼 뒤에는 카카오 공유 디버거에서 초기화하거나 새 주소를 쓴다(questions.ts SURVEY_SHARE_PATH).
  // og:url 은 넣지 않는다: 넣으면 카카오·페이스북이 /survey 를 이미 캐시된 /ko/survey 로 묶어 옛 미리보기를 쓸 수 있다.
  const image = { url: `${BASE_URL}/images/og/survey-ko.jpg`, width: 1200, height: 630, alt: copy.og.title };
  return {
    title: copy.metaTitle,
    description: copy.og.description,
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: copy.brand,
      title: copy.og.title,
      description: copy.og.description,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: copy.og.title, description: copy.og.description, images: [image.url] },
  };
}

export default async function SurveyPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isSurveyLocale(locale)) redirect('/en/survey');
  setRequestLocale(locale);

  const languages = SURVEY_LOCALES.map((code) => ({
    locale: code,
    name: SURVEY_LANGUAGE_NAMES[code],
    href: `/${code}/survey`,
  }));

  return (
    <>
      {/* (viewer) 레이아웃 body 의 인라인 어두운 배경을 이 페이지에서만 덮는다(iOS 당김 영역까지 같은 색).
          카드가 하나씩 떠오르는 첫 화면 움직임 — 움직임 줄이기 설정이면 끈다. */}
      <style>{SURVEY_PAGE_CSS}</style>
      <SurveyForm locale={locale} copy={SURVEY_COPY[locale]} languages={languages} />
    </>
  );
}
