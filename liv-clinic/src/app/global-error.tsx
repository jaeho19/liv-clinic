'use client';

// 루트 레이아웃(NextIntlClientProvider 상위)에서 발생하는 크래시 fallback.
// 이 컴포넌트는 locale/번역 컨텍스트보다 상위에 있어 t()를 사용할 수 없으므로 KO/EN 병기.
// Tailwind/globals.css 적용을 보장할 수 없는 경계이므로 인라인 스타일만 사용.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#f6f6f6',
          color: '#575756',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#6d4e42', margin: '0 0 12px' }}>
            일시적인 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
            페이지를 표시하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
            <br />
            Something went wrong. Please try again in a moment.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                borderRadius: 8,
                border: 'none',
                background: '#b4988d',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              다시 시도 / Try again
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid #e5e5e5',
                background: '#fff',
                color: '#575756',
                cursor: 'pointer',
              }}
            >
              홈으로 / Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
