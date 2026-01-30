# 바디 필러 시술 부위 이미지 생성 프롬프트

## 목표
현재 얼굴 필러 시술부위 일러스트와 동일한 톤과 스타일로 바디 필러 시술 부위(어깨, 힙, 골반, 힙딥)를 보여주는 의료 인포그래픽 이미지 생성

## 현재 얼굴 이미지 스타일 분석
- 밝은 베이지/그레이 배경
- 동양인 젊은 여성 모델
- 핑크/로즈 컬러의 번호 마커
- 깔끔하고 미니멀한 클리닉 스타일
- 한국어 텍스트 라벨 (번호와 부위명)

---

## Nano Banana Pro 프롬프트 (한국어)

```
미니멀한 밝은 베이지 톤 배경 위에 젊은 동양인 여성의 뒷모습 또는 3/4 측면 뒷모습 일러스트. 어깨부터 허벅지 상단까지 프레임에 포함하여 바디 필러 시술 부위를 명확히 보여준다.

네 개의 시술 부위를 부드러운 살구색/로즈 컬러의 원형 마커로 표시:
1. 어깨 (승모근 라인) - 양쪽 어깨 윤곽
2. 힙 (엉덩이 볼륨) - 힙 중앙부
3. 골반 (골반뼈 라인) - 양쪽 골반 측면
4. 힙딥 (허벅지-엉덩이 함몰) - 힙 하단 측면

각 마커 옆에 번호(1, 2, 3, 4)를 배치하고, 한국어 라벨(어깨, 힙, 골반, 힙딥)을 점선으로 연결한다.

전체 색감은 리브성형외과 필러 시술부위 얼굴 일러스트와 어울리는 따뜻한 베이지/살구/로즈 톤을 사용한다. 과도한 노출 없이 단정하고 고급스러운 의료 인포그래픽 스타일. 깨끗하고 전문적인 클리닉 브랜딩에 적합한 이미지.

비율: 4:5 세로형 (모바일 최적화) 또는 16:9 가로형 (데스크톱)
해상도: 2K
```

---

## Nano Banana Pro 프롬프트 (영어 - 권장)

```
Minimal, elegant medical illustration of a young Asian woman's back view or 3/4 rear view, showing from shoulders to upper thighs on a light warm beige background.

Four body filler treatment areas marked with soft peach/rose colored circular markers:
1. Shoulder (trapezius line) - both shoulder contours
2. Hip (buttock volume) - center hip area
3. Pelvis (pelvic bone line) - both sides of pelvis
4. Hip Dip (thigh-buttock depression) - lower outer hip area

Each marker has a number (1, 2, 3, 4) and is connected to Korean labels (어깨, 힙, 골반, 힙딥) with thin dotted lines.

Color palette: warm beige, apricot, dusty rose tones matching LIV Plastic Surgery clinic branding. Clean, professional medical infographic style without excessive exposure. Premium aesthetic clinic aesthetic suitable for website header image.

Aspect ratio: 4:5 portrait (mobile optimized) or 16:9 landscape (desktop)
Resolution: 2K
```

---

## 대체 프롬프트 (실루엣 스타일)

만약 사실적인 인체 표현이 어려운 경우, 실루엣 스타일로:

```
Minimal line art silhouette of a female body from shoulders to upper thighs, rear/side view. Light beige background. Four treatment areas highlighted with soft gradient circles in peach/rose colors:
- Shoulders (both sides)
- Hip center
- Pelvis sides
- Hip dip area

Clean medical diagram aesthetic with numbered markers (01, 02, 03, 04). Premium clinic branding style. No facial features needed. Soft, elegant, professional.

Resolution: 2K, Aspect: 4:5
```

---

## 이미지 저장 위치
생성된 이미지는 다음 경로에 저장:
`/liv-clinic/public/images/antiaging/filler/body-filler-areas.png`

## 컴포넌트 연동
이미지 생성 후 `FillerDetail.tsx`의 바디 필러 섹션에서 다음 코드 수정:

```tsx
{/* Placeholder 제거하고 실제 이미지로 교체 */}
<div className="mt-12">
  <Image
    src="/images/antiaging/filler/body-filler-areas.png"
    alt={detail.bodyAreas.imageAlt}
    width={800}
    height={1000}
    className="w-full max-w-2xl mx-auto rounded-2xl shadow-lg"
    quality={95}
  />
</div>
```

---

## 참고: 현재 얼굴 필러 이미지 경로
`/liv-clinic/public/images/Gemini_Generated_Image_c8gix4c8gix4c8gi.png`
