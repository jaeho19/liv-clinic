"""
Pass 2: catch strings that were skipped in pass 1 by re-checking against en.json.
Approach: walk en.json + target.json in parallel. If target value EQUALS source en value
and looks translatable, translate it.
"""
import json
import re
import sys
import time
import io
from pathlib import Path
from deep_translator import GoogleTranslator

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = Path(r'C:\dev\LIV_homepage\liv-clinic\src\messages')

BRAND_TERMS = {
    'LIV', 'HIFU', 'RF', 'CO2', 'FDA', 'KFDA', 'SMAS', 'MFU',
    'Ulthera', 'Ultherapy', 'Shurink', 'Thermage', 'InMode', 'Inmode',
    'Density', 'Aptos', 'Botox', 'Filler', 'Forma', 'Morpheus8',
    'FaceTite', 'Clarity', 'Potenza', 'Lukas', 'Ulblanc',
    'KakaoTalk', 'Naver', 'Instagram', 'YouTube', 'WeChat',
    'KST', 'WhatsApp', 'LINE', 'CTO', 'PROC', 'DAO',
    'GHz', 'Hz', 'API', 'CSS', 'JS', 'HTML', 'PWA', 'SEO',
    'mm', 'cm', 'kg', 'mg', 'ml', 'KRW', 'USD', 'JPY', 'CNY',
    'BCP', 'TypeScript', 'JavaScript', 'NextJS',
    'Q&A', 'F.A.Q.', 'Inbody',
}

URL_PATTERN = re.compile(r'^(https?://|tel:|mailto:|/|#)')
NUMBER_PATTERN = re.compile(r'^[\d:.\s\-+/×x%]+$')
PLACEHOLDER_RE = re.compile(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}')


def should_skip(s: str) -> bool:
    s = s.strip()
    if not s or len(s) < 2:
        return True
    if URL_PATTERN.match(s):
        return True
    if NUMBER_PATTERN.match(s):
        return True
    if s in BRAND_TERMS:
        return True
    return False


def protect(s: str):
    placeholders = []
    def replace(m):
        placeholders.append(m.group(0))
        return f' XPH{len(placeholders)-1}X '
    protected = PLACEHOLDER_RE.sub(replace, s)
    return protected, placeholders


def restore(s: str, placeholders) -> str:
    for i, ph in enumerate(placeholders):
        s = re.sub(rf'\s*XPH{i}X\s*', f'__P{i}__', s, count=1)
    for i, ph in enumerate(placeholders):
        s = s.replace(f'__P{i}__', ph)
    return s


def fix_placeholder_spacing(s: str) -> str:
    if not isinstance(s, str):
        return s
    s = re.sub(r'(\S)(\{[A-Za-z_][A-Za-z0-9_]*\})', r'\1 \2', s)
    s = re.sub(r'(\{[A-Za-z_][A-Za-z0-9_]*\})(\S)', r'\1 \2', s)
    return s


def collect_untranslated(en_obj, tgt_obj, path=''):
    """Yield (path, en_value) where target equals source (un-translated)."""
    if isinstance(en_obj, dict):
        if isinstance(tgt_obj, dict):
            for k, v in en_obj.items():
                yield from collect_untranslated(v, tgt_obj.get(k), f'{path}.{k}' if path else k)
    elif isinstance(en_obj, list):
        if isinstance(tgt_obj, list):
            for i, v in enumerate(en_obj):
                tv = tgt_obj[i] if i < len(tgt_obj) else None
                yield from collect_untranslated(v, tv, f'{path}[{i}]')
    elif isinstance(en_obj, str):
        if isinstance(tgt_obj, str) and en_obj == tgt_obj and not should_skip(en_obj):
            yield path, en_obj


def map_strings(obj, mapper):
    if isinstance(obj, dict):
        return {k: map_strings(v, mapper) for k, v in obj.items()}
    if isinstance(obj, list):
        return [map_strings(v, mapper) for v in obj]
    if isinstance(obj, str):
        return mapper(obj)
    return obj


def main(target: str):
    target_path = ROOT / f'{target}.json'
    en_path = ROOT / 'en.json'

    with open(target_path, 'r', encoding='utf-8') as f:
        cur = json.load(f)
    with open(en_path, 'r', encoding='utf-8') as f:
        en = json.load(f)

    untranslated_pairs = list(collect_untranslated(en, cur))
    untranslated = list({v for _, v in untranslated_pairs})
    print(f'[{target}] Untranslated unique strings: {len(untranslated)} (occurrences: {len(untranslated_pairs)})', flush=True)

    if not untranslated:
        # Still apply placeholder spacing fix
        cur = map_strings(cur, fix_placeholder_spacing)
        with open(target_path, 'w', encoding='utf-8') as f:
            json.dump(cur, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'[{target}] No translations needed; applied placeholder spacing fix.', flush=True)
        return

    translator = GoogleTranslator(source='en', target=target)
    BATCH = 50
    translation_map = {}
    failed = []
    t0 = time.time()
    for i in range(0, len(untranslated), BATCH):
        batch = untranslated[i:i+BATCH]
        protected_batch = []
        ph_lists = []
        for s in batch:
            p, phs = protect(s)
            protected_batch.append(p)
            ph_lists.append(phs)
        try:
            translated = translator.translate_batch(protected_batch)
        except Exception as e:
            print(f'[{target}] batch {i} error: {e}, retrying one-by-one', flush=True)
            translated = []
            for s in protected_batch:
                try:
                    translated.append(translator.translate(s))
                    time.sleep(0.5)
                except Exception:
                    translated.append(None)
                    failed.append(s)
        for src, tgt, phs in zip(batch, translated, ph_lists):
            if tgt is None:
                translation_map[src] = src
                continue
            translation_map[src] = restore(tgt, phs)
        elapsed = time.time() - t0
        done = min(i + BATCH, len(untranslated))
        rate = done / elapsed if elapsed > 0 else 0
        eta = (len(untranslated) - done) / rate if rate > 0 else 0
        print(f'[{target}] {done}/{len(untranslated)} ({100*done/len(untranslated):.1f}%) elapsed={elapsed:.0f}s eta={eta:.0f}s', flush=True)

    # Apply translations - only update strings that match en source (still untranslated)
    untranslated_set = {s for _, s in untranslated_pairs}

    def map_with_en(en_val, cur_val):
        """Only update if cur_val equals en_val and we have a translation."""
        if isinstance(en_val, dict) and isinstance(cur_val, dict):
            return {k: map_with_en(en_val[k], cur_val.get(k, en_val[k])) for k in en_val}
        if isinstance(en_val, list) and isinstance(cur_val, list):
            return [map_with_en(en_val[i], cur_val[i] if i < len(cur_val) else en_val[i]) for i in range(len(en_val))]
        if isinstance(en_val, str):
            if isinstance(cur_val, str) and en_val == cur_val and en_val in translation_map:
                return translation_map[en_val]
            return cur_val if isinstance(cur_val, str) else en_val
        return cur_val

    out = map_with_en(en, cur)
    out = map_strings(out, fix_placeholder_spacing)

    with open(target_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'[{target}] Done. Failed: {len(failed)}', flush=True)


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'vi'
    main(target)
