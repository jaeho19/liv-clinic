# Plan: hilowave-nav-cleanup

> 안티에이징 드롭다운의 중복된 HILO WAVE 메뉴 정리 — 구버전 항목 삭제 + v2 항목 라벨을 "HILO WAVE"로 표시, 링크는 v2 페이지로 통합

## Executive Summary

| Perspective | Summary |
|-------------|---------|
| **Problem** | 안티에이징 메뉴에 "HILO WAVE"와 "HILO WAVE (v2)" 두 항목이 중복 노출되어 사용자에게 혼란을 줌 |
| **Solution** | 네비게이션을 단일 "HILO WAVE" 항목으로 통합하고 v2 페이지(`/antiaging/hilowave-v2`)로 연결 (방식 B: Header.tsx 1파일만 수정) |
| **Function/UX Effect** | 드롭다운에 HILO WAVE 메뉴가 1개만 표시되고, 클릭 시 최신 v2 상세페이지로 이동 |
| **Core Value** | 메뉴 일관성 확보 + 사용자가 항상 최신 버전 페이지로 진입 |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 동일 브랜드(HILO WAVE)의 메뉴가 2개라 중복·혼란 발생 → 단일화 필요 |
| **WHO** | 사이트 방문자 (전 언어), 안티에이징 시술 탐색 사용자 |
| **RISK** | 구버전 페이지(`/antiaging/hilowave`)가 직접 URL로는 여전히 접근 가능 (orphan) — 본 작업 범위 외로 의도적 유지 |
| **SUCCESS** | 드롭다운에 "HILO WAVE" 1개만 표시 + `/antiaging/hilowave-v2` 연결 + 11개 언어 정상 + 빌드 통과 |
| **SCOPE** | 네비게이션 메뉴(`Header.tsx`)에 한정. 페이지 라우트/콘텐츠/리다이렉트는 범위 외 |

## 1. Overview

| Item | Detail |
|------|--------|
| Feature | 안티에이징 네비게이션 드롭다운의 중복 HILO WAVE 메뉴 단일화 |
| Priority | High (사용자 대면 메뉴 중복 제거) |
| Complexity | Low (링크 변경 + 1줄 삭제, 로직 변경 없음) |
| Estimated Files | 1개 (`Header.tsx`) |
| Selected Approach | **방식 B** — 기존 `hilowave` 항목 재활용, 번역 파일 미변경 |

## 2. Current State (AS-IS)

### 2.1 Header.tsx 안티아이징 드롭다운 (lines 135-142)
```
1. 보톡스       (/antiaging/botox)
2. 필러         (/antiaging/filler)
3. 스킨부스터   (/antiaging/skinbooster)
4. 스킨케어     (/antiaging/skincare)
5. HILO WAVE        (/antiaging/hilowave)      ← key: hilowave   (구버전)
6. HILO WAVE (v2)   (/antiaging/hilowave-v2)   ← key: hilowaveV2 (v2)
```

### 2.2 라벨 출처 (i18n 번역 키, `nav.*`)
| Key | 11개 언어 공통 값 | 위치 |
|-----|------------------|------|
| `nav.hilowave` | `"HILO WAVE"` | `messages/*.json:159` |
| `nav.hilowaveV2` | `"HILO WAVE (v2)"` | `messages/*.json:160` |

> **핵심 관찰**: `nav.hilowave`는 이미 11개 언어 전부 `"HILO WAVE"`로, 목표 라벨과 동일. 따라서 이 키를 살리면 번역 파일 수정이 전혀 불필요.

### 2.3 네비게이션 소스 단일성 확인
- `constants.ts` MAIN_NAV에는 hilowave 항목이 **존재하지 않음** (grep으로 확인). 안티에이징 드롭다운의 hilowave 항목은 `Header.tsx`에만 정의됨.

## 3. Target State (TO-BE)

### 3.1 Header.tsx 안티에이징 드롭다운 (변경 후)
```
1. 보톡스       (/antiaging/botox)
2. 필러         (/antiaging/filler)
3. 스킨부스터   (/antiaging/skinbooster)
4. 스킨케어     (/antiaging/skincare)
5. HILO WAVE    (/antiaging/hilowave-v2)   ← key: hilowave, href만 v2로 변경
   (hilowaveV2 항목 삭제)
```

### 3.2 라벨
- 변경 없음. `t('hilowave')` = `"HILO WAVE"` 그대로 사용 (11개 언어 자동 반영).

## 4. Implementation Plan

### 4.1 파일 변경 목록

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `src/components/layout/Header.tsx` (line 140) | `hilowave` 항목의 `href`를 `/antiaging/hilowave` → `/antiaging/hilowave-v2`로 변경 | Low |
| 2 | `src/components/layout/Header.tsx` (line 141) | `hilowaveV2` 항목 줄 삭제 | Low |

### 4.2 변경하지 않는 항목 (의도적 제외)

| Target | Reason |
|--------|--------|
| `messages/*.json` (11개) `nav.hilowave` | 이미 `"HILO WAVE"`라 변경 불필요 |
| `messages/*.json` (11개) `nav.hilowaveV2` | 사용처 제거로 미사용 키가 되나, 무해한 orphan이므로 유지 (선택적 후속 정리 가능) |
| `src/app/[locale]/antiaging/hilowave/**` | 구버전 페이지 라우트 — 사용자 결정에 따라 그대로 유지 (직접 URL 접근 가능) |
| `src/app/[locale]/antiaging/hilowave-v2/**` | v2 페이지 — 변경 없음 |
| `src/lib/pricing.ts` | 가격 데이터 — 네비와 무관, 변경 없음 |

### 4.3 URL 정책
- 신규 항목 링크: `/antiaging/hilowave-v2` (v2 페이지 유지)
- 구버전 `/antiaging/hilowave`: 라우트 삭제/리다이렉트 없음 (범위 외, 직접 접근 가능)

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 메뉴 깨짐/누락 | None | N/A | 텍스트/링크만 변경, 구조 동일 |
| i18n 누락 | None | N/A | 기존 `nav.hilowave` 라벨 재사용 (전 언어 검증 완료) |
| 구버전 페이지 중복 콘텐츠(SEO) | Low | Low | 의도적 유지. 필요 시 별도 요청으로 301 리다이렉트 추가 가능 |
| 미사용 번역 키(`hilowaveV2`) 잔존 | Low | None | 무해. 선택적 후속 정리 항목으로 기록 |

## 6. Acceptance Criteria

- [ ] 데스크톱 안티에이징 드롭다운에 "HILO WAVE" 항목이 **1개만** 표시
- [ ] 모바일 메뉴에서도 "HILO WAVE" 1개만 표시
- [ ] 해당 항목 클릭 시 `/antiaging/hilowave-v2`로 이동
- [ ] "HILO WAVE (v2)" 표기가 메뉴에서 사라짐
- [ ] 11개 언어 모두 "HILO WAVE" 라벨 정상 표시
- [ ] `npm run build` 빌드 에러 없음

## 7. Out of Scope (후속 가능 항목)

- 구버전 `/antiaging/hilowave` → `/antiaging/hilowave-v2` 301 리다이렉트
- 미사용 `nav.hilowaveV2` 번역 키 11개 파일 정리
- 구버전 페이지 라우트/콘텐츠 삭제
