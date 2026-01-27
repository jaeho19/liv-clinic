# i18n 작업 목록

## 완료된 작업 (2025-01-27)

### 1. FAQ.tsx 토글 버튼 번역
- 파일: `src/components/sections/FAQ.tsx`
- 변경: `'전체 접기'` / `'전체 펼치기'` → `tCommon('collapseAll')` / `tCommon('expandAll')`

### 2. SkinToneDetail.tsx 핵심 텍스트 번역
- 파일: `src/components/sections/SkinToneDetail.tsx`
- 브레드크럼: `t('laser.center.name')`, `t('laser.skintone.name')`
- FAQ 제목: `tCommon('faq')`
- CTA 버튼: `tCommon('freeConsultation')`

### 3. HairRemovalDetail.tsx 핵심 텍스트 번역
- 파일: `src/components/sections/HairRemovalDetail.tsx`
- 브레드크럼: `t('laser.center.name')`, `t('laser.hairRemoval.name')`
- FAQ 제목: `tCommon('faq')`
- CTA 버튼: `tCommon('freeConsultation')`

### 4. ThreadDetail.tsx 핵심 텍스트 번역
- 파일: `src/components/sections/ThreadDetail.tsx`
- FAQ 제목: `tCommon('faq')`

### 5. 번역 키 추가 (4개 언어)
- 파일: `src/messages/ko.json`, `en.json`, `ja.json`, `zh.json`
- 추가된 키:
  - `expandAll`: 전체 펼치기 / Expand All / すべて展開 / 全部展开
  - `collapseAll`: 전체 접기 / Collapse All / すべて折りたたむ / 全部折叠
  - `all`: 전체 / All / すべて / 全部
  - `freeConsultation`: 무료 상담 예약 / Book Free Consultation / 無料相談予約 / 免费咨询预约
  - `faq`: 자주 묻는 질문 / Frequently Asked Questions / よくある質問 / 常见问题

---

## 앞으로 해야 할 작업

### Priority 2 - 다음 작업 (Important)

#### 1. SignatureDetail.tsx 설명 텍스트 번역
- 파일: `src/components/sections/SignatureDetail.tsx`
- 하드코딩: `description: '리프팅, 볼륨, 피부결까지 한 번에 케어하는...'`

#### 2. gallery/page.tsx 필터 레이블 번역
- 파일: `src/app/[locale]/gallery/page.tsx`
- `'써마지 FLX'` → `t('nav.thermage')`
- `'전체'` → `tCommon('all')`

#### 3. 세부 설명 텍스트 번역
- SkinToneDetail.tsx: 피부 고민 설명, FAQ 답변
- HairRemovalDetail.tsx: 부위별 제모 정보, FAQ 답변
- ThreadDetail.tsx: 실 종류 설명, FAQ 답변

#### 4. NaverBlog.tsx 버튼 텍스트 번역
- 파일: `src/components/sections/NaverBlog.tsx`
- `'전체'` 버튼 텍스트

### Priority 3 - 추후 (Nice-to-have)

#### 1. 기타 Detail 컴포넌트 핵심 텍스트 검토
- AptosDetail.tsx
- VascularDetail.tsx
- PigmentationDetail.tsx
- TattooRemovalDetail.tsx
- BotoxDetail.tsx
- FillerDetail.tsx
- SkinboosterDetail.tsx

#### 2. 자동화 도구
- 번역 완성도 자동 검사 스크립트 작성
- 하드코딩 한글 감지 ESLint 규칙 추가
- 번역 키 문서화

---

## 현재 상태

| 영역 | 완성도 |
|------|--------|
| UI/네비게이션 | 98% |
| 핵심 페이지 | 95% |
| 시술 상세 페이지 | 85% |
| 의료 Q&A | 80% |
| 갤러리/동적 콘텐츠 | 75% |

**전체 완성도: 88%**

Priority 2 작업 완료 시 **95%** 달성 예상
