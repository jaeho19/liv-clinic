# marketing-attribution — 설계 (Design)

> 계획: `docs/01-plan/features/marketing-attribution.plan.md` · 작성: 2026-08-18

## 1. 택소노미 (SSOT: `src/lib/inflow/taxonomy.ts`)

### 유입 채널 대분류 `ChannelCategory`
`app`(앱) · `naver_search`(네이버 검색) · `google_search`(구글 검색) · `naver_place`(네이버 플레이스) · `kakao_map`(카카오맵) · `instagram`(인스타그램) · `youtube`(유튜브) · `community`(카페·커뮤니티) · `foreign_sns`(해외 SNS) · `foreign_agency`(해외 대행사) · `referral`(지인 소개) · `walk_in`(워크인) · `homepage`(홈페이지) · `etc`(기타)
— 사용자 제시 목록 + 실데이터에서 필수로 확인된 `homepage` 추가. NULL = 미분류.

### 세부 채널 프리셋 (자유 입력 + 프리셋 제안)
- `app`: 강남언니 / 바비톡 / 캐시닥 / 여신티켓 / 당근
- `foreign_sns`: 위챗 / 샤오홍슈 / 더우인 / 왓츠앱 / 라인
- `foreign_agency`: 기존 데이터 대행사명(바이올렛 등) datalist
- 그 외 대분류: 자유 입력

### 시술 태그 `TreatmentTag` (복수 선택, text[])
사용자 제시 13종(`aptos` 압토스 · `ulthera` 울쎄라 · `thermage` 써마지 · `hilowave` 힐로우웨이브 · `lipolysis` 지방분해주사 · `potenza` 포텐자 · `rejuran` 리쥬란 · `juvelook` 주베룩 · `facelift` 안면거상 · `fat_reposition` 지방재배치 · `filler` 필러 · `botox` 보톡스 · `etc` 기타)
+ 실데이터 빈발 태그(`thread_lift` 실리프팅 · `skinbooster` 스킨부스터 · `inmode` 인모드 · `onda` 온다 · `density` 덴서티 · `shurink` 슈링크 · `lifting_etc` 리프팅(기기 미지정)). 자유 텍스트 `treatment` 컬럼은 병기 유지.

### 콘텐츠 플랫폼 / 유형 / 귀속
- 플랫폼: instagram / youtube_shorts / youtube / naver_blog / naver_cafe / xiaohongshu / douyin / etc
- 유형: reels / shorts / video / post / blog / live / etc
- 귀속(attribution): `direct` 직접(UTM·앱결제·전용링크·고객응답 확인) / `assisted` 보조(복수 채널 응답) / `inferred` 추정(시간적 연관성만) / `unknown` 출처 불명
- **게시일↔문의일 근접만으로 direct 지정 금지** — UI 기본값 `inferred`, direct는 근거 입력 권장(비고).

## 2. 자동 분류(표준화 검토) 파이프라인
```
기존 행(202) ──[classify.ts 규칙엔진]──▶ 후보 {channel_category, channel_detail, patient_origin, treatment_tags, confidence}
        ──▶ 검토 탭 UI(체크박스, 신뢰도 표시, 수정 가능) ──▶ 선택 행만 UPDATE + classified_at 기록
        ──▶ 불확실/미확인 행은 필드 NULL 유지(=미분류), '미분류로 확정' 액션도 classified_at만 기록
```
- 규칙: 대행사 존재→foreign_agency(high) · wechat→foreign_sns/위챗(high) · walk_in/website 직행(high) · naver→naver_search(medium) · note/treatment 내 앱·SNS 키워드(바비톡 등)→app(high) · kakao/phone 단서 없음→후보 없음
- origin: wechat_id/대행사/wechat→foreign(high), 그 외 국내 수단→domestic(medium, 반드시 사람 확인)
- **DB에는 관리자가 확인한 값만 기록**(추정치 자동 저장 금지 — 사용자 원칙 4).

## 3. 대시보드 (stats 탭 대체·상위 호환)
- **필터**: 기간(시작/종료 + 프리셋), 집계 단위(일/주/월), 국내외, 채널 대분류(복수), 세부 채널, 시술 태그, 단계(연락/예약/내원/결제), 취소·노쇼, 담당자, 결제 여부, 캠페인, 콘텐츠
- **KPI 카드**: 신규 연락 / 예약 / 내원 / 결제 건수 / 총 결제금액 / 연락→예약 / 예약→내원 / 내원→결제 전환율 / 취소·노쇼 — 분모 0이면 '–'
- **광고비 지표**(캠페인 spend_krw 있을 때만): CAC=광고비/신규연락, ROAS=연결 리드 결제액/광고비, 캠페인별 표. 광고비 없으면 **'데이터 없음'**(0 표기 금지)
- **차트**(기존 어드민 시각 언어인 CSS 막대/그리드 유지, 외부 차트 라이브러리 미도입): 기간별 4계열 추이, 채널별 비교, 시술별 문의, 국내·해외 도넛(CSS), 퍼널(연락→예약→내원→결제), 캠페인 전후 비교(캠페인 기간 음영)
- **상세 목록**: 필터 결과 표(정렬/검색/페이지네이션/CSV BOM 내보내기/행 수정 모달 재사용/누락 필드 배지). PII는 이름 마스킹 없이 관리자 화면이나, **통계 카드·차트에는 개인 식별정보 미노출**
- 집계는 전량 클라이언트(현행 패턴 유지, 5,000행 로드 상한 동일)

## 4. `/admin/marketing` (게시기록)
- 탭 1 게시기록: 표(게시일/플랫폼/유형/제목/링크/캠페인/코드/담당자/지표 5종/연결 문의 수/비고) + 생성·수정 모달. 지표 미입력 = '–'(데이터 없음)
- 탭 2 캠페인: 표(이름/코드/채널/기간/광고비/활성) + 모달. 광고비는 선택 입력
- 리드 연결: inflow 수정 모달에 콘텐츠 연결 편집기(콘텐츠 선택 + 귀속 4단계) — `lead_content_links`
- 사이드바 '홈페이지 관리' 그룹에 '마케팅 콘텐츠' 항목 추가(기존 항목 이동 없음)

## 5. UTM
- `src/lib/utm.ts`: 랜딩 시 `utm_source/medium/campaign/content` sessionStorage 첫 터치 저장(30일 만료 없음 — 세션 한정), 폼 제출 시 첨부
- 3개 상담 API의 zod에 optional utm 4필드 → `consultation_requests` 신규 컬럼 저장
- 홈 상담 링크에 UTM 자동 부착은 하지 않음(내부 이동에 UTM 오염 방지) — 외부 게시물용 URL 생성기는 마케팅 페이지에서 제공(콘텐츠 코드 기반 `?utm_source=...&utm_campaign=...&utm_content=...` 복사 버튼)

## 6. 홈페이지 정보구조
새 렌더 순서(`[locale]/page.tsx`):
1. HomeFirstVisitSlimBanner + Hero(핵심 메시지·CTA) → 2. CoreValues(선택 근거) → 3. **ConcernPathways(신규: 고민별 진입 5카드 + 국내/해외 경로 2카드)** → 4. Signature(대표 프로그램) → 5. Doctor(전문성·학술) → 6. Reviews(후기) → 7. MediaNews(의료정보·미디어) → 8. **Equipment(장비 — 하단 이동, '전체 장비 보기'→/about/equipment 링크 추가)** → 9. Location(위치·상담)
- 섹션 배경 교대 유지 위해 이동 섹션의 배경 클래스만 최소 조정(콘텐츠 무변경)
- ConcernPathways 카드: 처진 얼굴·턱선→`/lifting/aptos` · 수술 없이 탄력→`/lifting` · 근본적 처짐(안면거상)→`/contact` · 눈밑 노화(지방재배치)→`/contact` · 피부결·모공·재생→`/antiaging/skinbooster` (안면거상·지방재배치는 상세 페이지 부재로 상담 연결 — 페이지 신설은 사람 결정 사항으로 보고)
- 연령 직접 표기 없이 고민 중심 카피. **'최고/유일/완벽/부작용 없음/보장' 등 금지 표현 사용 안 함**. 후기·전후사진·효과 표현 의료광고 사전심의 필요 주석을 코드/문서에 명시
- 국내/해외 경로: 국내→`/contact`(안티에이징·리프팅 상담), 해외→`/international`

## 7. 이벤트 계측 (기존 SSOT `analytics-events.ts` 재사용)
| 위치 | 함수(기존/확장) | GA 이벤트·파라미터 |
|---|---|---|
| Hero CTA | `trackCTAClick('hero_cta')` (기존 정의 배선) | cta_click/hero_cta ≒ hero_consult_click |
| ConcernPathways 카드 | `trackConcernCard(id, target)` (신규) | concern_card_click |
| 해외 경로 카드 | `trackCTAClick('foreign_patient')` (타입 확장) | ≒ foreign_patient_click |
| 압토스 카드/링크 | concern id=`sagging` target=`/lifting/aptos` | ≒ aptos_detail_click |
| Equipment 카드·전체보기 | `trackEquipmentView(name)` (기존 정의 배선) | equipment_view |
| Signature 카드 | `trackCTAClick('signature_card')` (타입 확장) | ≒ lifting_consult_click |
| Doctor CTA·유튜브 | `trackDoctorView()`·`trackSocialClick('youtube')` (배선) | |
| MediaNews 카드/더보기 | `trackContentClick('media', id)` (신규) | ≒ blog_content_click |
| Reviews 링크 | `trackContentClick('review', ...)` | ≒ review_click |
| Location 길찾기 | `trackDirections(provider)` (배선) | |
| Header/Footer 상담 | `trackCTAClick('header_consult'/'footer_cta')` (배선) | |

## 8. i18n
`sections.concerns.*`(title/subtitle/cards 5×{title,desc,cta}/paths 2×{title,desc,cta}) + `sections.equipment.viewAll` — ko 작성 후 11개 로케일 파일에 **바이트 보존 삽입**(EOL 유지), `verify:i18n` 게이트 통과 필수.

## 9. 마이그레이션·롤백
- 적용: `supabase/migrations/038_marketing_attribution.sql` (전부 additive; `IF NOT EXISTS` 멱등) — 로컬 pg 스크립트로 적용(기존 `scripts/migrate_manual.js` 패턴)
- 롤백: `docs/migrations/038-marketing-attribution.md`에 역순 DROP 스크립트 명시. 롤백 시 신규 컬럼·테이블에 입력된 데이터는 소실됨을 문서화
- 배포 코드 호환성: 신규 컬럼 전부 NULL/DEFAULT — 배포 중인 프론트 코드는 영향 없음

## 10. 테스트 전략
- vitest(node): `classify`(규칙·신뢰도·미분류 처리), `stats`(필터·KPI·전환율 분모0·기간 버킷·퍼널·전후 비교), `csv`(BOM·이스케이프·신규 컬럼), `utm`(파싱·화이트리스트)
- 스모크: dev 서버에서 홈(ko/en) 렌더·순서 확인, admin은 로그인 화면까지(자격증명 부재 — 한계로 보고)
