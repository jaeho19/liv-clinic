"""
en.json -> vi.json / th.json / ru.json machine translation
- Source: en.json (English pivot)
- Target: vi, th, ru (selected via CLI arg)
- Preserves: ICU placeholders ({name}, {count, plural, ...}), URLs, brand terms
- Approach: deduplicate strings, translate unique set in batches, reconstruct
"""
import json
import re
import sys
import time
import io
from pathlib import Path
from deep_translator import GoogleTranslator

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ROOT = Path(r'C:\dev\LIV_homepage\liv-clinic\src\messages')
SRC = ROOT / 'en.json'

# Brand/proper-noun terms that must not be translated
BRAND_TERMS = {
    'LIV', 'HIFU', 'RF', 'CO2', 'FDA', 'KFDA', 'SMAS', 'MFU',
    'Ulthera', 'Ultherapy', 'Ulthera Prime', 'Shurink', 'Thermage',
    'Thermage FLX', 'InMode', 'Inmode', 'Density', 'Aptos',
    'Botox', 'Filler', 'Forma', 'Morpheus8', 'FaceTite',
    'Clarity', 'Clarity II', 'Potenza', 'Lukas', 'Ulblanc',
    'KakaoTalk', 'Naver', 'Instagram', 'YouTube', 'WeChat',
    'KST', 'WhatsApp', 'LINE', 'Q&A', 'CTO', 'Deno',
}


def should_skip(s: str) -> bool:
    """Strings that should not be translated."""
    s = s.strip()
    if not s:
        return True
    if len(s) < 2:
        return True
    # URLs / protocols
    if s.startswith(('http://', 'https://', 'tel:', 'mailto:', '/')):
        return True
    # Pure ASCII alphanumeric short codes
    if len(s) <= 12 and re.fullmatch(r'[A-Za-z0-9._-]+', s):
        return True
    # Brand-only
    if s in BRAND_TERMS:
        return True
    # Time formats / numbers
    if re.fullmatch(r'[\d:.\s\-+/]+', s):
        return True
    return False


# Protect ICU placeholders {name}, {count, plural, ...}, etc.
# Use a marker that translators won't mangle
PLACEHOLDER_RE = re.compile(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}')


def protect(s: str):
    placeholders = []
    def replace(m):
        placeholders.append(m.group(0))
        # Use uppercase ASCII marker that machine translators leave alone
        return f' XPH{len(placeholders)-1}X '
    protected = PLACEHOLDER_RE.sub(replace, s)
    return protected, placeholders


def restore(s: str, placeholders) -> str:
    for i, ph in enumerate(placeholders):
        # Match marker with optional surrounding whitespace
        s = re.sub(rf'\s*XPH{i}X\s*', ph, s, count=1)
    return s


def walk_collect(obj):
    """Walk JSON tree, yield all leaf strings as a flat list."""
    if isinstance(obj, dict):
        for v in obj.values():
            yield from walk_collect(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_collect(v)
    elif isinstance(obj, str):
        yield obj


def map_strings(obj, mapper):
    """Return new tree with all leaf strings transformed by mapper."""
    if isinstance(obj, dict):
        return {k: map_strings(v, mapper) for k, v in obj.items()}
    if isinstance(obj, list):
        return [map_strings(v, mapper) for v in obj]
    if isinstance(obj, str):
        return mapper(obj)
    return obj


def main(target: str):
    with open(SRC, 'r', encoding='utf-8') as f:
        en = json.load(f)

    # Collect unique strings
    all_strings = list(walk_collect(en))
    unique = list({s for s in all_strings if not should_skip(s)})
    print(f'[{target}] Unique translatable strings: {len(unique)} (out of {len(all_strings)} leaves)', flush=True)

    translator = GoogleTranslator(source='en', target=target)

    # Translate in batches
    BATCH = 50
    translation_map = {}
    failed = []
    t0 = time.time()
    for i in range(0, len(unique), BATCH):
        batch = unique[i:i+BATCH]
        # Protect placeholders
        protected_batch = []
        ph_lists = []
        for s in batch:
            p, phs = protect(s)
            protected_batch.append(p)
            ph_lists.append(phs)
        # Translate
        try:
            translated = translator.translate_batch(protected_batch)
        except Exception as e:
            print(f'[{target}] batch {i} error: {e}, retrying one-by-one', flush=True)
            translated = []
            for s in protected_batch:
                try:
                    translated.append(translator.translate(s))
                    time.sleep(0.5)
                except Exception as ee:
                    translated.append(None)
                    failed.append(s)
        # Restore placeholders, store
        for src, tgt, phs in zip(batch, translated, ph_lists):
            if tgt is None:
                translation_map[src] = src  # fallback to source
                continue
            translation_map[src] = restore(tgt, phs)

        elapsed = time.time() - t0
        done = min(i + BATCH, len(unique))
        rate = done / elapsed if elapsed > 0 else 0
        eta = (len(unique) - done) / rate if rate > 0 else 0
        print(f'[{target}] {done}/{len(unique)} ({100*done/len(unique):.1f}%) elapsed={elapsed:.0f}s rate={rate:.1f}/s eta={eta:.0f}s', flush=True)

    # Build target JSON
    def mapper(s: str) -> str:
        if should_skip(s):
            return s
        return translation_map.get(s, s)

    out = map_strings(en, mapper)
    out_path = ROOT / f'{target}.json'
    # Backup existing
    backup = ROOT / f'{target}.json.bak'
    if out_path.exists() and not backup.exists():
        backup.write_text(out_path.read_text(encoding='utf-8'), encoding='utf-8')
        print(f'[{target}] Backup saved to {backup.name}', flush=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'[{target}] Done. Failed: {len(failed)}', flush=True)


if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'vi'
    main(target)
