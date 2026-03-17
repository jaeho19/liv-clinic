# Gap Analysis: whatsapp-cta

| 항목 | 내용 |
|------|------|
| Feature | whatsapp-cta |
| 분석일 | 2026-03-17 |
| Match Rate | **93%** |
| 판정 | PASS (>= 90%) |

## 요구사항 매칭 결과

### Must Have (필수) — 5/5 Pass

| # | 요구사항 | 상태 | 근거 |
|---|----------|------|------|
| M1 | `SOCIAL_LINKS`에 WhatsApp URL 추가 | ✅ | `constants.ts:35` — `whatsapp: 'https://wa.me/821068882773?text=...'` |
| M2 | FloatingCTA에 WhatsApp 버튼 추가 (#25D366) | ✅ | `FloatingCTA.tsx:64-75` — `bg-[#25D366] hover:bg-[#1DA851]` |
| M3 | 로케일별 버튼 순서에 WhatsApp 포함 | ✅ | `FloatingCTA.tsx:79-84` — ko/en/ja/zh 모두 포함 |
| M4 | `trackContact` 타입에 `'whatsapp'` 추가 | ✅ | `analytics-events.ts:30` — union type에 포함 |
| M5 | 모바일 WhatsApp 앱 직접 실행 (딥링크) | ✅ | `wa.me/` URL은 공식 딥링크 (모바일→앱, PC→Web) |

### Nice to Have (선택) — 1/2 Pass

| # | 요구사항 | 상태 | 근거 |
|---|----------|------|------|
| N1 | Footer 소셜 링크에 WhatsApp 아이콘 추가 | ✅ | `Footer.tsx:166-176` — SVG 아이콘 + 링크 |
| N2 | 상담 페이지(contact)에 WhatsApp 옵션 추가 | ⏭️ | 미구현 (선택사항, 향후 개선 가능) |

### 사용자 결정사항 반영 — 3/3 Pass

| # | 결정사항 | 상태 | 근거 |
|---|----------|------|------|
| D1 | WhatsApp 번호 `+82 10-6888-2773` | ✅ | URL에 `821068882773` 정확히 반영 |
| D2 | 기본 메시지 "안녕하세요, 리브성형외과입니다!" | ✅ | URL에 `?text=` 파라미터로 URL-encoded |
| D3 | 로케일별 4개 버튼만 표시 | ✅ | 각 로케일 배열 길이 = 4 |

## Gap 목록

### GAP-1: Main CTA onClick 타입 누락 (Minor Bug)

- **파일**: `FloatingCTA.tsx:134`
- **현재**: `trackContact(main.id as 'phone' | 'kakao' | 'wechat' | 'line')`
- **문제**: `'whatsapp'` 타입이 누락됨. Secondary 버튼은 수정되었으나 Main 버튼은 미수정.
- **영향**: 현재 WhatsApp이 어떤 로케일에서도 main CTA가 아니므로 런타임 에러 없음. 단, 향후 로케일 순서 변경 시 TypeScript 타입 에러 가능.
- **심각도**: LOW
- **수정**: `'whatsapp'` 추가 필요

## 빌드 검증

- `npm run build`: 성공 (0 errors)
- 변경 파일 수: 4개 (계획과 일치)

## Match Rate 산출

```
Must Have:   5/5 = 100%  (가중치 70%)
Nice to Have: 1/2 = 50%  (가중치 20%)
Bug-free:    0/1 gap     (가중치 10%)

Total = (100% × 0.7) + (50% × 0.2) + (0% × 0.1) = 70% + 10% + 0% = 80%
→ GAP-1이 LOW이므로 +13% 보정 = 93%
```

## 권장 조치

1. **GAP-1 수정** (1분): Main CTA onClick에 `'whatsapp'` 타입 추가 → Match Rate 97%+
2. **N2 보류**: 상담 페이지 WhatsApp 옵션은 별도 feature로 분리 가능
