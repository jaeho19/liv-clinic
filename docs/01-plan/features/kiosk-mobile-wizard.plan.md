# Plan: 키오스크 모바일 스텝 위저드 UX

## 요약
모바일에서 키오스크 시술 선택 → 물품 조정 플로우를 **페이지 전환 방식(스텝 위저드)**으로 변경하여 스크롤 없이 각 단계에 집중할 수 있도록 개선한다.

## 현재 문제
- 모바일(`flex-col`)에서 시술 선택 패널과 물품 패널이 **세로로 쌓임**
- 시술(예: 덴서티)을 클릭하면 물품 목록이 화면 아래에 표시되어 **수동 스크롤 필요**
- 데스크톱의 2단 레이아웃은 문제없으나, 모바일 경험이 불편

## 해결 방안: 모바일 스텝 위저드

### 스텝 구성
| 스텝 | 모바일 표시 내용 | 동작 |
|------|-----------------|------|
| **Step 1** | 시술 선택 (카테고리 + 버튼) | 시술 클릭 시 옵션 없으면 → Step 2 전환 |
| **Step 1.5** | 옵션 선택 (옵션 있는 시술만) | 옵션 클릭 → Step 2 전환 |
| **Step 2** | 환자정보 + 물품 수량 + 차감 버튼 | 뒤로가기 → Step 1 복귀 |

### 핵심 원칙
1. **데스크톱(lg 이상)은 현재 2단 레이아웃 유지** - 변경 없음
2. **모바일만** `mobileStep` 상태로 스텝 전환
3. 시술 클릭 → 옵션 없으면 바로 Step 2 / 옵션 있으면 옵션 선택 후 Step 2
4. Step 2에서 **← 뒤로** 버튼으로 Step 1 복귀 (시술 선택 초기화)
5. 차감 완료 후 자동으로 Step 1 복귀

## 수정 대상

### 파일: `KioskView.tsx` (단일 파일 수정)
변경 사항:
1. `mobileStep` state 추가 (`'select' | 'items'`)
2. `handleSelectType` 수정: 옵션 없는 시술 → `setMobileStep('items')`
3. `handleSelectOption` 수정: 옵션 선택 → `setMobileStep('items')`
4. `handleSubmit` 수정: 성공 시 → `setMobileStep('select')`
5. `handleReset` 수정: 초기화 시 → `setMobileStep('select')`
6. 렌더링 부분: 모바일에서 `mobileStep`에 따라 좌측/우측 패널 show/hide
   - Step 'select': 좌측 패널만 표시 (`lg:block` + 모바일 조건부)
   - Step 'items': 우측 패널만 표시 + 상단에 뒤로가기 바
7. 뒤로가기 바 UI: 선택된 시술명 표시 + ← 버튼

### 화장품 키오스크 (`CosmeticsKioskView.tsx`)
- 동일 패턴 적용 (카테고리 선택 → 물품 조정 스텝 분리)

## 기술 구현

```tsx
// 모바일 스텝 상태
const [mobileStep, setMobileStep] = useState<'select' | 'items'>('select');

// 시술 선택 시
const handleSelectType = (proc) => {
  setSelectedType(proc);
  if (proc.options.length === 0) {
    loadRecipeItems(recipeName);
    setMobileStep('items');  // ← 핵심: 모바일 전환
  }
};

// 옵션 선택 시
const handleSelectOption = (option) => {
  setSelectedOption(option);
  loadRecipeItems(option.recipeName);
  setMobileStep('items');  // ← 핵심: 모바일 전환
};

// 렌더링 (모바일 조건부)
<div className="flex flex-col lg:flex-row gap-5">
  {/* 좌측: 모바일 step=select일 때만 or 데스크톱 항상 */}
  <div className={`lg:w-[40%] ${mobileStep !== 'select' ? 'hidden lg:block' : ''}`}>
    ...시술 선택 패널...
  </div>

  {/* 우측: 모바일 step=items일 때만 or 데스크톱 항상 */}
  <div className={`lg:flex-1 ${mobileStep !== 'items' ? 'hidden lg:block' : ''}`}>
    {/* 모바일 뒤로가기 바 */}
    <div className="lg:hidden mb-3">
      <button onClick={handleBackToSelect}>← {displayName}</button>
    </div>
    ...물품 패널...
  </div>
</div>
```

## 예상 소요
- KioskView.tsx: state 추가 + 핸들러 수정 + 렌더링 조건부
- CosmeticsKioskView.tsx: 동일 패턴 적용
- 테스트: 모바일 크기에서 스텝 전환 확인

## 위험도: 낮음
- 데스크톱 레이아웃 변경 없음 (hidden/block 토글만)
- 기존 로직(레시피 로딩, 제출, 토스트) 변경 없음
- CSS 클래스 조건부 추가만으로 구현 가능
