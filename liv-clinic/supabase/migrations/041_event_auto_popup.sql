-- ============================================
-- 041: 이벤트 발행 시 팝업 자동 생성
-- 설계: docs/superpowers/specs/2026-09-05-event-auto-popup-design.md
-- 전부 추가형·멱등. 기존 행은 auto_popup=false 라 트리거가 아무것도 바꾸지 않는다.
-- ============================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS auto_popup BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS event_id UUID NULL REFERENCES public.events(id) ON DELETE CASCADE;

-- 이벤트당 연동 팝업 하나
CREATE UNIQUE INDEX IF NOT EXISTS popups_event_id_uidx
  ON public.popups (event_id) WHERE event_id IS NOT NULL;

-- 이벤트 저장 → 연동 팝업 upsert. 호출자 권한(SECURITY INVOKER)으로 동작한다.
-- 이벤트를 쓰는 인증 관리자·service role 은 popups RLS 로 이미 쓰기가 가능하다.
CREATE OR REPLACE FUNCTION public.sync_event_popup()
RETURNS TRIGGER AS $$
DECLARE
  v_start TIMESTAMPTZ;
  v_end   TIMESTAMPTZ;
BEGIN
  -- 체크 해제 또는 포스터 없음 → 연동 팝업은 끄기만 한다(삭제하지 않음)
  IF NOT NEW.auto_popup OR NEW.poster_image IS NULL OR NEW.poster_image = '' THEN
    UPDATE public.popups
       SET is_active = false, updated_at = now()
     WHERE event_id = NEW.id AND is_active = true;
    RETURN NEW;
  END IF;

  -- 한국시간 기준 시작일 00:00:00 ~ 종료일 23:59:59
  v_start := (NEW.start_date::timestamp) AT TIME ZONE 'Asia/Seoul';
  v_end   := ((NEW.end_date + 1)::timestamp) AT TIME ZONE 'Asia/Seoul' - INTERVAL '1 second';

  INSERT INTO public.popups (
    event_id, title,
    image_url, image_url_en, image_url_ja, image_url_zh,
    link_url, link_target, display_start, display_end, is_active,
    width, show_on_mobile, sort_order, rolling_interval_ms
  ) VALUES (
    NEW.id, NEW.title_ko,
    NEW.poster_image, NEW.poster_image_en, NEW.poster_image_ja, NEW.poster_image_zh,
    '/ko/events/' || NEW.slug, '_self', v_start, v_end, NEW.is_published,
    480, true, 0, 5000
  )
  ON CONFLICT (event_id) WHERE event_id IS NOT NULL DO UPDATE SET
    title         = EXCLUDED.title,
    image_url     = EXCLUDED.image_url,
    image_url_en  = EXCLUDED.image_url_en,
    image_url_ja  = EXCLUDED.image_url_ja,
    image_url_zh  = EXCLUDED.image_url_zh,
    link_url      = EXCLUDED.link_url,
    link_target   = EXCLUDED.link_target,
    display_start = EXCLUDED.display_start,
    display_end   = EXCLUDED.display_end,
    is_active     = EXCLUDED.is_active,
    updated_at    = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_sync_popup ON public.events;
CREATE TRIGGER trg_events_sync_popup
  AFTER INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.sync_event_popup();
