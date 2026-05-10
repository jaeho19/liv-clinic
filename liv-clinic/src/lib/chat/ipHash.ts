import 'server-only';
import { createHash } from 'crypto';

// IP 주소를 일별 salt로 해시하여 어뷰즈 추적용 식별자 생성.
// PII 위험 최소화: 평문 IP는 절대 저장하지 않음.

function getDailySalt(): string {
  // 환경변수 + 일자(KST)로 매일 다른 salt
  const base = process.env.CHAT_IP_HASH_SALT ?? 'liv-chat-default-salt-2026';
  const utcMs = Date.now();
  const kst = new Date(utcMs + 9 * 60 * 60 * 1000);
  const day = kst.toISOString().slice(0, 10);
  return `${base}:${day}`;
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const trimmed = ip.split(',')[0].trim();
  if (!trimmed) return null;
  return createHash('sha256').update(`${getDailySalt()}::${trimmed}`).digest('hex');
}

export function extractIp(headers: Headers): string | null {
  return (
    headers.get('x-forwarded-for') ??
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    null
  );
}
