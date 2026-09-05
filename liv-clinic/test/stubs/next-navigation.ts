// vitest 전용 — next-intl/navigation(createNavigation)이 모듈 로드 시점에 next/navigation을 요구하는데,
// 노드 테스트 환경에서는 그 패키지 진입점이 해석되지 않는다. 테스트에서 실제로 호출되지는 않으므로 no-op으로 대체한다.
const noop = () => undefined;
export const useRouter = () => ({ push: noop, replace: noop, prefetch: noop, back: noop, forward: noop, refresh: noop });
export const usePathname = () => '/';
export const useParams = () => ({});
export const useSearchParams = () => new URLSearchParams();
export const redirect = noop;
export const permanentRedirect = noop;
export const notFound = noop;
export const RedirectType = { push: 'push', replace: 'replace' } as const;
