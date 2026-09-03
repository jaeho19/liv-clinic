-- ============================================
-- 040: Slack 환자별 채널(방) + 담당 + 완료 + 미응답 확대 알림 + 자동 첫 안내
-- 설계: docs/superpowers/specs/2026-09-03-slack-patient-rooms-design.md §5
-- 전부 추가형·멱등. 기존 컬럼/정책/publication 무변경.
-- ============================================
-- 040: Slack 환자별 채널(방) + 담당 + 완료 + 미응답 확대 알림
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS slack_mode             TEXT NULL
    CHECK (slack_mode IS NULL OR slack_mode IN ('room', 'thread')),
  ADD COLUMN IF NOT EXISTS slack_room_name        TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_slack_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_label         TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_at            TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS resolved_at            TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS resolved_label         TEXT NULL,
  ADD COLUMN IF NOT EXISTS awaiting_since         TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS escalation_level       SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_ack_at            TIMESTAMPTZ NULL;

-- 기존 세션: 스레드가 있으면 thread 모드로 고정 (새 방을 만들지 않는다)
UPDATE public.chat_sessions SET slack_mode = 'thread'
 WHERE slack_mode IS NULL AND slack_thread_ts IS NOT NULL;
-- awaiting_since는 백필하지 않는다 — 오래 방치된 세션이 배포 직후 한꺼번에 🚨를 울리는 것을 막는다.

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS slack_user_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS sender_label  TEXT NULL,
  ADD COLUMN IF NOT EXISTS source        TEXT NOT NULL DEFAULT 'app'
    CHECK (source IN ('app', 'slack', 'auto'));   -- auto = 자동 첫 안내 (§4.10)

-- 방 → 세션 역조회 (인바운드 주 경로)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_slack_room
  ON public.chat_sessions (slack_channel_id)
  WHERE slack_mode = 'room';

-- 확대 알림 대상 (크론이 이 인덱스 1회 조회로 끝난다)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_escalation
  ON public.chat_sessions (awaiting_since)
  WHERE status = 'open' AND resolved_at IS NULL AND awaiting_since IS NOT NULL AND escalation_level < 3;

-- 관리자 목록 탭 (진행 중 / 완료)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_open_resolved
  ON public.chat_sessions (resolved_at, last_message_at DESC)
  WHERE status = 'open';

-- 메시지 INSERT 트리거 확장 (028의 함수를 교체. UPDATE 횟수는 그대로 1회 — 030 REPLICA IDENTITY FULL 비용 불변)
CREATE OR REPLACE FUNCTION public.fn_chat_after_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET
    last_message_at = NEW.created_at,
    updated_at      = NEW.created_at,
    -- 자동 첫 안내(source='auto')는 "답변"이 아니다 — 미응답 카운트·대기 시계를 건드리지 않는다 (§4.10)
    unread_admin_count = CASE
      WHEN NEW.sender = 'visitor'  THEN unread_admin_count + 1
      WHEN NEW.sender = 'operator' AND NEW.source <> 'auto' THEN 0
      ELSE unread_admin_count END,
    -- 손님 메시지: 답 대기 시작(이미 기다리는 중이면 유지). 직원 메시지: 시계 정지 + 단계 초기화
    awaiting_since = CASE
      WHEN NEW.sender = 'visitor'  THEN COALESCE(awaiting_since, NEW.created_at)
      WHEN NEW.sender = 'operator' AND NEW.source <> 'auto' THEN NULL
      ELSE awaiting_since END,
    escalation_level = CASE
      WHEN NEW.sender = 'operator' AND NEW.source <> 'auto' THEN 0
      ELSE escalation_level END,
    -- 손님 재발신: 완료 자동 해제 (앱 코드가 잊어도 정합성 유지)
    resolved_at    = CASE WHEN NEW.sender = 'visitor' THEN NULL ELSE resolved_at END,
    resolved_label = CASE WHEN NEW.sender = 'visitor' THEN NULL ELSE resolved_label END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN public.chat_sessions.slack_mode IS
  'room = 세션 전용 비공개 채널(slack_channel_id). thread = #해외문의 스레드(slack_thread_ts). NULL = 아직 Slack에 안 올라감';
COMMENT ON COLUMN public.chat_sessions.awaiting_since IS
  '직원 답을 기다리기 시작한 시각. 직원 메시지 INSERT 시 NULL. 미응답 확대 알림의 기준';
COMMENT ON COLUMN public.chat_sessions.assigned_slack_user_id IS
  '담당 직원 Slack user id. 가장 최근에 Slack에서 답한 답변 직원(관찰자 제외). users:read 없이 <@U…> 멘션으로 표시';
COMMENT ON COLUMN public.chat_sessions.auto_ack_at IS
  '자동 첫 안내를 마지막으로 보낸 시각. awaiting_since보다 이전이면 새 대기 구간 → 다시 보낸다';
