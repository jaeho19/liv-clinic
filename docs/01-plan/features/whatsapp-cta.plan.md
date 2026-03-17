# WhatsApp CTA 버튼 추가

## 개요

| 항목 | 내용 |
|------|------|
| Feature | whatsapp-cta |
| 작성일 | 2026-03-17 |
| 상태 | Plan |
| 난이도 | Low |
| 예상 변경 파일 수 | 4~5개 |

## 배경

리브성형외과 홈페이지에는 현재 4개의 상담 CTA 버튼이 있다:
- **KakaoTalk** (한국 고객 주력)
- **LINE** (일본 고객 주력)
- **WeChat** (중국 고객 주력)
- **Phone** (전화상담)

동남아시아, 유럽, 중동 등 해외 환자 유치를 위해 **WhatsApp** 버튼을 추가한다.
WhatsApp은 전세계 20억+ 사용자를 보유한 메신저로, 의료관광 고객 접점 확대에 효과적이다.

## 목표

1. FloatingCTA에 WhatsApp 버튼 추가 (기존 LINE/WeChat과 동일 패턴)
2. Footer 소셜 링크에 WhatsApp 아이콘 추가
3. GA4 analytics 이벤트에 WhatsApp 추적 추가
4. 다국어 라벨 지원 (ko, en, ja, zh)

## 요구사항

### 필수 (Must Have)
- [ ] `SOCIAL_LINKS`에 WhatsApp URL 추가 (`https://wa.me/<phone-number>`)
- [ ] FloatingCTA에 WhatsApp 버튼 추가 (초록색 #25D366)
- [ ] 로케일별 버튼 순서에 WhatsApp 포함
- [ ] `trackContact` 타입에 `'whatsapp'` 추가
- [ ] 모바일에서 WhatsApp 앱 직접 실행 (딥링크)

### 선택 (Nice to Have)
- [ ] Footer 소셜 링크에 WhatsApp 아이콘 추가
- [ ] 상담 페이지(contact)에 WhatsApp 옵션 추가

## 기술 분석

### 수정 대상 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/constants.ts` | `SOCIAL_LINKS`에 `whatsapp` 추가 |
| `src/components/layout/FloatingCTA.tsx` | WhatsApp 버튼 정의 + 로케일 순서 |
| `src/lib/analytics-events.ts` | `trackContact` 타입에 `'whatsapp'` 추가 |
| `src/components/layout/Footer.tsx` | 소셜 링크에 WhatsApp 아이콘 추가 |

### WhatsApp 딥링크

```
https://wa.me/82279727773?text=Hello
```

- `wa.me/<국제번호(+없이)>` 형식
- 모바일: WhatsApp 앱 직접 실행
- PC: WhatsApp Web으로 이동
- 선택: `?text=` 파라미터로 기본 메시지 설정 가능

### 로케일별 버튼 순서 (변경 제안)

| 로케일 | 현재 순서 | 변경 후 |
|--------|-----------|---------|
| ko | kakao, phone, line, wechat | kakao, phone, whatsapp, line, wechat |
| en | phone, kakao, line, wechat | phone, whatsapp, kakao, line, wechat |
| ja | line, phone, kakao, wechat | line, phone, whatsapp, kakao, wechat |
| zh | wechat, phone, kakao, line | wechat, phone, whatsapp, kakao, line |

> WhatsApp은 영어권에서 2순위, 기타 언어에서 3순위로 배치

### 브랜드 컬러

- WhatsApp Green: `#25D366`
- Hover: `#1DA851`

## 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 병원 WhatsApp 번호 미확보 | 링크 동작 불가 | 번호 확인 필요 (기존 `02-797-2773`의 국제번호 사용 가능) |
| CTA 버튼 5개로 증가 → UI 혼잡 | UX 저하 | 로케일별 4개만 표시하는 옵션 검토 |

## 확인 완료 (2026-03-17)

1. **WhatsApp 번호**: `+82 10-6888-2773` (별도 번호)
2. **기본 메시지**: "안녕하세요, 리브성형외과입니다!" (로케일별 번역 적용)
3. **버튼 수**: 로케일별 4개만 표시 (5개 중 해당 로케일에 가장 관련 있는 4개 선택)
