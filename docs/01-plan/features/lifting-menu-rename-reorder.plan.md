# Plan: lifting-menu-rename-reorder

> "압토스 나미카" -> "압토스 바이오 리프팅" 메뉴명 변경 및 순서 조정

## 1. Overview

| Item | Detail |
|------|--------|
| Feature | 리프팅 네비게이션 드롭다운 메뉴 텍스트 변경 및 순서 조정 |
| Priority | High (사용자 대면 메뉴 변경) |
| Complexity | Low (텍스트/순서 변경만, 로직 변경 없음) |
| Estimated Files | 7개 |

## 2. Current State (AS-IS)

### 2.1 Header.tsx 메뉴 순서 (lines 104-112)
```
1. 울쎄라피 프라임  (/lifting/ulthera)
2. 써마지 FLX       (/lifting/thermage)
3. 덴서티           (/lifting/density)
4. 인모드            (/lifting/inmode)
5. 슈링크            (/lifting/shurink)
6. 실리프팅          (/lifting/thread)
7. 압토스 나미카     (/lifting/aptos)     ← 현재 마지막
```

### 2.2 constants.ts MAIN_NAV 메뉴 순서 (lines 1256-1264)
```
1. 압토스 나미카     (/lifting/aptos)     ← 현재 첫번째
2. 울쎄라피 프라임
3. 써마지 FLX
4. 덴서티
5. 인모드
6. 슈링크
7. 실리프팅
```

### 2.3 i18n 번역 키 (`nav.aptos`)
| Language | Current Value |
|----------|--------------|
| ko | 압토스 나미카 |
| en | APTOS NAMICA |
| ja | アプトス ナミカ |
| zh | APTOS NAMICA |

### 2.4 constants.ts TREATMENTS.lifting.aptos (lines 399-444)
- `name`: '압토스 나미카'
- `nameEn`: 'APTOS NAMICA'

## 3. Target State (TO-BE)

### 3.1 Header.tsx 메뉴 순서 (변경 후)
```
1. 울쎄라피 프라임  (/lifting/ulthera)
2. 써마지 FLX       (/lifting/thermage)
3. 덴서티           (/lifting/density)
4. 인모드            (/lifting/inmode)
5. 슈링크            (/lifting/shurink)
6. 압토스 바이오 리프팅 (/lifting/aptos)  ← 실리프팅 바로 위로 이동
7. 실리프팅          (/lifting/thread)
```

### 3.2 constants.ts MAIN_NAV 메뉴 순서 (변경 후)
```
1. 울쎄라피 프라임
2. 써마지 FLX
3. 덴서티
4. 인모드
5. 슈링크
6. 압토스 바이오 리프팅  ← 실리프팅 바로 위로
7. 실리프팅
```

### 3.3 i18n 번역 키 변경 (`nav.aptos`)
| Language | New Value |
|----------|-----------|
| ko | 압토스 바이오 리프팅 |
| en | APTOS Bio Lifting |
| ja | アプトス バイオリフティング |
| zh | APTOS 生物提升 |

### 3.4 constants.ts TREATMENTS.lifting.aptos 변경
- `name`: '압토스 바이오 리프팅'
- `nameEn`: 'APTOS Bio Lifting'

## 4. Implementation Plan

### 4.1 파일 변경 목록

| # | File | Change | Risk |
|---|------|--------|------|
| 1 | `src/components/layout/Header.tsx` | aptos 항목을 thread 바로 위로 이동 (line 111 -> line 110 위치) | Low |
| 2 | `src/lib/constants.ts` (MAIN_NAV) | 라벨 변경 + 순서 조정 (line 1257) | Low |
| 3 | `src/lib/constants.ts` (TREATMENTS) | name/nameEn 변경 (lines 402-403) | Low |
| 4 | `src/messages/ko.json` | `nav.aptos` 값 변경 | Low |
| 5 | `src/messages/en.json` | `nav.aptos` 값 변경 | Low |
| 6 | `src/messages/ja.json` | `nav.aptos` 값 변경 | Low |
| 7 | `src/messages/zh.json` | `nav.aptos` 값 변경 | Low |

### 4.2 URL 변경 여부
- **변경 없음**: `/lifting/aptos` 경로는 그대로 유지
- slug는 `aptos`로 유지 (SEO 및 기존 링크 보존)

### 4.3 변경하지 않는 파일 (변경 불필요)
| File | Reason |
|------|--------|
| `src/app/[locale]/lifting/aptos/layout.tsx` | `TREATMENTS.lifting.aptos`에서 name을 가져오므로 자동 반영 |
| `src/app/[locale]/lifting/aptos/page.tsx` | 변경 없음 (slug 유지) |
| `src/app/[locale]/lifting/page.tsx` | liftingTreatmentIds 순서는 별도 (카드 그리드 순서이므로 네비와 독립) |
| `src/types/admin.ts` | 어드민 타입의 '압토스' 카테고리명은 별개 (시술 카테고리 용도) |

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 기존 URL 깨짐 | None | N/A | URL 변경 없음 (`/lifting/aptos` 유지) |
| SEO 영향 | Minimal | Low | 페이지 타이틀/메타만 변경, URL 유지 |
| i18n 누락 | Low | Medium | 4개 언어 파일 모두 변경 |
| 스타일 깨짐 | None | N/A | 텍스트/순서만 변경, CSS 미변경 |

## 6. Acceptance Criteria

- [ ] 데스크톱 네비게이션 드롭다운에서 "압토스 바이오 리프팅"이 "실리프팅" 바로 위에 표시
- [ ] 모바일 메뉴에서도 동일한 순서로 표시
- [ ] 4개 언어(ko, en, ja, zh) 모두 새 이름 반영
- [ ] `/lifting/aptos` URL 정상 접근 가능
- [ ] 페이지 타이틀, 메타데이터에 새 이름 반영
- [ ] 빌드 에러 없음
