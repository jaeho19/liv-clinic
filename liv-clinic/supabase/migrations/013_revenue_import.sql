-- 013: CSV 임포트 추적 필드 및 매핑 설정
-- operation_cases에 CSV 임포트 배치 추적 필드 추가
ALTER TABLE operation_cases
  ADD COLUMN IF NOT EXISTS import_batch_id TEXT,
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual';

COMMENT ON COLUMN operation_cases.import_batch_id IS 'CSV 일괄 업로드 배치 ID';
COMMENT ON COLUMN operation_cases.import_source IS '데이터 소스: manual | csv_import';

-- 중복 체크용 인덱스 (날짜+환자명+시술명)
CREATE INDEX IF NOT EXISTS idx_operation_cases_dedup
  ON operation_cases (created_at, patient_name, procedure_name);

-- CSV 매핑 설정 저장 (clinic_settings에 JSON으로)
ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS csv_column_mapping JSONB DEFAULT '{}';

COMMENT ON COLUMN clinic_settings.csv_column_mapping IS 'CRM CSV 컬럼 매핑 설정';
