/**
 * 글자를 클립보드에 복사한다 (브라우저 전용). 실패하면 false — 손님은 글자를 길게 눌러 직접 복사할 수 있다.
 * Clipboard API 를 쓸 수 없는 환경(일부 인앱 브라우저·http)에서는 임시 textarea 로 대신한다.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  } catch {
    return false;
  }
}
