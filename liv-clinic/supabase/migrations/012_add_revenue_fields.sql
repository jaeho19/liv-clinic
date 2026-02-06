-- 012: operation_cases에 결제/매출 필드 추가
ALTER TABLE operation_cases
  ADD COLUMN IF NOT EXISTS price_krw BIGINT,
  ADD COLUMN IF NOT EXISTS discount_krw BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('CARD', 'CASH', 'TRANSFER', 'MIXED')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'REFUNDED'));
