/**
 * 홍콩·마카오(zh-HK·zh-MO)와 zh-Hant 브라우저를 번체 페이지(zh-TW)로 보내기 위한 Accept-Language 정리.
 *
 * next-intl 기본 언어 협상은 zh-HK를 간체 'zh'로 고른다
 * (2026-11-13 실측: Accept-Language "zh-HK,zh;q=0.9" → /pricing → /zh/pricing).
 * 홍콩·마카오는 번체를 쓰므로 협상 전에 이런 태그를 zh-TW로 바꿔 둔다.
 * zh-TW·zh-CN·zh-SG·zh-Hans·zh 와 다른 언어 태그, q 값은 그대로 둔다.
 */
const TRADITIONAL_CHINESE_TAG = /^zh-(?:hant(?:-[a-z0-9]+)*|hk|mo)$/i;

export function preferTraditionalChinese(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return acceptLanguage;

  let changed = false;
  const parts = acceptLanguage.split(',').map((part) => {
    const [rawTag, ...params] = part.split(';');
    if (!TRADITIONAL_CHINESE_TAG.test(rawTag.trim())) return part;
    changed = true;
    const leading = rawTag.match(/^\s*/)?.[0] ?? '';
    return [`${leading}zh-TW`, ...params].join(';');
  });

  return changed ? parts.join(',') : acceptLanguage;
}
