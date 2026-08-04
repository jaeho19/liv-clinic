// `server-only`는 Next.js가 빌드 시점에 해석하는 가상 모듈이라 node_modules에 존재하지 않는다.
// vitest(environment: 'node')에서 서버 모듈을 import할 수 있도록 no-op으로 alias한다.
// (vitest.config.ts의 resolve.alias 참고)
export {};
