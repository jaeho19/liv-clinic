'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  CONSULT_ONLY,
  GIFT_CODE_VALID_DAYS,
  SURVEY_PARTS,
  SURVEY_VERSION,
  TREATMENT_IDS,
  isPartShown,
  type RatingQuestionId,
  type SkippablePartId,
  type SurveyLocale,
  type SurveyPart,
  type TreatmentId,
} from '@/lib/survey/questions';
import { fillCopy, type SurveyCopy } from '@/lib/survey/copy';
import { visibleParts } from '@/lib/survey/schema';
import { formatGiftCode } from '@/lib/survey/giftCode';

/**
 * 만족도 설문 화면. 한 페이지에 15문항을 카드로 나눠 보여 주고, 제출하면 답례품 번호 「티켓」을 띄운다.
 * 같은 휴대폰에서 다시 열면 이미 응답한 화면과 받은 번호를 다시 보여 준다(localStorage — 막혀 있어도 설문은 된다).
 */

const STORAGE_KEY = `liv-survey-v${SURVEY_VERSION}`;
const ERROR_COLOR = '#b4483c';

interface Language {
  locale: SurveyLocale;
  name: string;
  href: string;
}

interface Props {
  locale: SurveyLocale;
  copy: SurveyCopy;
  languages: Language[];
}

type Phase = 'form' | 'submitting' | 'done' | 'already';

interface Stored {
  code: string | null;
}

function readStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    return { code: typeof parsed?.code === 'string' ? parsed.code : null };
  } catch {
    return null;
  }
}

function writeStored(value: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, at: new Date().toISOString() }));
  } catch {
    // 사생활 보호 모드 등 — 저장하지 못해도 설문은 끝났다
  }
}

function rise(index: number): CSSProperties {
  return { animationDelay: `${Math.min(index, 8) * 60}ms` };
}

export default function SurveyForm({ locale, copy, languages }: Props) {
  const [phase, setPhase] = useState<Phase>('form');
  const [code, setCode] = useState<string | null>(null);
  const [firstVisit, setFirstVisit] = useState<boolean | null>(null);
  const [treatments, setTreatments] = useState<TreatmentId[]>([]);
  const [treatmentOther, setTreatmentOther] = useState('');
  const [ratings, setRatings] = useState<Partial<Record<RatingQuestionId, number>>>({});
  const [skipped, setSkipped] = useState<SkippablePartId[]>([]);
  const [recommend, setRecommend] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setCode(stored.code);
      setPhase('already');
    }
  }, []);

  const shownParts = useMemo(
    () => SURVEY_PARTS.filter((part) => isPartShown(part, treatments)),
    [treatments],
  );
  const answerableParts = useMemo(() => visibleParts(treatments, skipped), [treatments, skipped]);

  const total = 2 + answerableParts.reduce((sum, part) => sum + part.questions.length, 0) + 1;
  const answered =
    (firstVisit !== null ? 1 : 0) +
    (treatments.length > 0 ? 1 : 0) +
    answerableParts.reduce(
      (sum, part) => sum + part.questions.filter((q) => typeof ratings[q] === 'number').length,
      0,
    ) +
    (recommend !== null ? 1 : 0);

  const missing = {
    first_visit: firstVisit === null,
    treatments: treatments.length === 0,
    recommend: recommend === null,
  };
  const missingCount = Object.values(missing).filter(Boolean).length;

  const toggleTreatment = (id: TreatmentId) => {
    setTreatments((current) => {
      if (current.includes(id)) return current.filter((t) => t !== id);
      if (id === CONSULT_ONLY) return [CONSULT_ONLY];
      return TREATMENT_IDS.filter((t) => t !== CONSULT_ONLY && (t === id || current.includes(t)));
    });
  };

  const toggleSkip = (id: SkippablePartId) => {
    setSkipped((current) => (current.includes(id) ? current.filter((p) => p !== id) : [...current, id]));
  };

  const setRating = (id: RatingQuestionId, value: number) => {
    setRatings((current) => ({ ...current, [id]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNetworkError(false);
    if (missingCount > 0) {
      setShowErrors(true);
      const firstMissing = (['first_visit', 'treatments', 'recommend'] as const).find((key) => missing[key]);
      document.getElementById(`q-${firstMissing}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setPhase('submitting');
    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          version: SURVEY_VERSION,
          first_visit: firstVisit,
          treatments,
          treatment_other: treatmentOther,
          ratings,
          skipped_parts: skipped,
          recommend,
          comment,
          website,
        }),
      });
      if (!response.ok) throw new Error(`survey submit ${response.status}`);
      const data = (await response.json()) as { code?: string | null };
      const issued = typeof data.code === 'string' ? data.code : null;
      writeStored({ code: issued });
      setCode(issued);
      setPhase('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      setNetworkError(true);
      setPhase('form');
    }
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* 머리 쪽에 아주 옅은 로즈 빛 — 종이 위에 놓인 안내문 느낌 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            'radial-gradient(120% 70% at 85% 0%, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, transparent 65%)',
        }}
      />

      {/* globals.css 의 body {word-break: keep-all} 은 띄어쓰기 없는 일본어·중국어를 줄바꿈하지 못하게 한다 — 한국어만 keep-all */}
      <main
        className={`relative mx-auto w-full max-w-[560px] px-4 pb-20 ${locale === 'ko' ? 'break-keep' : 'break-normal'}`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
      >
        <header className="flex items-center justify-between gap-3">
          <Image src="/images/logo.png" alt={copy.brand} width={206} height={48} priority className="h-6 w-auto" />
          <span className="font-serif text-[15px] italic tracking-wide text-primary">Patient Feedback</span>
        </header>

        <nav aria-label="Language" className="mt-4 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-1">
            {languages.map((language) => {
              const active = language.locale === locale;
              return (
                <li key={language.locale}>
                  <a
                    href={language.href}
                    hrefLang={language.locale}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-full px-2.5 py-1.5 text-[12.5px] transition-colors ${
                      active
                        ? 'bg-secondary text-white'
                        : 'border border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] text-secondary hover:bg-white'
                    }`}
                  >
                    {language.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {phase === 'done' || phase === 'already' ? (
          <Thanks copy={copy} code={code} already={phase === 'already'} />
        ) : (
          <>
            <section className="survey-rise mt-8" style={rise(0)}>
              <h1 className="text-[32px] font-bold leading-tight tracking-[-0.01em] text-secondary">{copy.title}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-mono">{copy.intro}</p>
              <p className="mt-3 text-[13px] text-mono-light">{copy.meta}</p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-[13px] font-semibold text-secondary shadow-[0_1px_2px_rgba(109,78,66,0.08)]">
                <GiftIcon />
                {copy.giftLine}
              </p>
            </section>

            {/* 진행 막대 — 스크롤해도 위에 붙어 있다 */}
            <div className="sticky top-0 z-20 -mx-4 mt-6 px-4 py-2.5 backdrop-blur-md [background:color-mix(in_srgb,var(--color-background)_70%,transparent)]">
              <div className="flex items-center gap-3">
                <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.round((answered / total) * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-mono-light">
                  {fillCopy(copy.progress, { answered, total })}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-4">
              {/* 허니팟 — 사람에게는 보이지 않는 칸 */}
              <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>

              <Card index={1} title={copy.sections.start} style={rise(1)}>
                <Question
                  id="q-first_visit"
                  label={copy.firstVisit.question}
                  badge={copy.required}
                  error={showErrors && missing.first_visit ? copy.requiredError : null}
                >
                  <div className="grid grid-cols-2 gap-2" role="radiogroup">
                    {[
                      { value: true, label: copy.firstVisit.yes },
                      { value: false, label: copy.firstVisit.no },
                    ].map((option) => (
                      <ChoiceButton
                        key={String(option.value)}
                        name="first_visit"
                        checked={firstVisit === option.value}
                        onChange={() => setFirstVisit(option.value)}
                        className="h-12 text-[15px]"
                      >
                        {option.label}
                      </ChoiceButton>
                    ))}
                  </div>
                </Question>

                <Question
                  id="q-treatments"
                  label={copy.treatments.question}
                  hint={copy.treatments.hint}
                  badge={copy.required}
                  error={showErrors && missing.treatments ? copy.requiredError : null}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {TREATMENT_IDS.map((id) => {
                      const item = copy.treatments.items[id];
                      const checked = treatments.includes(id);
                      return (
                        <label
                          key={id}
                          className={`relative flex min-h-[52px] cursor-pointer items-start gap-2.5 rounded-2xl border px-3 py-2.5 transition-colors ${
                            checked
                              ? 'border-secondary bg-[color-mix(in_srgb,var(--color-secondary)_6%,white)]'
                              : 'border-border bg-white hover:border-primary'
                          } ${id === 'lifting_device' ? 'col-span-2' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={checked}
                            onChange={() => toggleTreatment(id)}
                          />
                          <span
                            aria-hidden
                            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${
                              checked ? 'border-secondary bg-secondary text-white' : 'border-[#cfc6c2] bg-white'
                            }`}
                          >
                            {checked && <CheckIcon />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-semibold leading-snug text-[#3f3a38]">{item.label}</span>
                            {item.detail && (
                              <span className="mt-0.5 block text-[11.5px] leading-snug text-mono-light">{item.detail}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {treatments.includes('other') && (
                    <input
                      type="text"
                      value={treatmentOther}
                      maxLength={100}
                      onChange={(e) => setTreatmentOther(e.target.value)}
                      placeholder={copy.treatments.otherPlaceholder}
                      aria-label={copy.treatments.otherPlaceholder}
                      className="mt-2 h-12 w-full rounded-2xl border border-border bg-white px-4 text-[15px] outline-none transition-colors placeholder:text-mono-light focus:border-secondary"
                    />
                  )}
                </Question>
              </Card>

              {shownParts.map((part, i) => (
                <PartCard
                  key={part.id}
                  index={i + 2}
                  part={part}
                  copy={copy}
                  skipped={skipped.includes(part.id as SkippablePartId)}
                  onToggleSkip={() => toggleSkip(part.id as SkippablePartId)}
                  ratings={ratings}
                  onRate={setRating}
                  style={rise(i + 2)}
                />
              ))}

              <Card index={shownParts.length + 2} title={copy.sections.overall} style={rise(shownParts.length + 2)}>
                <Question
                  id="q-recommend"
                  label={copy.recommend.question}
                  badge={copy.required}
                  error={showErrors && missing.recommend ? copy.requiredError : null}
                >
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11" role="radiogroup">
                    {Array.from({ length: 11 }, (_, score) => (
                      <ChoiceButton
                        key={score}
                        name="recommend"
                        checked={recommend === score}
                        onChange={() => setRecommend(score)}
                        className="h-12 font-serif text-[22px] leading-none lining-nums"
                        ariaLabel={String(score)}
                      >
                        {score}
                      </ChoiceButton>
                    ))}
                  </div>
                  <p className="mt-2.5 flex justify-between gap-3 text-[12px] text-mono-light">
                    <span>
                      <b className="font-serif text-[14px] font-normal text-secondary lining-nums">0</b> {copy.recommend.low}
                    </span>
                    <span className="text-end">
                      <b className="font-serif text-[14px] font-normal text-secondary lining-nums">10</b> {copy.recommend.high}
                    </span>
                  </p>
                </Question>
              </Card>

              <Card index={shownParts.length + 3} title={copy.sections.comment} style={rise(shownParts.length + 3)}>
                <Question id="q-comment" label={copy.comment.question} badge={copy.optional} badgeMuted>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder={copy.comment.placeholder}
                    className="w-full resize-y rounded-2xl border border-border bg-white px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-mono-light focus:border-secondary"
                  />
                  <p className="mt-1.5 flex items-center justify-between gap-3 text-[12px] text-mono-light">
                    <span className="inline-flex items-center gap-1.5">
                      <LockIcon />
                      {copy.comment.privacy}
                    </span>
                    <span className="tabular-nums">{comment.length}/1000</span>
                  </p>
                </Question>
              </Card>

              <div className="pt-2">
                {showErrors && missingCount > 0 && (
                  <p role="alert" className="mb-3 text-center text-[13px] font-semibold" style={{ color: ERROR_COLOR }}>
                    {fillCopy(copy.missingSummary, { n: missingCount })}
                  </p>
                )}
                {networkError && (
                  <p role="alert" className="mb-3 text-center text-[13px] font-semibold" style={{ color: ERROR_COLOR }}>
                    {copy.networkError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={phase === 'submitting'}
                  className="h-14 w-full rounded-full bg-secondary text-[17px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(109,78,66,0.7)] transition-[transform,opacity] active:scale-[0.99] disabled:opacity-60"
                >
                  {phase === 'submitting' ? copy.submitting : copy.submit}
                </button>
              </div>
            </form>
          </>
        )}

        <footer className="mt-12 text-center text-[12px] text-mono-light">
          <span className="font-serif text-[14px] tracking-wide">LIV</span> · {copy.brand}
        </footer>
      </main>
    </div>
  );
}

function Card({
  index,
  title,
  subtitle,
  aside,
  style,
  muted,
  children,
}: {
  index: number;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  style?: CSSProperties;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`survey-rise rounded-[22px] bg-white px-5 pb-5 pt-4 shadow-[0_1px_2px_rgba(109,78,66,0.06),0_12px_28px_-18px_rgba(109,78,66,0.35)] ${
        muted ? 'opacity-80' : ''
      }`}
      style={style}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#f0ebe8] pb-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-[26px] leading-none text-primary lining-nums tabular-nums">
            {String(index).padStart(2, '0')}
          </span>
          <div>
            <h2 className="text-[16px] font-bold leading-snug text-secondary">{title}</h2>
            {subtitle && <p className="text-[12px] text-mono-light">{subtitle}</p>}
          </div>
        </div>
        {aside}
      </div>
      <div className="space-y-6 pt-4">{children}</div>
    </section>
  );
}

function Question({
  id,
  label,
  hint,
  badge,
  badgeMuted,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  badge?: string;
  badgeMuted?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <fieldset id={id} className="min-w-0 scroll-mt-24">
      <legend className="w-full text-[15px] font-semibold leading-snug text-[#3f3a38]">
        {label}
        {badge && (
          <span
            className={`ms-1.5 inline-block translate-y-[-1px] rounded-full px-1.5 py-px align-middle text-[10.5px] font-semibold ${
              badgeMuted ? 'bg-[#f1eeec] text-mono-light' : 'bg-[color-mix(in_srgb,var(--color-primary)_18%,white)] text-secondary'
            }`}
          >
            {badge}
          </span>
        )}
      </legend>
      {hint && <p className="mt-1 text-[12px] text-mono-light">{hint}</p>}
      <div className="mt-3">{children}</div>
      {error && (
        <p role="alert" className="mt-2 text-[12.5px] font-semibold" style={{ color: ERROR_COLOR }}>
          {error}
        </p>
      )}
    </fieldset>
  );
}

function ChoiceButton({
  name,
  checked,
  onChange,
  className = '',
  ariaLabel,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input
        type="radio"
        name={name}
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
      <span
        className={`flex items-center justify-center rounded-2xl border transition-[background-color,border-color,color,transform] duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 active:scale-[0.97] ${
          checked
            ? 'border-secondary bg-secondary font-semibold text-white'
            : 'border-border bg-white text-[#3f3a38] hover:border-primary'
        } ${className}`}
      >
        {children}
      </span>
    </label>
  );
}

function PartCard({
  index,
  part,
  copy,
  skipped,
  onToggleSkip,
  ratings,
  onRate,
  style,
}: {
  index: number;
  part: SurveyPart;
  copy: SurveyCopy;
  skipped: boolean;
  onToggleSkip: () => void;
  ratings: Partial<Record<RatingQuestionId, number>>;
  onRate: (id: RatingQuestionId, value: number) => void;
  style?: CSSProperties;
}) {
  const text = copy.parts[part.id];
  const aside = part.skippable ? (
    <button
      type="button"
      onClick={onToggleSkip}
      aria-pressed={skipped}
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
        skipped
          ? 'border-secondary bg-secondary text-white'
          : 'border-border text-mono-light hover:border-primary hover:text-secondary'
      }`}
    >
      {skipped ? copy.unskipPart : copy.skipPart}
    </button>
  ) : null;

  return (
    <Card index={index} title={text.title} subtitle={text.subtitle || undefined} aside={aside} style={style} muted={skipped}>
      {skipped ? (
        <p className="text-[13px] text-mono-light">{copy.skippedNote}</p>
      ) : (
        part.questions.map((questionId) => (
          <Question key={questionId} id={`q-${questionId}`} label={copy.questions[questionId]}>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup">
              {copy.scale.map((label, i) => {
                const value = i + 1;
                return (
                  <ChoiceButton
                    key={value}
                    name={questionId}
                    checked={ratings[questionId] === value}
                    onChange={() => onRate(questionId, value)}
                    className="h-full min-h-[58px] flex-col gap-0.5 px-1 py-2 text-center"
                  >
                    <span className="font-serif text-[19px] leading-none lining-nums">{value}</span>
                    <span className="text-[10.5px] leading-tight">{label}</span>
                  </ChoiceButton>
                );
              })}
            </div>
          </Question>
        ))
      )}
    </Card>
  );
}

function Thanks({ copy, code, already }: { copy: SurveyCopy; code: string | null; already: boolean }) {
  return (
    <section className="survey-rise mt-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-[0_8px_20px_-10px_rgba(109,78,66,0.5)]">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.2 4.2L19 7" />
        </svg>
      </div>
      <h1 className="mt-5 text-[26px] font-bold leading-tight text-secondary">
        {already ? copy.already.title : copy.done.title}
      </h1>
      <p className="mx-auto mt-3 max-w-[400px] text-[15px] leading-relaxed text-mono">
        {already ? copy.already.body : copy.done.body}
      </p>

      {/* 답례품 티켓 — 양옆 홈과 절취선. 마스크가 box-shadow 를 지우므로 그림자는 바깥 drop-shadow 로 */}
      <div
        className="mx-auto mt-8 max-w-[400px]"
        style={{ filter: 'drop-shadow(0 1px 1px rgba(109,78,66,0.08)) drop-shadow(0 14px 22px rgba(109,78,66,0.16))' }}
      >
      <div
        className="relative rounded-[22px] bg-white text-start"
        style={{
          WebkitMaskImage:
            'radial-gradient(circle 13px at 0 112px, transparent 12.5px, #000 13px), radial-gradient(circle 13px at 100% 112px, transparent 12.5px, #000 13px)',
          WebkitMaskComposite: 'source-in',
          maskImage:
            'radial-gradient(circle 13px at 0 112px, transparent 12.5px, #000 13px), radial-gradient(circle 13px at 100% 112px, transparent 12.5px, #000 13px)',
          maskComposite: 'intersect',
        }}
      >
        <div className="flex h-[112px] flex-col justify-center px-6">
          <p className="flex items-center gap-2 text-[12px] font-semibold tracking-wide text-primary">
            <GiftIcon />
            {copy.done.giftTitle}
          </p>
          {code ? (
            <p className="mt-1.5 text-[34px] font-bold leading-none tracking-[0.14em] text-secondary tabular-nums" aria-live="polite">
              {formatGiftCode(code)}
            </p>
          ) : (
            <p className="mt-2 text-[14px] font-semibold leading-snug text-secondary">{copy.done.noCode}</p>
          )}
        </div>
        <div className="mx-5 border-t-2 border-dashed border-[#ece5e1]" />
        <div className="space-y-2 px-6 pb-6 pt-4 text-[13.5px] leading-relaxed text-mono">
          <p>{copy.done.giftHow}</p>
          {code && <p className="text-[12.5px] text-mono-light">{fillCopy(copy.done.giftValid, { days: GIFT_CODE_VALID_DAYS })}</p>}
        </div>
      </div>
      </div>

      <p className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-mono-light">
        <CameraIcon />
        {copy.done.capture}
      </p>
    </section>
  );
}

function GiftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
      <path d="M5 12.5V20h14v-7.5M12 8.5V20" />
      <path d="M12 8.5c-1.6-3.6-5.2-4-5.6-1.8-.3 1.6 2 1.8 5.6 1.8zM12 8.5c1.6-3.6 5.2-4 5.6-1.8.3 1.6-2 1.8-5.6 1.8z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
