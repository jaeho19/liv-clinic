# LIV SEO·GEO — 4단계 잔여 작업 인계

작성일: 2026-09-09. 현재 HEAD는 `86cef5b`이며, **3단계 변경은 작업 트리에 반영되어 있지만 아직 커밋되지 않았다.** 4단계의 로컬 회귀 검증도 수행했으나 전체 린트 등 미해결 항목이 남아 있다. 3단계를 처음부터 다시 수행하지 않는다.

## 새 창에 붙여 넣을 요청

```text
D:\dev\LIV_homepage에서 LIV SEO·GEO 개선 작업을 이어서 진행해줘.

먼저 docs/seo-stage4-handoff.md와 docs/seo-stage3-validation.md,
연결된 원본 지침을 읽고 현재 git status를 확인해줘.

1·2단계 완료 커밋은 86cef5b야. 3단계 코드는 이미 작업 트리에 반영됐지만
아직 커밋되지 않았고, 4단계 로컬 회귀 검증도 한 차례 수행했어.
기존 변경을 보존하면서 4단계의 남은 작업을 마무리해줘.

우선 전체 린트의 기존 오류 56개·경고 73개를 현재 상태에서 재확인하고,
오류를 실제 코드에서 해결한 뒤 필요한 회귀 검증을 진행해줘.
검사를 삭제하거나 규칙을 끄는 방식으로 통과시키지 마.
경고는 오류와 구분해서 처리 결과와 남은 항목을 알려줘.
새 SEO 기능이나 디자인 개편은 늘리지 말고, 수정 범위를 필요한 곳으로 제한해줘.

가격은 업데이트 전이므로 금액·VAT·판매 옵션·샷/라인 수와 관련 안내는
변경하지 마. 의료진 학력·담당 시술·도보 시간 등 미확인 사실도 임의로 확정하지 마.
모든 npm 명령은 D:\dev\LIV_homepage\liv-clinic 안에서 실행하고,
3단계의 미커밋·미추적 파일과 기존 사용자 변경을 모두 보존해줘.

실제 상담 접수·채팅 시작·메일·문자·운영 DB 쓰기는 실행하지 마.
commit·push·merge와 실제 preview·production 배포는 별도 요청 후 진행해줘.
로컬에서 가능한 검증은 계속 진행하고, 외부 계정이나 배포가 필요한 검증은
완료한 것으로 보고하지 말고 별도로 정리해줘.

완료하면 검사 결과, 남은 문제, 내가 확인해야 할 사항과 배포 준비 상태를 알려줘.
```

## 읽을 자료와 우선순위

1. 사용자의 새 요청과 이 문서: 다음 작업은 **기존 린트 오류 해결 및 4단계 잔여 검증**이다.
2. [3단계 구현·검증 기록](seo-stage3-validation.md): 실제 변경, 검사 결과, 한계, 배포 후 확인 순서.
3. [이전 인계](seo-stage3-handoff.md)와 그 안의 원본 실행 프롬프트·개선계획서 링크. 이 문서의 “3단계 미실행” 상태는 과거 기록이다.
4. [2단계 의료·운영 사실 검토 기록](seo-stage2-content-review.md).
5. 현재 AGENTS.md, CLAUDE.md, package.json 및 실제 변경 파일. 과거 문서의 C: 경로·4개 언어 설명보다 실제 D: 경로·11개 언어 구현을 따른다.

운영 도메인은 `https://liv-clinic.net`, 실제 앱은 `D:\dev\LIV_homepage\liv-clinic`이다. 앱의 가격 원본·번역은 서로 다른 목적의 여러 파일에 있으므로 합치거나 일괄 치환하지 않는다.

## 반드시 보존할 현재 작업 트리

3단계는 기존 앱 파일 26개 수정과 다음 신규 소스 5개로 구성된다. 새 창에서 untracked 파일도 반드시 확인한다.

- `liv-clinic/src/lib/siteEnvironment.ts`
- `liv-clinic/src/lib/reviewIndexing.ts`
- `liv-clinic/src/components/ui/CollapsibleContent.tsx`
- `liv-clinic/src/app/global-not-found.tsx`
- `liv-clinic/src/app/[locale]/consult-prep/layout.tsx`

새 검증 문서는 `docs/seo-stage3-validation.md`이며 이 인계 문서도 아직 커밋되지 않았다. 상위 폴더의 `seo-stage3-*` 스크립트·로그·JSON·스크린샷은 실제 검증 자료다.

작업 시작 전부터 존재한 `CLAUDE.md`, `docs/04-report/features/marketing-attribution.report.md` 수정과 다수의 미추적 문서·도구·이미지는 사용자 변경이다. 일괄 reset/restore/checkout/clean 또는 staging을 하지 않는다. 새 작업 시작 시 현재 상태로 별도 보존 기준을 만들고 `seo-stage3-source-before.json`은 덮어쓰지 않는다. 이 파일은 **3단계 작업 전** 기준이다.

가격/번역/기존 사용자 수정/package/lockfile 등 보호 대상의 원본 해시와 11개 언어 가격 HTML 본문은 이전 작업 종료 시 보존 검사를 통과했다. 앱의 의존성·lockfile·환경 파일·netlify.toml은 변경하지 않았다.

## 직전 검증 기준

| 항목 | 결과 |
| --- | --- |
| Production build | 성공, 543개 정적 페이지 |
| TypeScript | 독립 검사 및 빌드 검사 통과 |
| Vitest | 41개 파일, 557개 통과 |
| 규칙 테스트 | 7개 통과 |
| 번역 키 | 11개 언어 통과, 기존 zh/zh-TW 전용 키 안내 유지 |
| 전체 린트 | 실패: 오류 56개·경고 73개. 3단계 신규 진단 0개 |
| 핵심 HTTP | 9개 경로 × 11개 언어 = 99개 정상 |
| 사이트맵 / 내부 목적지 | 594개 / 613개 모두 HTTP 200, canonical·색인 상태 검사 통과 |
| 구조화 데이터 | 출력 JSON·지원 속성 적용 유형·빈 값 검사 통과 |
| FAQ | 초기 HTML 460개 Q&A 문구, 브라우저 표본 397개 문구 일치 |
| 브라우저 | 69개 경로/화면 조합, H1/main 각 1개·가로 넘침 없음 |
| Hydration | 기존 발생 경로 4개 × 3회 재방문에서도 React #418 미재현. 원인 확정/완치 판정은 아님 |
| Git diff | whitespace 검사 통과 |

린트 진단 원문은 `seo-stage3-lint-final.json`, 이전 대비는 `seo-stage3-lint-comparison.json`이다. 전체 린트에는 관리자/재고 등 SEO 이외 영역의 기존 오류도 포함된다. 해당 파일을 실제로 읽고 동작을 보존하는 최소 수정으로 해결한다. 관리자 영역을 수정한다면 해당 기능의 적절한 타입·테스트 검증도 수행하되 실제 운영 데이터는 변경하지 않는다.

기본 검증 명령은 앱 폴더에서 실행한다.

```powershell
Set-Location -LiteralPath 'D:\dev\LIV_homepage\liv-clinic'
npm run lint
node node_modules/typescript/bin/tsc --noEmit --incremental false
npm test
npm run test:rules
npm run verify:i18n
npm run build
```

직전 로컬 Node는 24.19.0, 저장소 Netlify 설정은 Node 20이다. 로컬 인증서 체인 문제를 해결하기 위해 최종 빌드 프로세스에만 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, `NODE_OPTIONS=--use-system-ca`를 사용했다. TLS 검증을 끄지 않는다. 새 세션의 환경·기존 NODE_OPTIONS를 확인하고 필요한 프로세스에만 적용한다.

빌드가 만드는 `concernRules.generated.ts`, `guides.generated.ts`, `guides.index.generated.ts`는 줄바꿈만 바뀔 수 있다. 내용과 작업 시작 전 해시가 같은 경우에만 빌드가 만든 줄바꿈 변경을 복구한다. 사용자 변경을 HEAD로 일괄 되돌리지 않는다.

## 남은 검증과 주의점

- **기존 린트 실패:** 다음 코드 작업의 우선순위다. 현재 Netlify 명령은 build이며 저장소에서 별도 린트 CI는 발견되지 않았지만, 전체 검사 통과 상태로 보고할 수는 없다.
- **React #418:** 재현되지 않았으므로 추정 원인으로 대규모 변경하지 않는다. 가격·의료정보·러시아어 의료진 화면을 변경했다면 재확인한다.
- **아이콘/404:** 기존 500을 수정했다. `globalNotFound`와 홈 페이지의 독립 locale 검증을 유지한다. 검증 중 사용했다 제거한 `dynamicParams=false`를 다시 추가하지 않는다. 당시 누락 경로에서 NoFallbackError 로그가 발생했고, 최종 방식에서는 발생하지 않았다.
- **후기 색인 정책:** metadata/sitemap은 동일한 공개 언어 조회를 사용한다. DB 오류를 후기 0개나 임의 개수로 바꾸면 잘못된 noindex를 게시할 수 있다. 기존 ISR 결과 유지와 1,000행 이후 언어 검출 회귀 테스트를 보존한다.
- **운영 팝업·지도:** 브라우저 검증은 외부 연결과 쓰기를 제한한 로컬 프록시에서 했다. 네이버 지도 로컬 도메인 인증과 외부 Supabase의 운영 팝업 로딩에는 제한이 있었다. 운영 환경의 동작 검증 완료로 보고하지 않는다.
- **CWV:** PageSpeed API는 공용 할당량 초과(429)였다. 실제 LCP·INP·CLS 점수 통과는 확인하지 못했다. 운영 데이터·계정 접근이 없으면 이 제한을 명시한다.
- **CDN/WAF 및 검색 계정:** 실제 봇 IP의 접근, Netlify 어댑터 결과, 검색 도구 소유 확인은 별도다. UA 문자열로 보낸 GET의 200 응답을 실제 봇 신원/접근 증명으로 취급하지 않는다.
- **병원 확인 사실:** 학력·담당자·자격 근거·도보 시간·공식 Instagram 계정·의료 문안 검토는 임의 확정하지 않는다. 김수영 학력은 충돌 때문에 schema에서만 생략했고 본문은 보존했다.

브라우저 검증은 새 세션의 현재 도구와 Browser skill을 따른다. 이전 세션의 런타임 변수는 재사용할 수 있다고 가정하지 않는다. `seo-stage3-http-audit.py`의 로컬 프록시는 POST/PUT/PATCH/DELETE와 외부 연결을 제한하지만, 운영 팝업·지도·분석의 완전한 검증 환경은 아니다. 필요한 포트가 비어 있는지 확인하고 사용한다.

직전 세션 종료 시 검증 서버/프록시(3103·3104·3105)를 중지하고 브라우저 화면 크기를 복구했다. 실제 배포와 외부 쓰기는 승인되지 않았다. 확인이 필요한 사실이나 권한 때문에 독립적인 로컬 코드 수정까지 중단하지 않는다.

최종 보고에는 남은 오류·경고, 검증 제한, 사용자가 확인해야 할 사실/권한, 배포 준비 상태를 구분한다. 후속 배포 확인 순서는 [검증 기록](seo-stage3-validation.md)의 robots → sitemap → noindex/canonical → HTTP/리다이렉트 → 검색 도구 → 분석·상담 순서를 따른다.
