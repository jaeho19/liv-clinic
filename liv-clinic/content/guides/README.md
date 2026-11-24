# 가이드·칼럼 원고

두 가지 글이 같은 형식·같은 경로(`/{언어}/guides/{slug}`)를 쓴다.

- **외국인 가이드** — `content/guides/{en|ja|zh|zh-TW}/{slug}.md`. slug는 4개 언어가 **같아야** hreflang이 묶인다.
- **한국어 칼럼** — `content/guides/ko/{slug}.md`. 국내 환자용이고 화면 이름은 「칼럼」이다(2026-11-24 추가). 아래 "한국어 칼럼 규칙"을 따른다.

## 한국어 칼럼 규칙

- **원장 감수 전에는 공개하지 않는다.** 초안은 `status: draft`, `reviewer: clinic`으로 쓴다. 원장이 읽고 고친 편만 `status: published` + `reviewer: dr-kim`으로 바꾼다. `reviewer: dr-kim` 없이 published면 빌드가 실패한다.
- 첫 편이 공개되기 전에는 허브(`/ko/guides`)가 색인되지 않고, 상단 메뉴 「의료정보 › 칼럼」과 푸터 링크도 나오지 않는다. 한 편이라도 공개되면 자동으로 켜진다.
- 글 모양: 제목은 질문, 첫 문단에서 바로 답, 소제목(`##`)도 질문, 표 1~2개, `## FAQ` 3~5개.
- 주제는 slug 하나에 질문 하나. slug는 영어 소문자·숫자·하이픈. 외국인 가이드와 같은 slug를 쓰면 그 글의 한국어판으로 묶이므로, 번역이 아니면 다른 slug를 쓴다.
- 의료광고 표현: 효과 보장·단정("확실히", "반드시", "부작용 없음"), 다른 병원과의 비교, 환자 체험담, 최상급("최고", "유일")을 쓰지 않는다. 효과·회복에는 "개인차"를 붙이고, 부작용·주의사항을 함께 적는다. 시술끼리 비교할 때는 우열이 아니라 차이로 쓴다.
- 가격을 적을 때는 "○○만 원부터", 기준 월("2026년 11월 가격표 기준"), "1회 기준·VAT 별도·상담 후 확정"을 함께 적고 `/pricing`으로 잇는다.
- 다른 칼럼으로 거는 링크는 그 칼럼이 published일 때만 건다(초안은 검색에 안 나가야 한다).
- 네이버 블로그 글을 그대로 옮기지 않는다(같은 글이 두 곳에 있으면 구글이 한쪽만 인정한다).

## 공통 형식

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
