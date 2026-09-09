# LIV SEO·GEO 3단계 인계

작성일: 2026-09-09. 이 문서가 포함된 커밋은 가격을 제외한 1·2단계 구현과 검토 기록을 보관한다. 3단계 기술 수정과 운영 배포는 아직 실행하지 않았다.

## 새 창에 붙여넣을 시작 요청

```text
D:\dev\LIV_homepage 프로젝트에서 LIV SEO·GEO 개선 작업을 이어서 진행해줘.
먼저 docs/seo-stage3-handoff.md와 그 안에 연결된 원본 실행 프롬프트,
개선계획서, 2단계 검토 기록, 현재 git status와 최근 커밋을 확인해줘.

1·2단계는 완료했어. 기존 변경을 유지하면서 원본 프롬프트의
3단계 ‘기술 SEO와 AI 검색 접근’을 실제 코드에 반영해줘.
완료 후에는 4단계의 배포 전 회귀 검증까지 진행해줘.

가격은 아직 업데이트 전이므로 금액·VAT·판매 옵션·샷/라인 수와
관련 안내는 변경하지 마. 가격 페이지의 canonical·hreflang·렌더링·
모바일 가림 등 기술 점검은 진행하되 기존 가격 정보를 보존해줘.
의료진 학력·담당자·도보 시간처럼 확인이 필요한 사실을 임의 확정하지 마.

운영 사이트는 https://liv-clinic.net 이고 실제 앱은 liv-clinic/이야.
모든 npm 명령은 D:\dev\LIV_homepage\liv-clinic 안에서 실행해줘.
기존 사용자 변경과 검증 자료를 보존하고, 이번 범위의 문제를 수정·검증해줘.
별도 요청 전에는 commit·push·merge·deploy나 실제 상담 접수·메일·문자·
운영 DB 쓰기를 하지 마. 완료하면 검증 결과, 남은 문제, 배포 준비 상태를 알려줘.
```

## 읽을 자료와 우선순위

1. 사용자의 최신 요청: **가격 관련 변경 제외**, 1·2단계 커밋 후 새 창에서 3단계 시작, 이후 배포 진행 예정. 이번 커밋 요청은 현재까지의 작업에 대한 허가다. 다음 작업의 자동 커밋·배포 요청은 아니다.
2. [원본 단계별 실행 프롬프트](seo-input/LIV-Codex-실행프롬프트.md): 공통 조건과 3·4단계 전문.
3. [원본 SEO·GEO 개선계획서](seo-input/LIV-SEO-GEO-개선계획서.md): 배경, 조사 근거와 단계별 범위.
4. [2단계 콘텐츠 검토 기록](seo-stage2-content-review.md): 공개 반영 내용, 근거, 미반영 의료 문안, 확인 필요 사실, 검증 결과.
5. 실제 `AGENTS.md`, `CLAUDE.md`, README, package.json, 라우팅·배포 설정과 현재 작업 트리.

두 원본은 사용자가 제공한 `C:\Users\1\Documents\카카오톡 받은 파일\`의 동명 파일을 내용 변경 없이 복사했다. 원본의 가격 개선 지시는 사용자의 최신 가격 제외 요청으로 제한된다. 계획서의 2026-09-08 관찰과 검색 서비스 정책은 실행 시점에 재확인한다. 2단계 기록의 ‘커밋하지 않았다’는 문장은 해당 단계 종료 당시의 기록이다.

## 확인된 프로젝트 상태

| 항목 | 확인 내용 |
| --- | --- |
| 작업 폴더 / 앱 | `D:\dev\LIV_homepage` / `liv-clinic/` |
| 운영 도메인 | `https://liv-clinic.net`, 한국어 `/ko`. `src/lib/seo.ts`의 `BASE_URL`과 배포 설정에서 재확인 |
| 프레임워크 | Next.js 16.1.1 App Router, React 19, next-intl |
| 실제 언어 | `ko`, `en`, `ja`, `zh`, `zh-TW`, `vi`, `th`, `ru`, `fr`, `mn`, `ar` — 총 11개 |
| 콘텐츠 | `src/messages/*.json`, `src/lib/constants.ts`, `src/lib/treatmentsI18n.ts` 등 기존 원본 사용 |
| 메타 / 구조화 데이터 | `src/lib/pageMeta.ts`, 번역의 `metaSeo`, `src/lib/seo.ts`, `src/lib/schemaI18n.ts` |
| 가격 | `src/lib/pricing.ts`, `src/lib/pricingGuide.ts` 및 번역 원본 등 복수 용도가 있음. 값을 합치거나 새 기준으로 대체하지 않음 |
| 가이드 | `content/guides/`의 원본과 생성 파일. 기존 `_facts.md`만으로 운영 사실을 검증했다고 판단하지 않음 |

상위 안내 파일에는 과거 C: 경로, 4개 언어 등의 정보가 남아 있다. 실제 환경과 코드로 확인하고 안내 파일은 자동 수정하지 않는다. 테스트 스크립트와 스크린샷은 앱 상위 작업 폴더에 둔다.

## 1·2단계에서 완료한 내용

- 홈의 고민별 카드에서 상담 준비 도구와 관련 시술의 목적을 구분하고, 가격표·시술·의료정보·의료진·위치·상담의 내부 이동을 연결했다.
- 기존 의료정보 Q&A 25개와 시술 FAQ를 유지했다. Q&A 앵커·접근성을 보완하고 잘못된 `/laser/clarity` 목적지를 `/laser`로 수정했다. 중첩 링크·버튼 및 일부 중복 `main`을 정리하고 작은 화면의 헤더 넘침을 수정했다.
- 울쎄라·써마지·실리프팅·의료진 4페이지의 11개 언어 원본을 정리했다. 확인이 부족한 수치 강조·유일성·효과 보장 문구를 제거하거나 기존 기술 설명으로 대체하고, 주장에 맞는 FDA·제조사·논문·학회 자료를 연결했다.
- 의료진의 기존 실제 사진을 대체 텍스트가 있는 이미지로 표시했다. 저널 논문 4편과 학위논문 1편을 구분하고 DOI 4개를 연결했다. DOI만으로 SCI/SCIE 등재·자격을 확정하지 않았다.
- 네 페이지 검색 설명을 실제 내용에 맞췄다. 새 임상 안내와 통계 설명은 의료진 검토 전이므로 검토 문서에만 남겼다. 가격·VAT·판매 옵션·샷/라인 수는 보존했다.

신규 공통 컴포넌트는 `TreatmentGuideLinks.tsx`, `TreatmentReferences.tsx`다. 기존 URL·디자인·인증·운영 데이터·명시적인 봇 정책은 유지했다. 새 schema나 전역 canonical·hreflang·robots·sitemap 정책은 아직 변경하지 않았다.

## 3단계에서 실행할 작업

원본 실행 프롬프트의 3단계 전문을 적용한다. 아래는 인계에 필요한 우선 확인 항목이다.

1. 운영/preview 도메인과 공개/비공개 경로를 확인한다. 대표 URL의 HTTP 상태·리다이렉트·noindex·X-Robots-Tag·snippet 제한·canonical·내부 링크를 실제 출력으로 대조한다.
2. robots.txt와 sitemap 원문, 색인 대상 대표 URL, 날짜의 실제 근거를 확인한다. 기존 생성 시각·요청 시각을 실제 콘텐츠 수정일로 취급하지 않는다.
3. 홈·시술·의료정보·가격의 초기 HTTP HTML과 최종 DOM을 각각 확인한다. 로딩 표시나 접힌 FAQ만으로 검색 불가라고 판단하지 않는다.
4. 가격 페이지의 hreflang을 HTML뿐 아니라 HTTP 헤더·사이트맵 구현과 대조한다. 실제 동등한 번역의 자기 참조·상호 연결, 영문 시술 schema의 언어, 예약 action 목적지를 확인한다.
5. 기존 JSON-LD의 유형·지원 속성·빈 값·중복·실제 날짜·본문 일치를 검증한다. 동일 엔티티의 언어 중립 `@id`를 무조건 바꾸지 않는다. 충돌한 운영 사실은 확인 없이 선택하지 않는다.
6. 아래 런타임 오류와 모바일 플로팅 UI의 본문 가림을 재현·분석한다. 이미지·폰트·스크립트 성능은 측정 후 필요한 범위만 수정한다.
7. Google·네이버·Bing·대상 AI 서비스의 공식 문서를 실행 시점에 확인한다. 검색/인용용, 사용자 요청형, 학습용 봇을 구분하고 기존 학습 차단을 임의 해제하지 않는다. CDN/WAF와 IP 정책은 확인된 설정만 다룬다.
8. 기존 FAQ와 schema를 중복 생성하지 않는다. 원본의 Google FAQ 리치 결과 정책 설명은 최신 공식 문서로 재확인한다. `llms.txt`나 특별한 AI 전용 schema는 기본 생성하지 않는다.

우선 페이지: `/ko`, `/ko/lifting/ulthera`, `/ko/lifting/thermage`, `/ko/lifting/thread`, `/ko/pricing`, `/ko/medical`, `/ko/about/staff`, `/ko/about/location`, `/ko/contact`와 대응하는 주요 번역. 나머지 11개 언어와 기존 운영 흐름에 회귀가 없어야 한다.

## 알려진 문제와 확정하지 않은 사실

| 항목 | 인계 내용 |
| --- | --- |
| 전체 린트 | 2단계 종료 기준 오류 56개·경고 73개로 실패. 이전 59개 오류에서 의료진 페이지의 `any` 3개 해결. 기존 오류 목록과 새 회귀를 구분하고 검사 삭제·비활성화로 통과시키지 않음 |
| Hydration | 2단계 `/ru/about/staff`에서 React #418 1회, 독립 재확인 3회에서는 미재현. 1단계에도 `/ko/pricing`, `/ko/medical`, `/en/pricing`에서 같은 오류 유형이 있었으나 러시아어 경로의 원인은 미확정 |
| 아이콘 | `/icon.svg`의 static-to-dynamic / headers 관련 서버 오류 기록. 재현 후 수정 여부 결정 |
| 모바일 UI | 기존 플로팅 상담·소셜 UI가 가격 및 일부 본문·논문 텍스트를 가림. 콘텐츠를 삭제하지 않고 공통 UI와 흐름을 확인 |
| 도보 시간 | 위치의 1분과 기존 시술 안내의 3분이 충돌. 이번 일부 CTA는 위치 페이지로 연결했으며 정확한 시간은 운영자 확인 필요 |
| 담당자·자격 | 울쎄라·써마지 실제 담당자와 인증 근거 미확인. 기존 소개의 전문과목은 김수영 성형외과·천신혜 가정의학과 |
| 학력 | 김수영 한국어 JSON-LD는 한양대학교, 본문은 고려대학교. 임의 선택하지 않았으며 확인 후 같은 원본을 쓰도록 정리 필요 |
| 의료 주장 | 새 검토자·검토일을 부여하지 않음. 제품별 적용 범위·효과 기간·통증·회복·병합 간격 등은 2단계 검토 기록 참조. 제거한 통계를 LIV 자체 성과나 PRIME 전용 결과로 재게재하지 않음 |

확인 자료가 필요한 항목만 보류하고 독립적인 기술 개선은 계속한다. 운영 계정·검색 도구·배포 후에만 확인 가능한 사항을 로컬에서 검증했다고 보고하지 않는다.

## 직전 검증 기준과 재실행 방법

| 검사 | 직전 결과 |
| --- | --- |
| Production build | 통과, 543개 페이지 생성. 아래 로컬 TLS 조건 있음 |
| TypeScript | 독립 `tsc`와 최종 빌드 내 검사 통과 |
| Vitest | 41개 파일, 544개 테스트 통과 |
| 규칙 테스트 | 7개 통과 |
| 번역 키 | 11개 언어 통과. 기존 zh/zh-TW 전용 키 안내는 오류 아님 |
| 수정 TS/TSX 린트 | 오류 0개, 기존 경고 16개 |
| 전체 린트 | 실패, 오류 56개·경고 73개 |
| 브라우저 | 60개 화면, 내부 목적지 33개 HTTP 200, 탐색 18개 확인. 390px 전체 언어, 1440px ko/en, 320px ko/ar |
| 보존·시각 검증 | 가격·수량·Q&A 보존, 이미지·대체 텍스트·논문 구분·출처 링크·메타·H1/main·가로 넘침 검사 통과. 런타임 이슈는 위 표처럼 별도 보류 |
| Git | 2단계 종료 시 `git diff --check` 통과 |

검증 명령은 먼저 현재 `package.json`과 대조한다. 아래는 현재 사용 가능한 명령이며 **앱 폴더에서 실행**한다.

```powershell
Set-Location -LiteralPath 'D:\dev\LIV_homepage\liv-clinic'
npm run lint
node ./node_modules/typescript/bin/tsc --noEmit --incremental false
npm run test
npm run test:rules
npm run verify:i18n
npm run build
```

기본 로컬 빌드는 Google Fonts 연결의 TLS 인증서 오류로 실패했다. 해당 프로세스에만 `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`을 적용한 최종 빌드는 통과했고 실행 후 환경값을 복구했다. TLS 검증을 끄거나 저장소·운영 설정을 변경하지 않았다. 재발 시 같은 원인인지 먼저 확인하고 이 조건을 일반 빌드 성공과 구분해 보고한다.

빌드가 생성하는 `src/lib/data/concernRules.generated.ts`, `src/lib/guides/guides.generated.ts`, `src/lib/guides/guides.index.generated.ts`에 줄바꿈만 달라지는 경우가 있었다. HEAD와 정규화한 내용이 같은지 확인한 경우에만 해당 빌드의 줄바꿈 변화를 복구했다. 사용자 수정이 섞인 파일은 일괄 복구하지 않는다. 번역 JSON의 기존 혼합 줄바꿈도 전체 재포맷하지 않는다.

로컬 검증 자료는 상위 작업 폴더에 보존했고 이 커밋에는 포함하지 않는다. `seo-stage1-audit-after.json`, `seo-stage1-header-after.json`, `seo-stage2-audit.json`, `seo-stage2-hydration-recheck.json`, `seo-stage2-visual-check.json`, `seo-stage2-lint-comparison.json`, `seo-stage2-build-final.log`, `seo-stage2-tests-final.log` 등이다. `seo-stage2-audit.py`의 보존 검사는 같은 폴더의 `seo-stage2-source-before.json`을 사용한다. 다른 체크아웃에서는 이 자료의 존재를 가정하지 말고 새 작업 전 기준을 만든다.

Playwright는 설치된 Chrome을 `channel='chrome'`으로 사용했다. 기존 검증은 실제 상담을 제출하지 않았으며 외부 변경 요청을 차단했다. 인계 시 로컬 테스트 서버는 종료된 상태다.

## 배포 전 마무리와 작업 트리 보존

3단계 구현 후 원본의 4단계로 전체 diff·필수 검사·주요 경로·모바일/데스크톱 회귀를 확인한다. 새 SEO 범위를 늘리지 말고 회귀·빌드·배포 차단 문제를 해결한다. 가격은 변경 대신 보존 여부를 검사한다.

최종 상태를 `배포 준비 완료`, `외부 설정 확인 후 배포 가능`, `검증 제한으로 판단 보류`, `배포 차단 문제 남음` 중 근거에 맞게 보고한다. 현재는 3단계 미실행과 위 미해결 사항이 있으므로 배포 준비가 완료됐다고 판단한 상태가 아니다.

배포 후 확인 목록은 robots → sitemap → noindex/canonical → HTTP 상태·리다이렉트 → 검색 도구 소유 확인·사이트맵 처리 → 분석·상담 흐름 순으로 준비한다. 필요한 환경변수는 이름과 용도만 기록한다. 실제 배포는 사용자의 후속 요청에서 진행한다.

이번 SEO 작업과 무관한 기존 `CLAUDE.md`, `docs/04-report/features/marketing-attribution.report.md` 수정 및 여러 미추적 문서·도구·이미지는 커밋에서 제외하고 그대로 남겼다. 새 창에서도 `git status`로 다시 확인하고 일괄 추가·초기화·삭제하지 않는다. 이번 커밋에는 SEO 소스 24개, 2단계 검토 기록, 이 인계 문서와 원본 입력 문서 2개만 포함한다.
