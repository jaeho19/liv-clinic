# Gap Analysis: lifting-menu-rename-reorder

> Analysis Date: 2026-02-08

## Overall Match Rate: 100% (after fix)

```
[Plan] -> [Design] -> [Do] -> [Check 95%] -> [Act]
```

## Requirement Verification

| # | Requirement | Score | Status |
|---|-------------|:-----:|:------:|
| R1 | Rename display labels | 100% | PASS (fixed) |
| R2 | Reorder menu (aptos above thread) | 100% | PASS |
| R3 | i18n translations (ko/en/ja/zh) | 100% | PASS |
| R4 | TREATMENTS name/nameEn | 100% | PASS |
| R5 | MAIN_NAV label and order | 100% | PASS |
| R6 | URL unchanged (/lifting/aptos) | 100% | PASS |
| R7 | Build succeeds | 100% | PASS |

## Gaps Found

### [FIXED] Residual old name in event description

`constants.ts` EVENTS array `aptos-thread-lifting` description updated:
- Line ~1358 (ko): "APTOS 나미카" -> "APTOS 바이오 리프팅"
- Lines ~1359-1361 (en/ja/zh): "APTOS NAMICA" -> "APTOS Bio Lifting"

**Status**: Fixed during analysis phase. All branding now consistent.

### NAMICA Technology References (Correctly Retained)

The following NAMICA references describe the technology name and are correctly kept:
- `constants.ts` line 407: APTOS NAMICA technology description
- `constants.ts` line 409: NAMICA Technology feature title
- i18n `namicaIllustration`, `namicaSection` keys
- FAQ references to NAMICA technology

## Files Verified

| File | Changes Verified |
|------|-----------------|
| `Header.tsx` | Menu order: aptos at position 6, thread at 7 |
| `constants.ts` MAIN_NAV | Label + order updated |
| `constants.ts` TREATMENTS | name/nameEn updated |
| `ko.json` | nav.aptos + liftingPage name/fullName/CTA |
| `en.json` | nav.aptos + liftingPage name/fullName/CTA |
| `ja.json` | nav.aptos + liftingPage name/fullName/CTA |
| `zh.json` | nav.aptos + liftingPage name/fullName/CTA |
