# Plan: mobile-admin-access

> **Feature**: 모바일에서 관리자 페이지 접근 불가 문제 해결
> **Created**: 2026-02-08
> **Priority**: P0 (Critical - 기능 접근 불가)
> **Estimated Effort**: Small (1~2개 파일 수정)

## 1. Problem Statement

모바일 환경에서 관리자 페이지(`/admin`)에 접근할 수 있는 UI 요소가 없어 관리자 로그인이 불가능함.

### Root Cause

- `Header.tsx:236` - 관리자 아이콘 링크에 `hidden md:flex` 클래스 적용
  - `md` = 768px 이상에서만 표시 → **모바일에서 완전히 숨겨짐**
- `MobileMenu.tsx` - 관리자 링크 **미포함**
- `Footer.tsx` - 관리자 링크 **미포함**

### Impact

- 모바일 사용자(직원)가 관리자 페이지에 접근할 수 없음
- URL을 직접 입력해야만 접근 가능 (`/admin/login`)

## 2. Requirements

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | 모바일 메뉴에서 관리자 페이지 접근 가능 | Must |
| FR-02 | 관리자 링크는 눈에 잘 띄지 않는 위치에 배치 (일반 환자에게 혼란 방지) | Must |
| FR-03 | 기존 데스크톱 관리자 아이콘 동작은 유지 | Must |

## 3. Solution

**MobileMenu.tsx**의 하단 Contact Info 영역에 관리자 아이콘 링크를 추가.
- 전화번호 아래, 사이드바 최하단에 작고 눈에 띄지 않게 배치
- `next/link`로 `/admin/login` 링크 (i18n 라우팅 불필요)

### Files to Modify

| 파일 | 변경 내용 |
|------|----------|
| `src/components/layout/MobileMenu.tsx` | 하단에 관리자 링크 추가 |

## 4. Out of Scope

- Footer에 관리자 링크 추가 (불필요)
- 관리자 인증/권한 변경
