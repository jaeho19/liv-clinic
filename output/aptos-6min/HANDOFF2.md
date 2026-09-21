# 압토스 6분 영상 — 인계문 2 (2026-09-21)

원래 인계문 `HANDOFF.md` 는 **1~2단계를 시작하기 전** 상태로 쓰인 것이다.
1·2단계가 끝났으므로 이 문서가 그 자리를 대신한다. `HANDOFF.md` 는 배경 설명과
설계서 §4 금지 문구 대조표 때문에 남겨 둔다 — **§3(진단)과 §7(함정)은 여전히 유효**하다.

설계 근거와 실측 기록은 전부 `LOOK.md` 에 있다. 이 문서는 **다음에 뭘 해야 하는가**다.

---

## 0. 지금 어디까지 왔나

| 단계 | 상태 |
| --- | --- |
| 1단계 룩 확정 (정지 5장) | ✅ 승인 |
| 2단계 파일럿 v1 (정지 + 켄번즈) | ⛔ "사진 프레임을 연결한 것 같다" — 폐기 |
| 2단계 파일럿 v2 (생성 클립) | ✅ 승인 — "씬 트래킹이랑 석재빛 같은 효과는 좋다" |
| 라인업을 이미지로 | ✅ 조각 두상 + 부위 표시로 해결 (`face_areas.py`) |
| **3단계 6분 전체** | ⬜ **다음 할 일** |

사장님 확인 사항:
- **480p 클립으로 계속 진행한다.** 1080p 재생성은 6분이 서고 난 뒤 판단.
- 실 트래킹(V1)·석재 빛(V4)이 좋다는 평가. 이 계열을 밀 것.
- 라인업·적용 부위는 **글자 표만으로는 안 된다** — 이미지로 보여야 한다.

---

## 1. 산출물과 코드

```
output/aptos-6min/
  LOOK.md              설계 근거·실측 기록 (길다. 함정 항목은 꼭 읽을 것)
  HANDOFF.md           원래 인계문 (§3 진단, §4 금지 문구 대조표, §7 함정)
  HANDOFF2.md          이 문서
  pilot_30s.mp4        v1 — 비교용으로만 남겨 둠
  pilot_30s_v2.mp4     v2 — 승인된 판
  edit/
    look.py            조판 계층. liv_video.draw 를 대체한다
    thread_dia.py      실 메커니즘 개념도 (신규 작성)
    face_areas.py      적용 부위 표시 (조각 두상 위)
    scenes.py          1단계 대표 장면 5장
    pilot.py           v1 렌더러 (전환 함수는 v2 가 그대로 가져다 쓴다)
    pilot2.py          v2 렌더러 — **6분 렌더러의 본보기**
    clips.py           Seedance 클립 받기·규격 변환·움직임 측정
    assets.py          실사 에셋 정리 (원본/업스케일/생성 구분 기록)
    test_pilot.py      검사 40개 (멱등성·규격·조판 가드·에셋·클립)
    fonts/             Cormorant 4 · Paperlogy 3 · Pretendard 5
    gen/               생성·업스케일 에셋 33개 + asset_report.json
    clips/frames/      V1~V10, 각 150프레임 1080×1920 JPEG
    clips/clip_report.json  클립별 원본 규격·변환·움직임
```

검사 한 줄:
```
cd output/aptos-6min/edit
PYTHONIOENCODING=utf-8 python -m pytest test_pilot.py -q
PYTHONIOENCODING=utf-8 python ../../lobby-monitor/edit/copy_guard.py \
  scenes.py look.py thread_dia.py face_areas.py pilot.py pilot2.py clips.py assets.py
```

---

## 2. 6분 구성안 (360초 = 10,800프레임)

`HANDOFF.md` §5 의 내용 뼈대(사장님 검토 완료)를 유지하되, **바탕을 생성 클립으로**
바꾼 것이다. 합계가 정확히 360초여야 한다.

| # | 섹션 | 초 | 바탕 | 내용 |
| --- | --- | --- | --- | --- |
| 00 | 훅 | 20 | **V1** 실 트래킹 | "실은 당기지 않습니다 / 겁니다" |
| 01 | `WHAT IS IT` 압토스란 | 38 | **V2** 돌기 + 제품 매크로 띠 | 제품 실물·재질 |
| 02 | `HOW IT WORKS` 오프너 | 12 | **V4** 석재 빛 | 섹션 오프너 |
| 03 | 실 메커니즘 | 58 | **V7** 먹 안개 | 삽입·걸림·고정 3단계 개념도 |
| 04 | `NAMICA` 히알루론산 | 44 | **V6** 캡슐 확산 | 나노/서브마이크로/마이크로 |
| 05 | `LINE UP` 라인업·부위 | 50 | **F1 조각 + V8** 지면 | 부위 3종 표시 → 괘선 표 |
| 06 | `CERTIFIED` 인증 | 34 | **V9** 석재 바닥 | KFDA 4등급·CE·ISO·FDA·100개국 |
| 07 | `WHO` 누가 하는가 | 54 | 실사 | A03 연수 → A02 수여 → A01 번호 → A09/A10 학회 |
| 08 | `HERE` 공간·상담 | 26 | 실사 I01·A11 | 상담 → 로비 → 이 건물 4층 |
| 09 | 마무리 | 24 | **V10** 빛 | QR — 마지막 12초 카드 완전 고정, 배경은 계속 움직임 |

합 360초. 섹션 번호는 화면에 `01`~`09` 로 나간다(00 훅은 번호 없이).

### 클립이 더 필요하다

한 편이 5초다. `clip_bed()` 로 감속 재생하면 **10초까지는 깨끗**하지만 그 이상은
느려져서 부자연스럽다. 58초짜리 섹션을 한 편으로 덮을 수 없다.

권하는 방식: **섹션마다 클립으로 열고(5~10초), 그다음 조판·실사 계층으로 넘어간다.**
클립 구간이 시선을 잡고, 정보는 그 뒤에 온다. 지금 파일럿 v2 의 A·B·C 가 그 문법이다.

추가로 필요한 클립은 대략 15~20편(섹션당 1~2편). 15크레딧 × 20 = 300크레딧선.

---

## 3. 클립을 만들 때 — 실측으로 배운 것

### 잘 나오는 프롬프트

**참조 이미지 + 구체적인 빛 사건**이 가장 잘 나온다. 순수 t2v 추상은 실패율이 높다.

- ✅ V4 (움직임 5.106, 최고): BG02 참조 + "빛 한 줄이 석재를 쓸고 지나가고 카메라는 위로 드리프트"
- ✅ V1 (1.572): P01T 참조 + "카메라가 실을 따라 트래킹, 돌기마다 스페큘러가 미끄러짐"
- ⛔ V3 (조직 섬유), V5 (빛 터널): t2v 추상 — 의도한 그림이 안 나왔다

### 반드시 지킬 것

```python
mcp__claude_ai_Higgs__generate_video_batch(requests=[{
  "index": N,
  "params": {
    "model": "seedance_2_5",
    "mode": "omni_reference",            # 참조 이미지를 쓸 때
    "declined_preset_id": "24bae836-2c4a-48e0-89b6-49fcc0b21612",  # ← 없으면 막힌다
    "prompt": "...",
    "resolution": "480p",
    "duration": 5,
    "aspect_ratio": "9:16",
    "generate_audio": False,             # ← 기본값이 True 다
    "medias": [{"role": "image_references", "value": "<media_id 또는 job_id>"}],
    "use_unlim": False
  }}])
```

1. **참조 이미지를 붙이면 프리셋 추천에 막힌다.**
   `Preset "IN THE DARK" was recommended instead of submitting a job` 로 제출 실패.
   `declined_preset_id` 를 같이 보내야 통과한다(6건 중 3건이 이걸로 실패했다).
2. **`generate_audio` 기본값이 True.** 무음 영상이니 반드시 False.
3. **요청값과 출력이 다르다.** `480p / 9:16 / 5초` → **480×854 / 24fps / 121프레임 / 5.04초**.
   `clips.py --fetch` 가 받은 파일을 먼저 재고 기록한 뒤 변환한다. 이 순서를 지킬 것.
4. `minterpolate` 가 마지막 프레임을 버린다(150 요청에 149장). `clips.py` 가 복제로 채운다.

### 클립 받아서 쓰기까지

```bash
cd output/aptos-6min/edit
# clips.json = [{"key":"V11","url":"https://...mp4","note":"..."}]
PYTHONIOENCODING=utf-8 python clips.py --fetch clips.json
PYTHONIOENCODING=utf-8 python clips.py --convert --frames 150
PYTHONIOENCODING=utf-8 python clips.py --motion   # 진짜 움직이는지 숫자로 확인
PYTHONIOENCODING=utf-8 python clips.py --sheet    # 6컷 대조표로 눈으로 확인
```

움직임 판단 기준: **정지 플레이트가 0.095**다. 0.3 아래면 클립을 쓴 보람이 없다.

---

## 4. 절대 흔들리면 안 되는 원칙 넷

1. **클립이 주인공인 구간에서는 감광하지 않는다.**
   이전 ②편은 생성 클립을 갖고도 `dim 0.46~0.58` 로 눌러 깔아서 움직임이 사라졌다.
   글자 자리에만 `band_scrim()` 을 깐다. 도해가 주인공인 구간에서만 배경을 누른다.

2. **의료 내용은 코드로 그린다.** 실 메커니즘·캡슐 확산·부위 표시는 `thread_dia.py`
   `particle_anim.py` `face_areas.py` 로. AI 에 맡기지 않는다(설계서 §4-③).
   화면에 `개념도` 표기 필수.

3. **생성 이미지를 "실물 사진"으로 표기하지 않는다.** 제품 렌더는 `제품 이미지`,
   조각 두상은 `개념도`. 실촬영으로 오인시키면 안 된다.

4. **증거 사진은 형태를 바꾸지 않는다.** 업스케일은 `face_enhancement: false` 로만.
   **A01(인증서)은 업스케일 금지** — 업스케일러가 작은 글자를 지어낸다(실측 확인).

---

## 5. 조판·규격 (바뀐 것 없음)

- 1080×1920 / 30fps CFR / H.264 yuv420p / **무음(오디오 스트림 0)** / faststart
- 360초 = **정확히 10,800프레임**. 오차 0
- 고정 크롬 전 구간 노출. 밝은 필드에서는 `chrome(img, "paper")`
- 제목 76~200px · 본문 54px 하한 — `HEAD`/`SUB` 가 어기면 **예외로 멈춘다**
- 3초 이상 완전 정지 0. 마지막 12초 QR 카드 고정(배경은 계속 움직임)
- 청크 렌더 명령에 **`PYTHONIOENCODING=utf-8`** 필수 (cp949 함정)

## 6. 검수 (파일럿에서 쓴 그대로)

```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,avg_frame_rate,nb_frames,pix_fmt \
  -show_entries format=duration,nb_streams -of default=noprint_wrappers=1 out.mp4
ffmpeg -v info -i out.mp4 -vf "freezedetect=n=0.001:d=3" -map 0:v -f null -
ffmpeg -v info -i out.mp4 -vf "blackdetect=d=0.5:pix_th=0.05" -f null -
```

거기에 **프레임 간 변화량**을 반드시 같이 잰다. `freezedetect` 는 이전 작업의
97프레임 스트로브를 **원리상 못 잡았다**(움직임이 넘치는 방향이라). 멱등성 검사
(`test_pilot.py`)와 변화량 프로파일이 그 자리를 메운다.

## 7. 사장님께 물어야 할 것

1. **1080p 재생성 여부** — 지금 클립은 480p 원본을 1080으로 늘린 것이다. 6분이 선 뒤
   판단하기로 했다. 20편을 1080p 로 다시 뽑으면 크레딧이 더 든다.
2. **움직임 강도** — V1·V4 계열이 세다. 6분 내내 이 강도면 피곤할 수 있어 강약을
   둘지 물어봐야 한다(아직 답을 못 받았다).
3. `HANDOFF.md` §10 의 미결 사항 3건(①편 정지 구간, 홈페이지 미진행 시술 2건,
   렌더러 3중 복제)은 그대로 남아 있다.

## 8. 누적 비용

이미지 36건 + 영상 14건 = **약 280크레딧** (5,584 → 5,300선). 잔액은 충분하다.
6분 전체는 추가 클립 300크레딧선을 예상한다.
