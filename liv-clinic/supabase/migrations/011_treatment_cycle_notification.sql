-- 011: 시술 주기 자동 알림 시스템
-- treatment_masters에 시술별 기본 알림 주기 추가

ALTER TABLE treatment_masters
  ADD COLUMN IF NOT EXISTS default_cycle_days INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notification_template_id UUID REFERENCES notification_templates(id);

COMMENT ON COLUMN treatment_masters.default_cycle_days IS '시술별 기본 재방문 알림 주기 (일 수)';
COMMENT ON COLUMN treatment_masters.notification_template_id IS '시술별 기본 알림 템플릿 FK';

-- notification_history에 발송 결과 상세 필드 추가
ALTER TABLE notification_history
  ADD COLUMN IF NOT EXISTS solapi_message_id TEXT,
  ADD COLUMN IF NOT EXISTS solapi_status TEXT,
  ADD COLUMN IF NOT EXISTS fallback_channel TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN notification_history.solapi_message_id IS 'Solapi API 응답 메시지 ID';
COMMENT ON COLUMN notification_history.solapi_status IS 'Solapi 발송 결과 상태';
COMMENT ON COLUMN notification_history.fallback_channel IS '폴백 채널 (kakao 실패 시 sms)';

-- patient_treatments에 자동/수동 구분 필드
ALTER TABLE patient_treatments
  ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT true;

COMMENT ON COLUMN patient_treatments.auto_send IS 'true=자동발송 대상, false=수동만';

-- 자동 발송 대상 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_patient_treatments_pending_notification
  ON patient_treatments (next_notification_at)
  WHERE notification_sent = false AND next_notification_at IS NOT NULL;
