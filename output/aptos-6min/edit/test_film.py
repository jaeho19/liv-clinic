# -*- coding: utf-8 -*-
"""본편(6분) 렌더러 검사. `PYTHONIOENCODING=utf-8 python -m pytest test_film.py -q`

`test_pilot.py` 가 30초 파일럿 둘을 보고, 이 파일이 6분 본편을 본다.
겨냥하는 것은 인계문 §7 이 경고한 **지표로는 안 잡히는 결함**과, 6분이라서
새로 생긴 **강약 규칙**이다.

지표로 안 잡히는 것:
  §7-2 캐시 오염 — `freezedetect` 는 원리상 못 잡는다(움직임이 넘치는 방향).
       같은 프레임을 두 번 그려 바이트가 같은지 직접 본다.
  §7-4 조용한 축소 — `HEAD`/`SUB` 가 규격 하한을 지키는지.

6분이라서 생긴 것:
  바닥      약 구간에서도 정지 플레이트(0.095)의 2.6배를 넘어야 한다.
  악센트 간격 30초를 넘기면 그 사이에 들어온 사람은 조용한 구간만 보고 나간다.
  감속 한계  5초 클립을 16초로 늘리면 움직임이 배속만큼 깎인다. `clip_bed` 가
            막는지 실제로 예외가 나는지 본다.

움직임 **실측**은 여기가 아니라 `verify_film.py` 가 한다(프레임을 많이 그려야
해서 단위 검사에 두면 너무 느리다). 이 파일은 선언된 구조를 본다.
"""
import os
import sys

import pytest
from PIL import Image

EDIT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EDIT)

import look as L                                     # noqa: E402
import film as F                                     # noqa: E402
import capsule_dia as cd                             # noqa: E402

# 블록 경계·전환·도해 단계가 걸리도록 고른 프레임. 청크 경계(900의 배수)도 섞는다.
PROBE = [0, 150, 620, 899, 900, 1310, 1800, 2115, 2700, 3180, 3600,
         4180, 4500, 5230, 5400, 6120, 6300, 7040, 7200, 8110, 8400,
         9000, 9330, 9900, 10240, 10799]


# ---------------------------------------------------------------- 멱등성
@pytest.mark.parametrize("frame", PROBE)
def test_frame_is_idempotent(frame):
    """같은 프레임을 두 번 그리면 바이트가 같아야 한다(캐시 오염 탐지)."""
    a = F.render_frame(frame).tobytes()
    b = F.render_frame(frame).tobytes()
    assert a == b, ("프레임 %d 가 두 번째 렌더에서 달라졌다 — "
                    "캐시된 이미지를 제자리 변형한다" % frame)


def test_render_order_does_not_matter():
    """앞 프레임을 먼저 그린 뒤 뒤 프레임을 그려도 결과가 같아야 한다.

    청크 렌더는 프로세스마다 시작 인덱스가 다르다. 캐시가 오염되면 청크
    경계에서만 그림이 달라져 **이어 붙인 뒤에야** 드러난다.
    """
    alone = F.render_frame(6300).tobytes()
    for i in (0, 1800, 4500, 9000):
        F.render_frame(i)
    assert F.render_frame(6300).tobytes() == alone


def test_qr_card_is_not_mutated_in_place():
    """마지막 12초 QR 카드는 `lru_cache` 가 돌려준다. 호출부가 그 위에 그리면
    두 번째 프레임부터 덧그려진다 — 인계문 §7-2 가 겪은 그 결함이다."""
    before = F._qr_card().tobytes()
    F.render_frame(10600)
    F.render_frame(10700)
    assert F._qr_card().tobytes() == before


# ---------------------------------------------------------------- 규격
def test_total_frames_exact():
    assert F.TOTAL == 10800
    assert F.CHUNKS * F.CHUNK_FRAMES == F.TOTAL


def test_blocks_are_contiguous_and_end_at_360():
    t = 0.0
    for b in F.BLOCKS:
        assert abs(b["start"] - t) < 1e-9, (
            "블록 %s 가 %.3f 초에서 시작한다(기대 %.3f)" % (b["id"], b["start"], t))
        t += b["dur"]
    assert abs(t - 360.0) < 1e-9, "합계가 %.3f초다" % t
    assert abs(t - F.TOTAL / float(L.FPS)) < 1e-9


def test_frame_size_and_mode():
    img = F.render_frame(4321)
    assert img.size == (L.W, L.H)
    assert img.mode == "RGB"


def test_every_block_is_reachable():
    """`_block_at` 이 모든 블록을 한 번씩은 고르는지. 길이 0 이나 순서 뒤집힘을 잡는다."""
    seen = {F._block_at(i / float(L.FPS)) for i in range(0, F.TOTAL, 7)}
    missing = [F.BLOCKS[i]["id"] for i in range(len(F.BLOCKS)) if i not in seen]
    assert not missing, "한 번도 그려지지 않는 블록: %s" % ", ".join(missing)


# ---------------------------------------------------------------- 강약 규칙
def test_tiers_are_known_values():
    ok = {F.ACCENT, F.MID, F.BED}
    bad = [b["id"] for b in F.BLOCKS if b["tier"] not in ok]
    assert not bad, "계층 값이 이상한 블록: %s" % ", ".join(bad)


def test_accent_gap_never_exceeds_limit():
    """악센트 사이가 30초를 넘으면 안 된다.

    1층 로비는 체류시간이 30초~몇 분이다. 간격이 그보다 길면 그 사이에 들어온
    사람은 조용한 구간만 보고 나간다 — 6분을 다 보는 사람은 거의 없다.
    """
    last_end = 0.0
    worst = []
    for b in F.BLOCKS:
        if b["tier"] != F.ACCENT:
            continue
        gap = b["start"] - last_end
        if gap > F.ACCENT_GAP_MAX + 1e-9:
            worst.append("%s 앞 %.0f초" % (b["id"], gap))
        last_end = b["start"] + b["dur"]
    tail = 360.0 - last_end
    if tail > F.ACCENT_GAP_MAX + 1e-9:
        worst.append("마지막 악센트 뒤 %.0f초" % tail)
    assert not worst, "악센트 간격 초과: %s" % ", ".join(worst)


def test_first_block_is_an_accent():
    """0초가 조용하면 지나가던 사람이 화면을 보지 않는다."""
    assert F.BLOCKS[0]["tier"] == F.ACCENT


def test_accent_blocks_are_not_dimmed():
    """악센트에서 감광하면 클립을 쓴 보람이 없다 — 이전 ②편이 그렇게 죽었다.

    소스를 읽어 악센트 블록 함수 안에 `dim=` 이 큰 값으로 들어가는지 본다.
    완전한 검사는 아니지만(호출 경로가 갈리면 못 본다) 손이 미끄러진 경우는 잡는다.
    """
    import ast
    src = ast.parse(open(os.path.join(EDIT, "film.py"), encoding="utf-8").read())
    fns = {n.name: n for n in ast.walk(src) if isinstance(n, ast.FunctionDef)}
    bad = []
    for b in F.BLOCKS:
        if b["tier"] != F.ACCENT:
            continue
        node = fns.get(b["fn"].__name__)
        if node is None:
            continue
        for call in ast.walk(node):
            if not isinstance(call, ast.Call):
                continue
            for kw in call.keywords:
                if kw.arg == "dim" and isinstance(kw.value, ast.Constant):
                    if float(kw.value.value) > 0.10:
                        bad.append("%s(%s) dim=%s"
                                   % (b["id"], node.name, kw.value.value))
    assert not bad, "악센트인데 감광한다: %s" % ", ".join(bad)


# ---------------------------------------------------------------- 클립
def test_clip_bed_rejects_excessive_slowdown():
    """5초 클립을 16초 블록에 쓰면 예외가 나야 한다. 조용히 느려지면 안 된다."""
    with pytest.raises(ValueError):
        F.clip_bed("V1", 0.0, 16.0)


def test_clip_bed_uses_native_rate_when_long_enough():
    """클립이 블록보다 길거나 같으면 감속하지 않는다 — 배속 1.0 이어야 한다."""
    for b in F.BLOCKS:
        pass
    key, dur = "V1", L.clip_len("V1") / float(L.FPS)
    a = F.clip_bed(key, 0.5, dur).tobytes()
    b = L.clip(key, 0.5).tobytes()
    assert a == b, "블록이 클립과 같은 길이인데 배속이 걸렸다"


def test_every_clip_covers_its_block():
    """블록마다 쓰는 클립이 실제로 그 길이를 감당하는지.

    `clip_bed` 는 호출돼야 예외를 던진다. 여기서는 **렌더 전에** 전부 확인한다 —
    9분짜리 청크를 돌리다 300프레임째에 죽는 것보다 낫다.
    """
    import ast
    src = ast.parse(open(os.path.join(EDIT, "film.py"), encoding="utf-8").read())
    fns = {n.name: n for n in ast.walk(src) if isinstance(n, ast.FunctionDef)}
    problems = []
    for b in F.BLOCKS:
        node = fns.get(b["fn"].__name__)
        if node is None:
            continue
        for call in ast.walk(node):
            if not (isinstance(call, ast.Call)
                    and isinstance(call.func, ast.Name)
                    and call.func.id in ("clip_bed",)):
                continue
            if not call.args or not isinstance(call.args[0], ast.Constant):
                continue
            key = call.args[0].value
            if not os.path.isdir(os.path.join(L.CLIPDIR, key)):
                problems.append("%s: 클립 %s 가 없다" % (b["id"], key))
                continue
            native = L.clip_len(key) / float(L.FPS)
            if b["dur"] > native * F.SLOWDOWN_MAX + 1e-6:
                problems.append("%s: %s %.1f초로 %.1f초 블록 (%.2f배 감속)"
                                % (b["id"], key, native, b["dur"],
                                   b["dur"] / native))
    assert not problems, "\n".join(problems)


def test_clips_have_whole_frame_counts():
    """변환된 클립은 30fps 정수 프레임이어야 한다. 한 장이라도 비면 그 프레임에서 죽는다."""
    import json
    path = os.path.join(L.EDIT, "clips", "clip_report.json")
    with open(path, encoding="utf-8") as f:
        rep = json.load(f)
    for key, meta in rep.items():
        if "frames" not in meta:
            continue
        assert L.clip_len(key) == meta["frames"], (
            "%s: 디스크 %d장, 기록 %d장" % (key, L.clip_len(key), meta["frames"]))
        assert meta["frames"] % L.FPS == 0, (
            "%s: %d장은 30fps 정수 초가 아니다" % (key, meta["frames"]))


# ---------------------------------------------------------------- 조판 가드
def test_head_guard_rejects_undersized():
    img = Image.new("RGBA", (L.W, L.H))
    with pytest.raises(ValueError):
        L.HEAD(img, "아주 긴 제목을 좁은 폭에 억지로 밀어 넣는 경우", 0, 0, 116, maxw=200)


def test_sub_guard_rejects_undersized():
    img = Image.new("RGBA", (L.W, L.H))
    with pytest.raises(ValueError):
        L.SUB(img, "본문도 하한 아래로는 줄지 않는다", 0, 0, 56, maxw=120)


def test_all_headlines_fit_without_shrinking_below_spec():
    """본편에 실제로 들어간 제목·본문이 규격 안에서 렌더되는지.

    `HEAD`/`SUB` 는 규격을 깨면 예외를 던진다. 블록을 전부 한 번씩 그려서
    그 예외가 나지 않는 것을 확인한다 — 렌더 도중에 터지면 청크가 통째로 날아간다.
    """
    for b in F.BLOCKS:
        for frac in (0.02, 0.35, 0.72, 0.98):
            b["fn"](b["dur"] * frac)      # 예외가 나면 실패


# ---------------------------------------------------------------- 개념도
def test_capsule_classes_appear_in_order():
    """세 등급이 설계서가 나열한 순서(나노 → 서브마이크로 → 마이크로)로 들어온다."""
    dur = F.E2_DUR
    firsts = []
    for key in cd.KEYS:
        t = next((i / 10.0 for i in range(int(dur * 10))
                  if cd.class_amount(key, i / 10.0, dur) > 0.01), None)
        firsts.append(t)
    assert all(a is not None for a in firsts), "등장하지 않는 등급이 있다"
    assert firsts == sorted(firsts), "등급 등장 순서가 뒤섞였다: %s" % firsts


def test_capsule_sizes_are_strictly_increasing():
    """등급 크기가 겹치면 '셋'이라는 사실이 화면에서 안 보인다."""
    radii = [c[2] for c in cd.CLASSES]
    assert radii == sorted(radii) and len(set(radii)) == 3, radii


def test_capsule_field_keeps_moving():
    """확산이 멈추면 그 구간이 정지 화면이 된다."""
    box = F.E_BOX
    a = Image.new("RGBA", (L.W, L.H), (0, 0, 0, 255))
    b = Image.new("RGBA", (L.W, L.H), (0, 0, 0, 255))
    cd.draw(a, box, F.E2_DUR * 0.80, F.E2_DUR)
    cd.draw(b, box, F.E2_DUR * 0.98, F.E2_DUR)
    assert a.tobytes() != b.tobytes(), "확산 필드가 후반에 멈춰 있다"


# ---------------------------------------------------------------- 에셋
def test_generated_assets_present():
    for key, fn in L._NEW.items():
        assert os.path.isfile(os.path.join(L.GEN, fn)), "%s 에셋이 없다" % key


def test_certificate_is_not_upscaled():
    """A01(수료증)은 글자가 증거다. 업스케일러가 작은 글자를 지어낸다(실측)."""
    assert not L._NEW["A01"].endswith("_up.png")


# 전면으로 쓰는 실사 / 패널로 쓰는 실사. panel_scene 쪽은 원본 비율 그대로
# 띠 안에 앉히므로 잘리지 않는다.
FULLBLEED = ("A02", "A03", "A10")
PANELED = ("A01", "A09", "A11", "I01")


def _fullbleed_scale(key):
    """전면으로 깔 때의 표시 배율. 1.0 을 넘으면 원본보다 크게 그려진다."""
    im = L.asset(key)
    sw, sh = im.size
    ar = L.W / float(L.H)
    cw = sh * ar if sw / float(sh) > ar else sw
    return L.W / float(cw)


def _panel_scale(key):
    """패널로 앉힐 때의 표시 배율."""
    import film as _F
    im = L.asset(key)
    ar = im.width / float(im.height)
    _, cw = L.col(0, 12)
    bandh = _F.PANEL_BAND[1] - _F.PANEL_BAND[0]
    pw = cw if cw / ar <= bandh else bandh * ar
    return pw / float(im.width)


def test_photos_are_never_enlarged():
    """실사를 원본보다 크게 그리면 안 된다.

    픽셀 수 하한(1920)으로 재던 검사를 배율로 바꿨다. 진짜 기준은 원본 해상도가
    아니라 **얼마나 늘려 그리는가**다. 이전 작업의 I03/I04 는 746x1120 을 전면에
    써서 1.7배로 늘렸고 그래서 흐릿했다.
    """
    bad = []
    for key in FULLBLEED:
        sc = _fullbleed_scale(key)
        if sc > 1.0:
            bad.append("%s 전면 %.3f배" % (key, sc))
    for key in PANELED:
        sc = _panel_scale(key)
        if sc > 1.0:
            bad.append("%s 패널 %.3f배" % (key, sc))
    assert not bad, "원본보다 크게 그린다: %s" % ", ".join(bad)


def test_evidence_photos_are_shown_whole():
    """증거 사진은 잘라내지 않는다.

    전면으로 쓰면 9:16 이 아닌 원본은 가로가 잘린다. 잘린 부분이 곧 증거인
    넷(수료증 제목·학회 스크린의 원장명·상담의 손·로비 전경)은 패널로 간다.
    여기서는 그 넷이 실제로 `panel_scene` 을 타는지 소스로 확인한다.
    """
    import ast
    src = ast.parse(open(os.path.join(EDIT, "film.py"), encoding="utf-8").read())
    used = {}
    for node in ast.walk(src):
        if not isinstance(node, ast.FunctionDef):
            continue
        for call in ast.walk(node):
            if (isinstance(call, ast.Call) and isinstance(call.func, ast.Name)
                    and call.args and isinstance(call.args[0], ast.Constant)):
                if call.func.id in ("panel_scene", "photo", "_photo_scene"):
                    used.setdefault(call.args[0].value, set()).add(call.func.id)
    for key in PANELED:
        assert used.get(key) == {"panel_scene"}, (
            "%s 가 %s 로 쓰인다 — 잘리면 증거가 사라진다"
            % (key, ", ".join(sorted(used.get(key, {"안 쓰임"})))))


def test_cropped_fullbleed_photos_keep_most_of_the_frame():
    """전면으로 쓰는 셋은 가로 버림이 30% 를 넘지 않아야 한다."""
    worst = []
    for key in FULLBLEED:
        im = L.asset(key)
        sw, sh = im.size
        ar = L.W / float(L.H)
        cw = sh * ar if sw / float(sh) > ar else sw
        lost = 1.0 - cw / float(sw)
        if lost > 0.30:
            worst.append("%s 가로 %.0f%% 버림" % (key, lost * 100))
    assert not worst, ", ".join(worst)


def test_georgia_photo_is_never_enlarged():
    """A03·A04 는 원장님이 확대 금지 조건을 달았다. 줌이 1.0 을 넘으면 안 된다."""
    import ast
    src = ast.parse(open(os.path.join(EDIT, "film.py"), encoding="utf-8").read())
    fns = {n.name: n for n in ast.walk(src) if isinstance(n, ast.FunctionDef)}
    node = fns["w2_georgia"]
    kws = {}
    for call in ast.walk(node):
        if isinstance(call, ast.Call):
            for kw in call.keywords:
                if isinstance(kw.value, ast.Constant):
                    kws[kw.arg] = kw.value.value
    assert kws.get("dz") == 0.0, "A03 에 확대가 걸려 있다 (dz=%s)" % kws.get("dz")
    assert kws.get("z0") == 1.0, "A03 시작 줌이 %s 다" % kws.get("z0")
