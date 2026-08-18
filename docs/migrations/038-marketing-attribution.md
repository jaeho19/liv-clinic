# 038_marketing_attribution — 적용/롤백 가이드

> **후속**: `039_consultation_inflow_link.sql`(2026-08-18 적용 완료)이 `inflow_leads.consultation_id`
> UNIQUE FK를 추가한다 — 홈페이지 상담 폼 → 유입 통계 자동 연동의 중복 방지 링크.
> 롤백: `ALTER TABLE inflow_leads DROP COLUMN IF EXISTS consultation_id;`

> 마이그레이션 파일: `liv-clinic/supabase/migrations/038_marketing_attribution.sql`
> 성격: **전부 추가형(additive)·멱등** — 기존 컬럼/행/배포 중인 코드에 영향 없음.

## 적용 방법

방법 A — Supabase 대시보드 > SQL Editor에서 위 파일 내용 실행.

방법 B — 로컬 스크립트(이 PC는 TLS 프록시 뒤라 `ssl.rejectUnauthorized=false` 필요):

```bash
cd D:\dev\LIV_homepage\liv-clinic
node ../scripts/apply-migration-038.mjs   # DATABASE_URL은 .env.local에서 읽음
```

적용 확인:

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'inflow_leads' AND column_name IN
 ('patient_origin','channel_category','channel_detail','treatment_tags','paid',
  'paid_date','paid_amount_krw','outcome','campaign_id','manager','classified_at');
SELECT tablename FROM pg_tables WHERE tablename IN
 ('marketing_campaigns','marketing_contents','lead_content_links');
```

## 변경 내용 요약

| 대상 | 변경 |
|---|---|
| `inflow_leads` | 컬럼 11개 추가: `patient_origin`(domestic/foreign), `channel_category`, `channel_detail`, `treatment_tags`(text[]), `paid`, `paid_date`, `paid_amount_krw`, `outcome`(cancelled/no_show), `campaign_id`(FK), `manager`, `classified_at` |
| `consultation_requests` | 컬럼 4개 추가: `utm_source/medium/campaign/content` |
| 신규 테이블 | `marketing_campaigns`(광고비 `spend_krw`는 NULL 허용 = 데이터 없음), `marketing_contents`(지표 5종 NULL 허용), `lead_content_links`(귀속 direct/assisted/inferred/unknown) |
| RLS | 신규 테이블 3종에 `inflow_leads`와 동일한 authenticated 전용 정책 |
| 트리거 | 신규 테이블 2종에 기존 `update_updated_at_column()` 재사용 |

## 롤백

⚠️ 롤백하면 **신규 컬럼·테이블에 입력된 데이터가 소실**된다. 기존 컬럼·데이터는 영향 없음.

```sql
-- 역순 제거
DROP TABLE IF EXISTS lead_content_links;

ALTER TABLE inflow_leads
  DROP COLUMN IF EXISTS classified_at,
  DROP COLUMN IF EXISTS manager,
  DROP COLUMN IF EXISTS campaign_id,
  DROP COLUMN IF EXISTS outcome,
  DROP COLUMN IF EXISTS paid_amount_krw,
  DROP COLUMN IF EXISTS paid_date,
  DROP COLUMN IF EXISTS paid,
  DROP COLUMN IF EXISTS treatment_tags,
  DROP COLUMN IF EXISTS channel_detail,
  DROP COLUMN IF EXISTS channel_category,
  DROP COLUMN IF EXISTS patient_origin;

ALTER TABLE consultation_requests
  DROP COLUMN IF EXISTS utm_content,
  DROP COLUMN IF EXISTS utm_campaign,
  DROP COLUMN IF EXISTS utm_medium,
  DROP COLUMN IF EXISTS utm_source;

DROP TABLE IF EXISTS marketing_contents;
DROP TABLE IF EXISTS marketing_campaigns;
-- 인덱스·트리거·RLS 정책은 컬럼/테이블 DROP과 함께 제거됨
```

롤백 후에는 이 기능이 추가한 프론트 코드(관리자 대시보드 확장, `/admin/marketing`, UTM 저장)도 함께 되돌려야 한다 — 해당 코드는 컬럼 부재 시 조회 오류가 난다.

## 데이터 원칙 (운영 합의)

- 과거 행의 표준화 필드는 **자동으로 채우지 않는다**. `/admin/inflow`의 "표준화 검토" 탭에서
  규칙 기반 후보를 관리자가 확인한 것만 반영되고, 불확실한 행은 미분류(NULL)로 남긴다.
- `spend_krw`·콘텐츠 지표가 NULL이면 화면에는 0이 아니라 **'데이터 없음'**으로 표시한다.
- CAC/ROAS는 광고비가 입력된 캠페인에 한해 계산한다.
