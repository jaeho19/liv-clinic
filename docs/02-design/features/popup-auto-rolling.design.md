# Design: 팝업 자동 롤링 (Popup Auto Rolling)

> **Feature**: popup-auto-rolling
> **Plan**: [popup-auto-rolling.plan.md](../../01-plan/features/popup-auto-rolling.plan.md)
> **Created**: 2026-02-08
> **Status**: Draft

---

## 1. 아키텍처 개요

### 1.1 컴포넌트 구조 (Before → After)

**Before (현재)**:
```
ClientSideWidgets
  └── PopupManager (순차 표시, currentIndex)
        └── PopupModal (단일 popup 1개)
```

**After (변경 후)**:
```
ClientSideWidgets
  └── PopupManager (배열 전달, 모바일 필터링)
        └── PopupModal (멀티 배너 슬라이더)
              ├── 슬라이드 이미지 영역 (AnimatePresence)
              ├── 인디케이터 도트
              ├── 좌우 화살표 버튼
              └── 하단 액션 바 (오늘 보지 않기 / 닫기)
```

### 1.2 변경 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/components/layout/PopupManager.tsx` | 수정 | 순차 로직 제거, 배열 전달 |
| `src/components/layout/PopupModal.tsx` | 수정 | 멀티 배너 슬라이더 UI |

### 1.3 변경하지 않는 파일

- DB 스키마 (`008_popups_table.sql`) - 그대로
- 타입 (`PopupRow`, `PopupInsert`, `PopupUpdate`) - 그대로
- Admin 팝업 관리 페이지 - 그대로
- API 라우트 (`/api/popups`, `/api/admin/popups`) - 그대로
- `ClientSideWidgets.tsx` - 그대로

---

## 2. 상세 설계

### 2.1 PopupManager.tsx

#### Props/State 변경

```typescript
// BEFORE
const [popups, setPopups] = useState<PopupRow[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);  // 삭제
const [visible, setVisible] = useState(true);
const [isMobile, setIsMobile] = useState(false);

// AFTER
const [popups, setPopups] = useState<PopupRow[]>([]);
// currentIndex 제거 - PopupModal 내부에서 관리
const [visible, setVisible] = useState(true);
const [isMobile, setIsMobile] = useState(false);
```

#### 데이터 흐름 변경

```typescript
// BEFORE: 순차 표시
const currentPopup = popups[currentIndex];
if (!currentPopup || !visible) return null;

// 모바일 필터링: render 시점에 개별 체크
if (isMobile && !currentPopup.show_on_mobile) {
  setCurrentIndex(prev => prev + 1);
  return null;
}

return <PopupModal popup={currentPopup} ... />;

// AFTER: 배열 전달
// 모바일 필터링: 배열 레벨에서 일괄 적용
const displayPopups = isMobile
  ? popups.filter(p => p.show_on_mobile)
  : popups;

if (displayPopups.length === 0 || !visible) return null;

return <PopupModal popups={displayPopups} ... />;
```

#### 이벤트 핸들러 변경

```typescript
// BEFORE: 순차 닫기
const handleClose = () => {
  if (currentIndex < popups.length - 1) {
    setCurrentIndex(prev => prev + 1);
  } else {
    setVisible(false);
  }
};

const handleDismissToday = () => {
  dismissToday(currentPopup.id);
  handleClose();
};

// AFTER: 전체 닫기
const handleClose = () => {
  setVisible(false);
};

const handleDismissToday = () => {
  // 모든 활성 팝업을 오늘 하루 dismiss
  displayPopups.forEach(p => dismissToday(p.id));
  setVisible(false);
};
```

#### 전체 코드 구조

```typescript
export default function PopupManager() {
  const [popups, setPopups] = useState<PopupRow[]>([]);
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    // ... 기존 loadPopups 로직 동일 (Supabase 로드 + 정적 병합 + dismiss 필터)
  }, []);

  const displayPopups = isMobile
    ? popups.filter(p => p.show_on_mobile)
    : popups;

  if (displayPopups.length === 0 || !visible) return null;

  const handleClose = () => setVisible(false);

  const handleDismissToday = () => {
    displayPopups.forEach(p => dismissToday(p.id));
    setVisible(false);
  };

  return (
    <PopupModal
      popups={displayPopups}
      onClose={handleClose}
      onDismissToday={handleDismissToday}
    />
  );
}
```

---

### 2.2 PopupModal.tsx (핵심 변경)

#### Interface 변경

```typescript
// BEFORE
interface PopupModalProps {
  popup: PopupRow;
  onClose: () => void;
  onDismissToday: () => void;
}

// AFTER
interface PopupModalProps {
  popups: PopupRow[];
  onClose: () => void;
  onDismissToday: () => void;
}
```

#### 내부 State

```typescript
const [currentIndex, setCurrentIndex] = useState(0);
const [direction, setDirection] = useState(0); // -1: left, 1: right (애니메이션 방향)
const [isPaused, setIsPaused] = useState(false);
const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const currentPopup = popups[currentIndex];
const isMultiple = popups.length > 1;
```

#### 자동 롤링 로직

```typescript
const AUTO_INTERVAL = 2500;  // 2.5초
const RESUME_DELAY = 5000;   // 사용자 조작 후 5초 뒤 자동 재개

// 자동 롤링 시작/정지
const startAutoPlay = useCallback(() => {
  if (!isMultiple) return;
  stopAutoPlay();
  autoPlayRef.current = setInterval(() => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % popups.length);
  }, AUTO_INTERVAL);
}, [isMultiple, popups.length]);

const stopAutoPlay = useCallback(() => {
  if (autoPlayRef.current) {
    clearInterval(autoPlayRef.current);
    autoPlayRef.current = null;
  }
}, []);

// 사용자 조작 시: 일시정지 → 5초 후 자동 재개
const pauseAndResume = useCallback(() => {
  stopAutoPlay();
  setIsPaused(true);
  if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  resumeTimerRef.current = setTimeout(() => {
    setIsPaused(false);
    startAutoPlay();
  }, RESUME_DELAY);
}, [stopAutoPlay, startAutoPlay]);

// 마운트 시 자동 시작 + 언마운트 시 정리
useEffect(() => {
  startAutoPlay();
  return () => {
    stopAutoPlay();
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };
}, [startAutoPlay, stopAutoPlay]);
```

#### 슬라이드 네비게이션

```typescript
const goToSlide = (index: number) => {
  setDirection(index > currentIndex ? 1 : -1);
  setCurrentIndex(index);
  pauseAndResume();
};

const goNext = () => {
  setDirection(1);
  setCurrentIndex(prev => (prev + 1) % popups.length);
  pauseAndResume();
};

const goPrev = () => {
  setDirection(-1);
  setCurrentIndex(prev => (prev - 1 + popups.length) % popups.length);
  pauseAndResume();
};
```

#### 터치 스와이프

```typescript
const touchStartX = useRef(0);
const SWIPE_THRESHOLD = 50; // px

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
};

const handleTouchEnd = (e: React.TouchEvent) => {
  const diff = touchStartX.current - e.changedTouches[0].clientX;
  if (Math.abs(diff) > SWIPE_THRESHOLD) {
    if (diff > 0) goNext();  // 왼쪽 스와이프 → 다음
    else goPrev();           // 오른쪽 스와이프 → 이전
  }
};
```

#### 슬라이드 전환 애니메이션 (Framer Motion)

```typescript
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const slideTransition = {
  x: { type: 'tween', duration: 0.3, ease: 'easeInOut' },
  opacity: { duration: 0.2 },
};
```

#### JSX 구조

```tsx
return (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-start justify-start p-3 sm:p-4 pt-4 sm:pt-6 pl-3 sm:pl-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl overflow-hidden flex flex-col shadow-lg"
        style={{
          maxWidth: `min(${currentPopup.width || 400}px, 88vw)`,
          maxHeight: '85dvh',
        }}
        onClick={e => e.stopPropagation()}
        onMouseEnter={() => isMultiple && stopAutoPlay()}
        onMouseLeave={() => isMultiple && !isPaused && startAutoPlay()}
      >
        {/* 닫기 버튼 */}
        <button onClick={onClose} className="absolute top-2 right-2 z-10 ..." aria-label="닫기">
          ✕
        </button>

        {/* 슬라이드 이미지 영역 */}
        <div
          className="relative overflow-hidden min-h-0"
          onTouchStart={isMultiple ? handleTouchStart : undefined}
          onTouchEnd={isMultiple ? handleTouchEnd : undefined}
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
            >
              {currentPopup.image_url && (
                <div
                  className={currentPopup.link_url ? 'cursor-pointer' : ''}
                  onClick={handleImageClick}
                >
                  <img
                    src={currentPopup.image_url}
                    alt={currentPopup.title}
                    className="w-full h-auto block"
                    draggable={false}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* 좌우 화살표 (2개 이상일 때만) */}
          {isMultiple && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                aria-label="이전"
              >
                ‹
              </button>
              <button
                onClick={goNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                aria-label="다음"
              >
                ›
              </button>
            </>
          )}

          {/* 도트 인디케이터 (2개 이상일 때만) */}
          {isMultiple && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {popups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`rounded-full transition-all duration-200 ${
                    idx === currentIndex
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`슬라이드 ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 하단 액션 바 */}
        <div className="flex justify-between items-center px-3 py-2 bg-black/60 backdrop-blur-sm text-xs text-white/80 shrink-0">
          <button onClick={onDismissToday} className="hover:text-white transition-colors cursor-pointer">
            오늘 하루 보지 않기
          </button>
          <button onClick={onClose} className="hover:text-white transition-colors cursor-pointer">
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);
```

---

## 3. UI 사양

### 3.1 레이아웃

```
┌─────────────────────────────────┐
│ [✕]                             │  ← 닫기 버튼 (top-right)
│                                 │
│  [‹]   슬라이드 이미지    [›]   │  ← 좌우 화살표 (중앙)
│                                 │
│         ● ━━ ● ●               │  ← 도트 인디케이터 (하단 중앙)
├─────────────────────────────────┤
│ 오늘 하루 보지 않기      닫기   │  ← 하단 액션 바
└─────────────────────────────────┘
```

### 3.2 스타일 사양

| 요소 | 사양 |
|------|------|
| **모달 최대 너비** | `min(currentPopup.width \|\| 400px, 88vw)` |
| **모달 최대 높이** | `85dvh` |
| **모달 위치** | 좌상단 (기존 유지) |
| **닫기 버튼** | `w-7 h-7`, `bg-black/40`, top-2 right-2 |
| **화살표 버튼** | `w-8 h-8`, `bg-black/30`, 좌우 중앙 |
| **도트 (비활성)** | `w-2 h-2`, `bg-white/50`, 원형 |
| **도트 (활성)** | `w-6 h-2`, `bg-white`, 캡슐형 (pill) |
| **도트 간격** | `gap-1.5` |
| **도트 위치** | 이미지 영역 하단 중앙, `bottom-2` |
| **액션 바** | `bg-black/60 backdrop-blur-sm`, `text-xs text-white/80` |
| **이미지** | `draggable={false}` (드래그 방지) |

### 3.3 애니메이션 사양

| 애니메이션 | 사양 |
|-----------|------|
| **모달 진입** | `scale(0.95)→1`, `y(20)→0`, `opacity(0)→1`, 0.2s |
| **슬라이드 전환** | `x(±100%)→0`, `opacity(0)→1`, 0.3s easeInOut |
| **도트 크기 전환** | `transition-all duration-200` |

### 3.4 타이밍 사양

| 항목 | 값 |
|------|------|
| **자동 롤링 인터벌** | 2500ms (2.5초) |
| **사용자 조작 후 일시정지** | 5000ms (5초) 후 자동 재개 |
| **마우스 호버 시** | 자동 롤링 즉시 정지, leave 시 재개 |
| **터치 스와이프 감도** | 50px 이상 |
| **슬라이드 전환 시간** | 300ms |

---

## 4. 동작 시나리오

### 4.1 기본 흐름 (팝업 3개 활성)

1. 페이지 로드 → Supabase에서 활성 팝업 3개 로드
2. PopupManager가 `displayPopups` 배열(3개)을 PopupModal에 전달
3. PopupModal이 첫 번째 배너를 표시
4. 2.5초 후 → 자동으로 두 번째 배너로 전환 (slide right)
5. 2.5초 후 → 세 번째 배너 → 2.5초 후 → 첫 번째 (무한 루프)
6. 사용자가 "닫기" 클릭 → 전체 모달 닫힘
7. 사용자가 "오늘 하루 보지 않기" 클릭 → 3개 모두 localStorage dismiss + 닫힘

### 4.2 사용자 인터랙션 흐름

1. 사용자가 도트 클릭 → 해당 슬라이드로 이동, 자동 롤링 5초 일시정지
2. 사용자가 좌/우 화살표 클릭 → 이전/다음 슬라이드, 5초 일시정지
3. 사용자가 모바일 스와이프 → 방향에 따라 이전/다음, 5초 일시정지
4. 마우스 호버 → 즉시 정지, 마우스 나가면 즉시 재개

### 4.3 이미지 클릭 흐름

1. 사용자가 슬라이드 이미지 클릭
2. 해당 `currentPopup.link_url`을 `link_target` 방식으로 열기
3. 모달 닫기

### 4.4 팝업 1개일 때 (기존 호환)

1. 인디케이터 도트 숨김
2. 좌우 화살표 숨김
3. 자동 롤링 비활성화
4. 기존과 동일한 단일 이미지 팝업 동작

### 4.5 팝업 0개일 때

1. PopupManager에서 `displayPopups.length === 0` → `return null`
2. 아무것도 렌더링하지 않음

### 4.6 모바일 필터링

1. `isMobile && !p.show_on_mobile`인 팝업을 배열에서 제외
2. 제외 후 남은 팝업만 슬라이더에 표시
3. 모바일에서 팝업 0개가 되면 아무것도 표시 안 함

---

## 5. 접근성

| 항목 | 구현 |
|------|------|
| **aria-label** | 닫기, 이전, 다음, 슬라이드 N 버튼에 적용 |
| **키보드 제어** | 좌/우 화살표 키로 슬라이드 전환 (향후 확장 가능) |
| **reduced motion** | `prefers-reduced-motion` 시 슬라이드 전환을 fade만 적용 |
| **이미지 alt** | `popup.title` 값 사용 |
| **focus trap** | 모달 내부에 focus 유지 (기존 동작) |

---

## 6. 엣지 케이스

| 케이스 | 대응 |
|--------|------|
| 이미지 로드 실패 | img에 기본 fallback 없음 (기존 동작 유지, alt 텍스트 표시) |
| 팝업 이미지 크기 불일치 | `w-full h-auto` 유지 - 너비 기준 스케일링 |
| 매우 긴 세로 이미지 | `maxHeight: 85dvh`로 제한, overflow hidden |
| 동시에 많은 팝업 (10개+) | 도트가 넘칠 수 있으나 실 운영에서 드문 케이스 |
| SSR 환경 | `ClientSideWidgets`에서 `ssr: false`로 이미 처리됨 |
| localStorage 비활성 | try-catch로 감싸져 있어 무시 (기존 로직) |

---

## 7. 구현 체크리스트

- [ ] **PopupManager.tsx**: `currentIndex` 상태 제거
- [ ] **PopupManager.tsx**: 모바일 필터링을 배열 레벨로 이동
- [ ] **PopupManager.tsx**: `displayPopups` 배열을 PopupModal에 전달
- [ ] **PopupManager.tsx**: `handleDismissToday`에서 모든 팝업 dismiss
- [ ] **PopupModal.tsx**: props를 `popup` → `popups` 배열로 변경
- [ ] **PopupModal.tsx**: 내부 `currentIndex` + `direction` 상태 추가
- [ ] **PopupModal.tsx**: 자동 롤링 로직 (setInterval 2.5초)
- [ ] **PopupModal.tsx**: 마우스 호버 일시정지/재개
- [ ] **PopupModal.tsx**: 사용자 조작 시 5초 일시정지 후 자동 재개
- [ ] **PopupModal.tsx**: AnimatePresence 슬라이드 전환 애니메이션
- [ ] **PopupModal.tsx**: 도트 인디케이터 UI (활성 pill 형태)
- [ ] **PopupModal.tsx**: 좌우 화살표 버튼
- [ ] **PopupModal.tsx**: 터치 스와이프 지원 (touchstart/touchend)
- [ ] **PopupModal.tsx**: 이미지 draggable={false}
- [ ] **PopupModal.tsx**: `isMultiple` 분기 (1개일 때 인디케이터/화살표 숨김)
- [ ] 팝업 1개일 때 기존 동작 호환 확인
- [ ] 팝업 0개일 때 렌더링 없음 확인
