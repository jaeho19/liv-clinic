# 가이드·칼럼 원고

두 가지 글이 같은 형식·같은 경로(`/{언어}/guides/{slug}`)를 쓴다.

- **외국인 가이드** — `content/guides/{en|ja|zh|zh-TW}/{slug}.md`. slug는 4개 언어가 **같아야** hreflang이 묶인다.
- **한국어 칼럼** — `content/guides/ko/{slug}.md`. 국내 환자용이고 화면 이름은 「칼럼」이다(2026-11-24 추가). 아래 "한국어 칼럼 규칙"을 따른다.

## 한국어 칼럼 규칙

- **원장 감수 전에는 공개하지 않는다.** 초안은 `status: draft`, `reviewer: clinic`으로 쓴다. 원장이 읽고 고친 편만 `status: published` + `reviewer: dr-kim`으로 바꾼다. `reviewer: dr-kim` 없이 published면 빌드가 실패한다.
- **칼럼은 김수영 대표원장 이름으로 나간다**(2026-11-24 결정). 글 머리와 목록 카드에는 「글 김수영 대표원장 (성형외과 전문의)」만 적고(이름은 의료진 소개로 이어진다) **수정일·읽는 시간은 화면에 적지 않는다.** 원장 이름으로 나가는 글이므로 위의 감수 규칙은 그대로 지킨다. 외국인 가이드는 전과 같이 수정일·읽는 시간·병원 이름을 적는다(`src/lib/guides/byline.ts`).
- 공개할 때 frontmatter에 `published: YYYY-MM-DD`(처음 공개한 날)를 넣는다. 화면에는 안 나오고 검색·AI가 읽는 정보(구조화 데이터의 공개일)에만 쓰인다. 내용을 고치면 `updated`만 바꾼다.
- 첫 편이 공개되기 전에는 허브(`/ko/guides`)가 색인되지 않고, 상단 메뉴 「의료정보 › 칼럼」과 푸터 링크도 나오지 않는다. 한 편이라도 공개되면 자동으로 켜진다.
- 글 모양: 제목은 질문, 첫 문단에서 바로 답, 소제목(`##`)도 질문, 표 1~2개, `## FAQ` 3~5개.
- 주제는 slug 하나에 질문 하나. slug는 영어 소문자·숫자·하이픈. 외국인 가이드와 같은 slug를 쓰면 그 글의 한국어판으로 묶이므로, 번역이 아니면 다른 slug를 쓴다.
- 의료광고 표현: 효과 보장·단정("확실히", "반드시", "부작용 없음"), 다른 병원과의 비교, 환자 체험담, 최상급("최고", "유일")을 쓰지 않는다. 효과·회복에는 "개인차"를 붙이고, 부작용·주의사항을 함께 적는다. 시술끼리 비교할 때는 우열이 아니라 차이로 쓴다.
- 가격을 적을 때는 "○○만 원부터", 기준 월("2026년 11월 가격표 기준"), "1회 기준·VAT 별도·상담 후 확정"을 함께 적고 `/pricing`으로 잇는다.
- 다른 칼럼으로 거는 링크는 그 칼럼이 published일 때만 건다(초안은 검색에 안 나가야 한다).
- 네이버 블로그 글을 그대로 옮기지 않는다(같은 글이 두 곳에 있으면 구글이 한쪽만 인정한다).

### 검색·AI 검색에 잡히게 해 둔 것

칼럼을 `published`로 바꾸면 아래가 자동으로 따라온다. 따로 손댈 것은 맨 아래 한 줄뿐이다.

- **AI 검색용 안내 파일** `public/llms.txt`: 「칼럼」 구역에 제목·주소·설명이 올라간다(`npm run build:guides`가 `columns:start`~`columns:end` 표식 사이를 채운다 — 손으로 고치지 않는다).
- **구조화 데이터**(`src/lib/guides/schema.ts`): 글(Article)의 저자 = 원장(의료진 소개의 상세 정보와 같은 `@id`), 공개일·수정일, 의료 정보 페이지(MedicalWebPage)의 검수자·검수일, 자주 묻는 질문(FAQPage). 화면에서 뺀 날짜도 여기에는 남는다.
- **공유 메타**: 글 종류(article), 저자, 공개·수정 시각.
- **사이트맵·메뉴·허브**: 첫 편이 공개되면 켜진다. `robots.txt`는 검색 로봇과 AI 로봇(OAI-SearchBot·ChatGPT-User·Claude-SearchBot·PerplexityBot·GPTBot·ClaudeBot·Google-Extended 등)을 이미 허용한다(`src/app/robots.ts`).
- 배포한 뒤 `node scripts/indexnow-submit.mjs <새 칼럼 주소> https://liv-clinic.net/ko/guides`로 새 주소를 알린다(Bing·네이버 등에 전달된다. Bing 색인은 Copilot과 ChatGPT 검색이 함께 쓴다).

## 이미지

- 파일은 전부 `public/images/guides/`에 **1600×900(16:9) WebP**로 둔다. 파일 이름은 영어 소문자·숫자·하이픈. 원고가 가리키는 파일이 없으면 빌드가 실패한다.
- **대표 사진**: frontmatter에 `cover: /images/guides/파일.webp`와 `coverAlt: 사진 설명`(필수). 글 머리, 목록 카드, 공유 이미지(og:image)에 쓰인다.
- **본문 그림**: 한 줄을 통째로 `![그림 설명](/images/guides/파일.webp "캡션")`. 그림 설명(대체 글)은 필수이고 그림 속 숫자를 글로도 적는다. FAQ 답 안에서는 쓸 수 없다.
- 대표 사진은 **글의 시술·장비·부위가 바로 보이는 사진**으로 한다. 분위기만 내는 정물 사진은 쓰지 않는다(2026-11-24에 "글과 관련 없는 사진"으로 반려됨).
  - 먼저 홈페이지에 이미 있는 사진을 쓴다: 장비 비교 글은 장비 소개 페이지의 사진 두 장을 나란히, 시술 글은 그 시술 페이지의 사진. 만드는 법은 `scripts/build-guide-covers.mjs`(사진에서 자르기 · 장비 두 대 나란히)에 글마다 적어 두고 `node scripts/build-guide-covers.mjs`로 다시 만든다.
  - 맞는 사진이 없을 때만 새로 만든다(Higgsfield `gpt_image_2_6`, 16:9, 2k). 원본은 `_figures/sources/`에 둔다. **전후 비교처럼 결과를 주장하는 그림, 실제와 다른 장비 모습, 글자는 만들지 않는다.** 장비 사진은 모양을 새로 그리는 업스케일도 쓰지 않는다.
  - PC 화면에서는 대표 사진이 21:9 띠로 잘린다(위아래 12%씩). 얼굴·장비는 가운데 높이 76% 안에 둔다.
  - 고르기 전에 후보를 먼저 보여 주고 정한다.
- **움직이는 대표 사진(선택)**: frontmatter에 `coverVideo: /images/guides/파일.mp4`를 더하면 글 머리에서 사진 위에 소리 없는 반복 영상이 재생된다. 목록 카드와 공유 이미지는 사진 그대로다. 움직임 줄이기·데이터 절약 모드에서는 사진만 보인다.
  - 규격: 1280×720, H.264(yuv420p), 소리 없음, 5~10초, 처음과 끝이 이어지는 반복, 1MB 안팎. 첫 장면은 대표 사진과 같아야 한다.
  - 만든 사진·그림은 Higgsfield로 움직인다(시작 장면과 끝 장면에 같은 사진을 넣으면 끊김 없이 반복된다). 장비 모양이나 글자가 바뀌어 나오면 쓰지 않는다.
  - **실제 사람이 찍힌 사진은 AI로 움직이지 않는다.** ffmpeg로 천천히 확대했다 돌아오는 효과만 준다.
- 숫자·층 구조가 들어가는 **설명 그림은 생성하지 않고 코드로 그린다**: 원본은 `_figures/figures.html`(그림 하나 = `<svg id="fig-…">` 1600×900, 브랜드 글꼴). 숫자는 홈페이지에 적힌 값만 쓴다. 휴대폰에서는 가로 약 360px로 줄어드니 글자는 44px 아래로 내리지 않는다.
- 그림 만드는 법: liv-clinic 폴더를 루트로 정적 서버를 띄워 `/content/guides/_figures/figures.html`을 열고(글꼴이 `/public/fonts/…`에서 온다) 각 `<svg>`를 1600×900 PNG로 찍은 뒤 sharp로 WebP(품질 92)로 바꾼다. 사진은 품질 82.
- 원장 답으로 숫자가 바뀌면 `figures.html`을 고쳐 다시 찍는다(그림 속 숫자와 본문 표가 어긋나면 안 된다).

## 공통 형식

- `_`로 시작하는 파일·폴더는 컴파일하지 않는다(`_facts.md`, `_example.md`, `_figures/`).
- 빌드 전 `npm run build:guides`가 `src/lib/guides/guides.generated.ts`를 만든다(커밋한다).
- frontmatter 필수: `title`, `description`, `keywords`(목록), `category`(price|booking|comparison|aftercare|treatment), `status`(draft|published), `updated`(YYYY-MM-DD), `reviewer`(clinic|dr-kim). 선택: `treatment`(예: /lifting/ulthera), `cover`·`coverAlt`·`coverVideo`(위 "이미지").
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
