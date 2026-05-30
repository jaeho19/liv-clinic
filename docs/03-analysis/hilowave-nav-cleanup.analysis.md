# Gap Analysis: hilowave-nav-cleanup

> Plan(스펙) ↔ 구현 비교 · Check Phase · 2026-05-30

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 동일 브랜드(HILO WAVE) 메뉴 2개 중복 → 단일화 |
| **WHO** | 전 언어 사이트 방문자 |
| **RISK** | 구버전 페이지(`/antiaging/hilowave`) 직접 URL 접근 가능(의도적 유지) |
| **SUCCESS** | "HILO WAVE" 1개 → `/antiaging/hilowave-v2`, 11개 언어 정상, 빌드 통과 |
| **SCOPE** | `Header.tsx`만 |

> Design 문서는 사용자 합의로 생략 → Plan의 Acceptance Criteria를 스펙 기준으로 사용.

## 1. Verification Method

| 축 | 방법 | 비고 |
|----|------|------|
| Structural | `Header.tsx` nav 배열 + 빌드 라우트 트리 검사 | grep + build log |
| Functional | 라벨 키 해석(`t('nav.hilowave')`) + 단일 항목 + 빌드 | 11개 로케일 값 확인 |
| Contract | nav href ↔ 실제 라우트 존재 검증 | `/antiaging/hilowave-v2` 빌드 산출물 확인 |
| Runtime | **미실행** (dev 서버 미기동) → static-only 공식 적용 | 브라우저 시각 확인은 옵션 |

## 2. Success Criteria Evaluation

| # | Criterion | Status | Evidence |
|---|-----------|:------:|----------|
| SC-1 | 드롭다운 "HILO WAVE" 1개만 (데스크톱/모바일) | ✅ Met | `Header.tsx:140` 단일 `hilowave` 항목. `navItems`(L99) 배열이 데스크톱(L206)·`MobileMenu`(L333) **공통 소스** → 두 뷰 동시 반영. 컴포넌트 전체 grep 결과 hilowave 항목 1건 |
| SC-2 | 클릭 시 `/antiaging/hilowave-v2` 이동 | ✅ Met | `Header.tsx:140` `href: '/antiaging/hilowave-v2'` |
| SC-3 | "HILO WAVE (v2)" 표기 제거 | ✅ Met | `hilowaveV2` 항목 삭제. 잔여 항목 라벨 = `t('hilowave')` = `"HILO WAVE"` |
| SC-4 | 11개 언어 정상 | ✅ Met | `t = useTranslations('nav')`(L56), `nav.hilowave="HILO WAVE"` 11개 로케일 전부 동일(검증 완료) |
| SC-5 | 빌드 통과 | ✅ Met | `npm run build` → **EXIT_CODE=0**, error 0건. 라우트 트리에 `/[locale]/antiaging/hilowave-v2` 존재 |

**Success Rate: 5/5 (100%)**

## 3. Match Rate (static-only)

```
Overall = Structural×0.2 + Functional×0.4 + Contract×0.4
        = 100×0.2 + 100×0.4 + 100×0.4
        = 100%
```

| 축 | Score | 근거 |
|----|:-----:|------|
| Structural | 100% | nav 항목 존재, 단일 소스, v2 라우트 빌드 확인 |
| Functional | 100% | 라벨 해석 정상, 단일 항목, v2 표기 제거, 빌드 무결, 플레이스홀더 없음 |
| Contract | 100% | nav href → 실재 라우트(hilowave-v2 페이지 빌드됨), 라벨 키 전 로케일 존재 |

## 4. Decision Record Verification

| 결정 | 준수 여부 | 확인 |
|------|:--------:|------|
| 방식 B (Header.tsx만, 번역 미변경) | ✅ 준수 | 변경 파일 = `Header.tsx` 단 1개. `messages/*.json` 무변경 |
| 구버전 라우트 유지 (범위 외) | ✅ 준수 | `/antiaging/hilowave` 라우트 빌드에 잔존, nav에서만 제거 |

## 5. Gaps

**Critical / Important: 없음 (0건)**

스펙(Plan Acceptance Criteria) 대비 누락·불일치 없음.

## 6. Out-of-Scope Observations (비차단 · Info)

> Plan §7에서 명시적으로 범위 외 처리한 항목. Gap 아님.

| 항목 | 상태 | 비고 |
|------|------|------|
| `nav.hilowaveV2` 번역 키 (11개 파일) | 미사용 orphan | 무해. 향후 선택적 정리 가능 |
| `/antiaging/hilowave` 페이지 라우트 | 직접 URL 접근 가능 | 의도적 유지. 필요 시 별도 요청으로 301 리다이렉트 |
| 브라우저 시각 최종 확인 | 미실행 | 정적 증거로 충분하나, `npm run dev` 후 드롭다운 육안 확인 권장 |

## 7. Conclusion

**Match Rate 100% (static-only)** — 모든 Success Criteria 충족, Gap 0건. Report 단계 진행 가능.
