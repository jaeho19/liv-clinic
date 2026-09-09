export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <p className="font-serif text-display text-primary mb-4">404</p>
        <h1 className="text-h2 text-secondary mb-4">페이지를 찾을 수 없습니다</h1>
        <p className="text-body text-mono mb-8">
          찾으시는 페이지가 없거나 이동되었습니다.
        </p>
        <Link href="/ko" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 py-3 text-white">
            홈으로
        </Link>
      </div>
    </div>
  );
}
import Link from 'next/link';
