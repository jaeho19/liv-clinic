# i18n Translation Coverage Design Document

> **Phase**: Design (Plan-Design-Do-Check-Act)
> **Created**: 2026-06-01
> **Status**: Approved (Option C — Pragmatic Balance)
> **Feature**: i18n-translation-coverage
> **Plan Ref**: `docs/01-plan/features/i18n-translation-coverage.plan.md`

---

> ## ⚠️ CORRECTION — 전제(대규모 누락)는 사실이 아님
> 본 Design은 "2,532키 번역 필요"라는 **잘못된 전제**(취소된 도구 호출 결과 오인) 위에 작성되었습니다. **실측: 전 로케일 완역, 결함 없음.** 따라서 대규모 번역 파이프라인/병렬 subagent는 불필요했습니다. 실제 산출물은 재사용 검증 도구(`i18n-scan.mjs`, `i18n-capture.mjs`, `i18n-lib.mjs`)뿐입니다. 검증 정본: `docs/03-analysis/i18n-translation-coverage.analysis.md`.

---

## 📌 Context Anchor (from Plan)

| Key | Value |
|-----|-------|
| **WHY** | 신규 페이지/키가 일부 로케일에만 반영 → 7개 언어 미번역·깨진 키·한글 잔존 노출 제거. |
| **WHO** | zh-TW, vi, th, ru, fr, mn, ar 사용 글로벌 방문자 + 다국어 운영팀. |
| **RISK** | 의료 용어 번역 품질, ar RTL, ICU 변수 누락, 하드코딩 오판, wechatPage 회귀. |
| **SUCCESS** | 전 라우트×대상 로케일: raw키 0, 비-ko 한글 0, 레이아웃 무파손, 콘솔 0, 키 동기화. |
| **SCOPE** | IN: 7개 로케일 LLM 번역, 한글잔존 재번역, wechatPage SSOT, 하드코딩 t() 전환, 전수 검증. |

---

## 1. Overview

ko(2,312키)를 SSOT로 하는 next-intl 카탈로그(`src/messages/{locale}.json`)에서, **7개 대상 로케일**(zh-TW, vi, th, ru, fr, mn, ar)의 누락 키(~2,532) + 한글 잔존(~138)을 채우고, `wechatPage` 네임스페이스 SSOT 불일치 및 소스 하드코딩 한글을 정리한다.

핵심 인사이트: **en/ja/zh는 이미 완역** → 모든 누락 키에 대해 `{ko, en, ja, zh}` 4개 레퍼런스가 존재한다. 따라서 번역은 "무에서 생성"이 아니라 "기존 완역 레퍼런스 기반 변환"으로, 품질·일관성이 크게 향상된다. 특히 **zh-TW는 zh(간체)→번체 변환**으로 처리한다.

---

## 2. Architecture

### 2.1 Pipeline

```mermaid
graph TD
    A[scanner.mjs<br/>정합성 전수 분석] --> B[baseline report]
    B --> C[extract.mjs<br/>로케일별 누락키+ko/en/ja/zh 레퍼런스 추출]
    C --> D[_i18n-work/{locale}.todo.json]
    D --> E[번역 subagent x7<br/>병렬, 레퍼런스 기반 번역]
    E --> F[_i18n-work/{locale}.done.json]
    F --> G[merge.mjs<br/>구조보존 deep merge → messages/{locale}.json]
    G --> H[scanner.mjs 재실행<br/>0 missing / 0 한글잔존 검증]
    H --> I[capture.mjs<br/>전 라우트 x 대상 로케일 런타임 캡처+스캔]
    I --> J[gap analysis report]
```

### 2.2 선택 아키텍처: Option C — Pragmatic Balance

| 옵션 | 요지 | 장점 | 단점 | 판정 |
|------|------|------|------|------|
| A. Minimal | 누락 키를 한 번에 inline 번역해 직접 JSON 편집 | 도구 최소 | 재현·검증 불가, 2,500키 수작업 위험, 회귀 추적 불가 | ✗ |
| **C. Pragmatic (선택)** | **재사용 스캐너 + 추출/병합 스크립트 + 병렬 번역 subagent + 런타임 캡처** | 재현·CI 회귀 가능, 병렬로 속도, 구조보존 병합으로 안전 | 스크립트 3종 작성 비용 | ✅ |
| B. Clean/Full | 번역관리 시스템(i18n CLI, 해시 기반 동기화) 도입 | 장기 운영 최적 | 과설계, 이번 범위 초과 | △(후속) |

→ 사용자가 "design하고 do/check까지" 진행을 지시 → 추가 블로킹 없이 **Option C**로 확정 진행.

---

## 3. Data Model

### 3.1 작업 파일 스키마 (`scripts/_i18n-work/`)

```typescript
// {locale}.todo.json — 추출 산출물
type TodoFile = Record<string /* dot.key.path */, {
  ko: string;   // SSOT 원문
  en: string;   // 완역 레퍼런스(번역 기준)
  ja: string;
  zh: string;   // zh-TW는 이 값을 번체 변환
  icuVars: string[]; // {name} 등 보존 필수 변수
}>;

// {locale}.done.json — 번역 subagent 산출물
type DoneFile = Record<string /* same key path */, string /* 번역문 */>;
```

### 3.2 불변 규칙
- 키 경로(dot path)는 todo↔done 1:1 일치(추가/삭제 금지).
- `icuVars`의 모든 `{var}`는 번역문에 그대로 존재해야 함(SC-09).
- 배열 값은 `JSON.stringify`로 직렬화해 다루고, 병합 시 원형 복원.

---

## 4. "API" (스크립트 인터페이스)

```
node scripts/i18n-scan.mjs            # 정합성 리포트(JSON+표) → docs/03-analysis 참고자료
node scripts/i18n-extract.mjs <loc>   # _i18n-work/<loc>.todo.json 생성
node scripts/i18n-merge.mjs <loc>     # <loc>.done.json → messages/<loc>.json (구조보존)
node scripts/i18n-capture.mjs         # Playwright 전수 캡처 + raw키/한글/오버플로/콘솔 스캔
```

- 모든 스크립트는 `liv-clinic/`에서 실행. 멱등(재실행 안전).
- merge는 ko의 **키 순서·중첩 구조**를 기준으로 대상 JSON을 재구성(diff 최소화).

---

## 5. UI/UX 영향

- 카탈로그 값만 변경 → 컴포넌트 코드 변경 없음(번역 부분).
- 하드코딩 한글 t() 전환분만 컴포넌트 수정(런타임 실렌더 확인 대상에 한함).
- ar: `<html dir>` 미설정 확인됨 → RTL 미적용. 본 사이클은 **번역 우선**, RTL 레이아웃은 캡처로 파손 여부만 판정하고 심각 시 별도 항목으로 분리(Plan OUT 경계).

---

## 6. Implementation Details

### 6.1 scanner (i18n-scan.mjs)
- flatten(ko) 기준 leaf 키 집합 생성.
- 각 로케일: missing / extra / empty / 한글잔존(=ko & 한글 포함) / ICU 변수 불일치 산출.
- 소스 정적 검사: `useTranslations|getTranslations` 네임스페이스 root가 ko top키에 존재하는지, 비주석 하드코딩 한글 파일 목록.
- 출력: 콘솔 표 + `scripts/_i18n-work/_scan.json`.

### 6.2 wechatPage SSOT 정합
1. ko.json에 `wechatPage`(zh 값 기반 한국어) 추가 → SSOT 편입.
2. 이로써 en/ja/기타 로케일에 wechatPage가 "missing"으로 편입 → 번역 파이프라인에 자동 포함.
3. zh 기존 6키 값 보존(회귀 금지).

### 6.3 번역 subagent (병렬 x7)
- 입력: `{locale}.todo.json`. 작업: en 레퍼런스(zh-TW는 zh) 기반 번역, ko/ja/zh 교차 참조.
- 의료/시술 정확성 우선, 모호 시 값에 `⚠️` 없이 자연스럽게 번역하되 고유명사 기준표(§6.5) 준수.
- 출력: `{locale}.done.json`(키 1:1, ICU 변수 보존).
- 산출 후 main이 ICU 변수 정합 자동 검증.

### 6.4 merge (i18n-merge.mjs)
- ko 구조를 깊이우선 순회하며 대상 로케일 값을 채움: 기존 번역 유지 + done.json 신규 반영 + 한글잔존 키는 done 값으로 덮어씀.
- extra 키(예: zh의 잉여) 처리: ko에 없는 키는 제거하되 wechatPage처럼 SSOT 편입된 것은 유지.

### 6.5 고유명사 기준표 (FR-07)
| 항목 | 규칙 |
|------|------|
| 브랜드 'LIV' / 'LIV 성형외과' | 'LIV' 유지, 'Plastic Surgery' 류 현지어 병기 가능 |
| 의료진 실명 | 영문 로마자 표기 기준, 현지 음차 지양 |
| 장비명(울쎄라, 써마지 등) | 영문 상표명 우선(Ulthera, Thermage), 필요시 현지 통용어 병기 |
| 시술 고유명 | en 카탈로그 표기 기준 |

### 6.6 하드코딩 한글 (FR-06)
- 런타임 캡처에서 raw 한글이 비-ko 페이지에 노출된 컴포넌트만 실버그로 확정.
- 데이터 SSOT(`*Data.ts`)·죽은 코드(MainHero 레거시 const 등)는 제외(근거 추적표 기록).

---

## 7. Security Considerations
- 카탈로그/스크립트 변경만 — 인증·DB 영향 없음.
- 번역문 내 스크립트/HTML 주입 없음(평문 텍스트), 기존 ICU 구문만 보존.
- 시크릿/환경변수 노출 없음.

---

## 8. Test Plan

### 8.1 정적 (scanner)
- L1-1: 11개 로케일 missing=0 (대상 7개 채움 후).
- L1-2: 한글잔존=0(고유명사 예외).
- L1-3: ICU 변수 집합 ko==locale.
- L1-4: 네임스페이스 root 전부 ko top키 존재(wechatPage 포함).

### 8.2 런타임 (capture, L3)
- 전 라우트 × {ko 기준 + 7개 대상 로케일} 캡처.
- 페이지 텍스트에서 ① 키패턴 `^[a-z][\w]*(\.[\w]+)+$` 또는 `MISSING_MESSAGE` 0 ② 비-ko 한글 0(고유명사 화이트리스트 제외) ③ `scrollWidth>clientWidth+8` 0 ④ console error(intl 관련) 0.
- ko before/after 동등(회귀).

### 8.3 합격 게이트
- Match Rate ≥ 90% (gap-detector) + 위 L1/L3 0건.

---

## 9. Performance
- 번역 subagent 병렬(최대 동시 7) → 벽시계 단축.
- 캡처는 헤드리스 병렬, 라우트×로케일 매트릭스. dev 서버 1회 기동 재사용.

---

## 10. Dependencies
- next-intl, Playwright(`@playwright/test`), node(스크립트), 기존 카탈로그/데이터 파일.

---

## 11. Implementation Guide

### 11.1 순서
1. `scripts/i18n-scan.mjs` 작성 → baseline.
2. wechatPage ko 편입(§6.2).
3. `scripts/i18n-extract.mjs` → 7개 todo.json.
4. 번역 subagent 병렬 7 → done.json.
5. ICU 검증 → `scripts/i18n-merge.mjs` 병합.
6. scan 재실행(0 검증).
7. 하드코딩 실버그 t() 전환.
8. capture 런타임 검증.

### 11.2 Session Guide / Module Map
| Module | 범위 | scope key |
|--------|------|-----------|
| module-1 | 스캐너 + extract + wechatPage SSOT | `tooling` |
| module-2 | 번역(7 로케일) + merge + 재검증 | `translate` |
| module-3 | 하드코딩 t() 전환 | `hardcode` |
| module-4 | 런타임 전수 캡처 검증 | `verify` |

### 11.3 Decision Record
- [Plan] 번역 방식: LLM 전량 — 레퍼런스(en/ja/zh) 보유로 품질 확보.
- [Design] 구조: Option C(스크립트+병렬 subagent) — 재현·회귀·속도 균형.
- [Design] zh-TW: zh 간체→번체 변환 경로 분리.

---

*Generated by bkit PDCA Design Phase*
