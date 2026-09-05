# 외국인 가이드 원고 (P1-1)

- 경로: `content/guides/{en|ja|zh|zh-TW}/{slug}.md` — slug는 4개 언어가 **같아야** hreflang이 묶인다.
- `_`로 시작하는 파일은 컴파일하지 않는다(`_facts.md`, `_example.md`).
- 빌드 전 `npm run build:guides`가 `src/lib/guides/guides.generated.ts`를 만든다(커밋한다).
- frontmatter 필수: `title`, `description`, `keywords`(목록), `category`(price|booking|comparison|aftercare|treatment), `status`(draft|published), `updated`(YYYY-MM-DD), `reviewer`(clinic|dr-kim). 선택: `treatment`(예: /lifting/ulthera).
- `status: draft` = 직접 URL로만 열림(noindex, 허브·사이트맵·hreflang 제외, 화면 상단 "검수 중" 띠). 검수가 끝나면 `published`로 바꾼다.
- 사이트에 근거가 없는 의료적 수치는 쓰지 말고 `[검수 필요: 무엇을 확인해야 하는지]`를 남긴다. published에 표식이 남으면 빌드가 실패한다.
- 본문 문법: `##` 절, `###` 소절, 문단, `- ` 목록, `1. ` 목록, `| a | b |` 표(둘째 줄 `|---|`), `> ` 안내문, `**굵게**`, `[텍스트](/경로)`. 내부 링크는 로케일 접두 없이 쓴다(렌더 시 붙는다).
- `## FAQ` 아래 `### 질문` + 답 문단은 FAQPage 스키마로 나간다. 3~6개.
- 근거 시트: `_facts.md`(`npx tsx scripts/dump-guide-facts.mjs`로 생성). 여기에 없는 가격·시간·자격은 쓰지 않는다.
- `reviewer: dr-kim`은 원장이 실제로 검수한 편에만 켠다(기본 clinic).

## 예시 (`_example.md`)

```markdown
---
title: "Ultherapy in Seoul: 2026 price guide"
description: What Ultherapy Prime costs at LIV in Sinsa, what is included, and how to fit it into a short trip.
keywords:
  - ultherapy korea price
  - ultherapy seoul cost
category: price
status: draft
updated: 2026-09-06
reviewer: clinic
treatment: /lifting/ulthera
---

Intro paragraph. Link like [the price list](/pricing).

## Prices

| Area | Shots | Price |
|---|---|---|
| Upper face | 200–300 | KRW 780,000~ |

> Prices are per session and exclude VAT. [검수 필요: 비행 가능 시점 — 사이트에 근거 없음]

## FAQ

### Do international patients pay more?

No. The same price list applies.
```
