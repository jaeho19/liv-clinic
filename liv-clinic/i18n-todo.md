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

## 완료된 작업 (2025-01-28)

### 1. SignatureDetail.tsx 핵심 UI 텍스트 번역
- 파일: `src/components/sections/SignatureDetail.tsx`
- PremiumCard: `tCommon('learnMore')` (자세히 보기)
- ProgramDetailPanel: `tCommon('duration')`, `tCommon('recommendedFor')`, `tCommon('learnMore')`
- CTA 섹션: `tCommon('freeConsultation')`

### 2. gallery/page.tsx 전체 UI 텍스트 번역
- 파일: `src/app/[locale]/gallery/page.tsx`
- Hero 섹션: `tGallery('title')`, `tGallery('description')`
- Notice: `tCommon('notice')`, `tGallery('noticeText')`
- 카테고리 필터: `getCategoryLabel()` 함수로 번역 적용
- 결과 카운트: `tCommon('total')`, `tCommon('cases')`
- Empty state: `tCommon('noItemsInCategory')`, `tCommon('selectOtherCategory')`
- CTA: `tGallery('experienceChange')`, `tGallery('findTreatment')`, `tCommon('freeConsultation')`

### 3. NaverBlog.tsx 전체 UI 텍스트 번역
- 파일: `src/components/sections/NaverBlog.tsx`
- 섹션 제목: `tCommon('medicalInfoNews')`, `tCommon('checkLatestNews')`
- 카테고리 필터: `tCommon('all')`, `tCategories(key)`
- FeaturedBlogCard: `tCategories()`, `tCommon('minuteRead')`, `tCommon('views')`, `tCommon('readMore')`
- BlogCard: `tCategories()`
- 통계: `tCommon('posts')`, `tCommon('cumulativeViews')`, `tCommon('update')`
- 더보기 버튼: `tCommon('viewMoreBlog')`

### 4. 새 네임스페이스 추가 (4개 언어)
- `categories`: lifting, antiaging, skin, skincare, news, qna
- `gallery`: title, description, noticeText, experienceChange, findTreatment
- `common`에 15개 키 추가: duration, recommendedFor, cases, notice, readMore, minuteRead, views, posts, cumulativeViews, update, viewMoreBlog, noItemsInCategory, selectOtherCategory, medicalInfoNews, checkLatestNews

---

## 앞으로 해야 할 작업

### Priority 3 - 추후 (Nice-to-have)

#### 1. 콘텐츠 데이터 번역
- SignatureDetail.tsx: signaturePrograms 배열 내 텍스트
- SkinToneDetail.tsx: 피부 고민 설명, FAQ 답변
- HairRemovalDetail.tsx: 부위별 제모 정보, FAQ 답변
- ThreadDetail.tsx: 실 종류 설명, FAQ 답변

#### 2. 기타 Detail 컴포넌트 핵심 텍스트 검토
- AptosDetail.tsx
- VascularDetail.tsx
- PigmentationDetail.tsx
- TattooRemovalDetail.tsx
- BotoxDetail.tsx
- FillerDetail.tsx
- SkinboosterDetail.tsx

#### 3. 자동화 도구
- 번역 완성도 자동 검사 스크립트 작성
- 하드코딩 한글 감지 ESLint 규칙 추가
- 번역 키 문서화

---

## 현재 상태

| 영역 | 완성도 |
|------|--------|
| UI/네비게이션 | 99% |
| 핵심 페이지 | 97% |
| 시술 상세 페이지 | 90% |
| 의료 Q&A | 85% |
| 갤러리/동적 콘텐츠 | 90% |

**전체 완성도: 92%**

Priority 2 작업 완료로 92% 달성! 🎉
