# -*- coding: utf-8 -*-
"""3편 공통 규격 검사. 모듈이 생기는 대로 MODULES 에 추가된다."""
import ast
import importlib
import operator
import os
import sys

import numpy as np
import pytest
from PIL import Image

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.dirname(os.path.dirname(EDIT))
sys.path.insert(0, OUTPUT)
sys.path.insert(0, EDIT)

EXPECTED = {"video_thread": 7200, "video_georgia": 5400, "video_map": 5400}
MODULES = [m for m in EXPECTED if os.path.exists(os.path.join(EDIT, m + ".py"))]
pytestmark = pytest.mark.skipif(not MODULES, reason="아직 편 모듈이 없다")

ROSE = np.array([180, 152, 141])
LUMA = np.array([0.2126, 0.7152, 0.0722])


@pytest.fixture(scope="module", params=MODULES)
def mod(request):
    return importlib.import_module(request.param), request.param


def test_total_frames_exact(mod):
    m, name = mod
    assert m.TOTAL_FRAMES == EXPECTED[name]


def test_blocks_are_contiguous_and_sum_to_length(mod):
    m, name = mod
    total = EXPECTED[name] / 30.0
    t = 0.0
    for b in m.BLOCKS:
        assert abs(b["start"] - t) < 1e-6, "%s 블록이 이어지지 않는다: %s" % (name, b["id"])
        t += b["dur"]
    assert abs(t - total) < 1e-6, "%s 합계가 %.3f (기대 %.3f)" % (name, t, total)


@pytest.mark.parametrize("frac", [0.0, 0.13, 0.37, 0.52, 0.71, 0.88, 0.999])
def test_chrome_present_in_every_sampled_frame(mod, frac):
    m, name = mod
    i = int((EXPECTED[name] - 1) * frac)
    arr = np.asarray(m.render_frame(i).convert("RGB")).astype(float)
    pill = arr[1795:1812, 78:101].reshape(-1, 3).mean(axis=0)
    assert np.abs(pill - ROSE).max() < 42, \
        "%s f%d 하단 '이 건물 4층' 필이 없다 (%s)" % (name, i, pill.round())
    lum = arr @ np.array([0.2126, 0.7152, 0.0722])
    assert lum[84:142, 72:319].max() > 170, "%s f%d 상단 로고가 없다" % (name, i)
    assert lum[86:146, 700:1010].max() > 170, "%s f%d 상단 병원명이 없다" % (name, i)
    assert lum.mean() > 18, "%s f%d 이 사실상 검은 프레임이다" % (name, i)


def test_frame_size_and_mode(mod):
    m, name = mod
    img = m.render_frame(0)
    assert img.size == (1080, 1920)
    assert img.mode == "RGB"


def test_last_12s_qr_region_is_static(mod):
    """마지막 12초 동안 QR 카드 영역이 완전히 고정되어야 한다."""
    m, name = mod
    n = EXPECTED[name]
    a = np.asarray(m.render_frame(n - 300).convert("RGB")).astype(int)
    b = np.asarray(m.render_frame(n - 5).convert("RGB")).astype(int)
    region = (slice(560, 1460), slice(72, 1008))
    assert np.abs(a[region] - b[region]).max() == 0, "%s QR 영역이 움직인다" % name


# 3초(90프레임) 동안 화면이 얼마나 변하는지의 하한(평균 절대차, 8비트 단위).
#
# 배경 켄번즈가 너무 느리면 프레임 간 변화가 x264 양자화 아래로 내려가 인코딩 결과가
# 앞 프레임과 똑같아지고, 최종 검수의 freezedetect(n=0.001:d=3) 가 정지 구간으로
# 잡는다. 편 모듈이 배경 속도 상수(KB_RATE/_z1)를 빠뜨려도 나머지 11개 테스트는
# 전부 통과하므로 - 8청크 전체 렌더를 마친 뒤에야 드러난다 - 여기서 먼저 막는다.
#
# 블록마다 두 곳을 본다: 시작 +1.5초(생성 클립을 그대로 쓰는 라이브 구간)와 중앙
# (블러 플레이트 구간). 두 구간은 원인이 달라 한쪽만 재면 놓친다 - 실제로 ②편에서
# 중앙만 재던 판에서는 통과했는데 E 블록 라이브 6초가 통째로 얼어 있었다.
#
# ②편 실측(18곳 중 최솟값): 정상 0.646(E 중앙) / 배경 속도 상수를 0.0034 로 낮추면
# 0.284(B 중앙) / 라이브 푸시인을 빼면 0.170(E +1.5초). 뒤의 두 경우는 실제로
# 인코딩 후 freezedetect 에 각각 4건·1건(4.9초)으로 잡혔다. 정상 쪽에 1.6배
# 여유를 두고 0.40 으로 잡았다.
MIN_MOVE_MAD = 0.40


def test_background_keeps_moving(mod):
    """각 블록의 라이브 구간과 중앙에서 3초 떨어진 두 프레임이 충분히 달라야 한다."""
    m, name = mod
    worst = None
    for b in m.BLOCKS:
        for off in (1.5, b["dur"] / 2.0):
            i = max(0, min(EXPECTED[name] - 91, int((b["start"] + off) * 30)))
            a = np.asarray(m.render_frame(i).convert("RGB")).astype(np.int16)
            c = np.asarray(m.render_frame(i + 90).convert("RGB")).astype(np.int16)
            mad = float(np.abs(a - c).mean())
            if worst is None or mad < worst[0]:
                worst = (mad, b["id"], i)
    assert worst[0] > MIN_MOVE_MAD, (
        "%s %s블록(f%d) 이 3초 동안 평균 %.3f 밖에 안 변한다 (하한 %.2f). "
        "배경 켄번즈 속도와 라이브 구간 푸시인을 확인할 것 - 이 상태로 인코딩하면 "
        "freezedetect 가 정지 구간으로 잡는다." % (name, worst[1], worst[2], worst[0],
                                                MIN_MOVE_MAD))


def test_render_frame_is_idempotent(mod):
    """같은 프레임을 두 번 렌더하면 픽셀이 완전히 같아야 한다.

    lru_cache 가 붙은 함수가 가변 PIL 이미지를 돌려주고 호출부가 그것을 제자리
    변형하면, 같은 인덱스를 다시 그릴 때 이미 그려진 그림 위에 또 그린다. ④편에서
    실제로 이 결함이 최종 마스터까지 나갔다(라이브 구간 97프레임 스트로브).

    이 스위트의 다른 단언으로는 못 잡는다 - 크롬·휘도 단언은 덧그려진 프레임도
    통과하고, freezedetect/blackdetect 는 움직임이 '모자란' 쪽을 찾으므로 움직임이
    '넘치는' 이 결함은 원리상 못 본다. 그래서 별도 가드가 필요하다.

    샘플은 블록마다 두 곳: 시작 +0.4초(생성 클립을 그대로 쓰는 라이브 창 - 오염이
    거기서 일어난다)와 중앙(블러 플레이트 구간).
    """
    m, name = mod
    for b in m.BLOCKS:
        for off in (0.4, b["dur"] / 2.0):
            i = max(0, min(EXPECTED[name] - 1, int((b["start"] + off) * 30)))
            a = np.asarray(m.render_frame(i).convert("RGB")).astype(int)
            c = np.asarray(m.render_frame(i).convert("RGB")).astype(int)
            d = int(np.abs(a - c).max())
            assert d == 0, (
                "%s %s블록 f%d 를 두 번 렌더하면 그림이 달라진다 (최대 %d). "
                "캐시(lru_cache 등)가 돌려준 이미지를 그 자리에서 덧그리는 곳이 "
                "있는지 확인할 것 - 캐시된 이미지는 반드시 복사한 뒤 그려야 한다."
                % (name, b["id"], i, d))


def test_no_banned_copy_in_module(mod):
    import copy_guard as cg
    m, name = mod
    hits = cg.find_banned(cg.collect_strings([os.path.join(EDIT, name + ".py")]))
    assert hits == [], "금지 표현: %s" % hits


# ================================================================ 조판 가드
# liv_video/draw.py 의 fit_size 는 글자 폭이 maxw 를 넘으면 **조용히** 2px 씩
# 줄인다. 예외도 로그도 없다. 그래서 76px 로 지정한 제목이 60px 로 렌더돼도 다른
# 테스트는 전부 통과하고, 사람이 스틸을 재 보기 전까지 아무도 모른다. 이번 작업에서
# 실제로 두 번 터졌다(②편 _g_photo 와 ③편 c_ceremony: 둘 다 72px 지정 -> 60px 렌더).
# 조판 규격은 제목 76~116px · 자막 54~96px 이다(2~3m 거리 가독성).
#
# 목록을 손으로 베끼면 소스가 바뀔 때 낡으므로 **AST 로 소스에서 뽑는다.**
# qc_check.parse_blocks 가 BLOCKS/XF 를 같은 이유로 AST 로 읽는다.
TITLE_FLOOR = 76
SUB_FLOOR = 54

# 세 편에서 maxw= 를 주는 T/TL 호출 수. 호출이 늘거나 줄면 이 테스트가 먼저 깨져
# 아래 해석기(_typeset_cases)가 새 호출을 실제로 보고 있는지 다시 확인하게 만든다.
MAXW_CALL_SITES = 24

_BINOP = {ast.Add: operator.add, ast.Sub: operator.sub,
          ast.Mult: operator.mul, ast.Div: operator.truediv}


def _fold(node, scope):
    """상수로 접히는 식의 값 후보 목록. 못 접으면 빈 목록."""
    if isinstance(node, ast.Constant):
        return [node.value]
    if isinstance(node, ast.Name):
        return list(scope.get(node.id, []))
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
        return [-v for v in _fold(node.operand, scope)]
    if isinstance(node, ast.BinOp) and type(node.op) in _BINOP:
        f = _BINOP[type(node.op)]
        return [f(a, b) for a in _fold(node.left, scope) for b in _fold(node.right, scope)]
    return []


def _const_rows(node, m):
    """CONST 또는 CONST[...] 가 가리키는 모듈 전역 시퀀스(행들)."""
    base = node.value if isinstance(node, ast.Subscript) else node
    if not isinstance(base, ast.Name):
        return None
    rows = getattr(m, base.id, None)
    if not isinstance(rows, (list, tuple)) or not rows:
        return None
    if not all(isinstance(r, (list, tuple)) for r in rows):
        return None
    return rows


def _bind_tuple(scope, names, node, m):
    """`a, b = ...` 형태를 이름별 값 후보로 묶는다."""
    if isinstance(node, ast.Tuple) and len(node.elts) == len(names):
        for n, el in zip(names, node.elts):
            v = _fold(el, scope)
            if v:
                scope[n] = v
        return
    rows = _const_rows(node, m)
    if rows and all(len(r) == len(names) for r in rows):
        for i, n in enumerate(names):
            scope[n] = [r[i] for r in rows]


def _names(target):
    if isinstance(target, ast.Name):
        return [target.id]
    if isinstance(target, ast.Tuple) and all(isinstance(e, ast.Name) for e in target.elts):
        return [e.id for e in target.elts]
    return None


def _local_scope(fn, m, base):
    """함수 안에서 상수로 굳는 지역 이름을 모은다.

    실제로 쓰이는 모양만 본다: `cw, ch = W - 2 * SAFE, 900`(튜플 대입),
    `region, title, tags, ... = CONCERNS[k]`(모듈 상수 행 분해),
    `for t0, t1, key, head in B_SEGS:`, `for i, (top, bot) in enumerate(F_CARDS):`.
    """
    scope = dict(base)
    for node in ast.walk(fn):
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            names = _names(node.targets[0])
            if not names:
                continue
            if len(names) == 1:
                v = _fold(node.value, scope)
                if v:
                    scope[names[0]] = v
            else:
                _bind_tuple(scope, names, node.value, m)
        elif isinstance(node, ast.For):
            it, tgt = node.iter, node.target
            if (isinstance(it, ast.Call) and isinstance(it.func, ast.Name)
                    and it.func.id == "enumerate" and it.args):
                it = it.args[0]
                if isinstance(tgt, ast.Tuple) and len(tgt.elts) == 2:
                    tgt = tgt.elts[1]
            names = _names(tgt)
            if names:
                _bind_tuple(scope, names, it, m)
    return scope


def _arg(call, pos, key):
    if len(call.args) > pos:
        return call.args[pos]
    for kw in call.keywords:
        if kw.arg == key:
            return kw.value
    return None


def _defs(tree):
    return [n for n in tree.body if isinstance(n, ast.FunctionDef)]


def _call_bindings(fn, tree, m, base):
    """모듈 안의 `fn(...)` 호출부마다 파라미터 이름 -> 값 후보 를 만든다.

    ③편 `duo()`·②편 `_g_photo()` 처럼 조판 인자를 파라미터로 받는 헬퍼는
    호출부를 봐야 실제 문구·크기를 알 수 있다.
    """
    params = [a.arg for a in fn.args.posonlyargs + fn.args.args]
    tail = params[len(params) - len(fn.args.defaults):] if fn.args.defaults else []
    out = []
    for caller in _defs(tree):
        cscope = _local_scope(caller, m, base)
        for node in ast.walk(caller):
            if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
                    and node.func.id == fn.name):
                continue
            b = {}
            for n, d in zip(tail, fn.args.defaults):
                v = _fold(d, cscope)
                if v:
                    b[n] = v
            for i, a in enumerate(node.args):
                if i < len(params):
                    b[params[i]] = _fold(a, cscope)
            for kw in node.keywords:
                if kw.arg in params:
                    b[kw.arg] = _fold(kw.value, cscope)
            out.append({k: v for k, v in b.items() if v})
    return out


def _typeset_cases(name):
    """(설명, 문구, 폰트키, 지정크기, maxw) 목록과 못 푼 호출 목록을 돌려준다."""
    m = importlib.import_module(name)
    path = os.path.join(EDIT, name + ".py")
    with open(path, encoding="utf-8") as f:
        tree = ast.parse(f.read(), filename=path)
    base = {k: [v] for k, v in vars(m).items()
            if isinstance(v, (int, float, str)) and not k.startswith("__")}

    cases, unresolved, sites = [], [], 0
    for fn in _defs(tree):
        local = _local_scope(fn, m, base)
        binds = _call_bindings(fn, tree, m, base)
        scopes = [dict(local, **b) for b in binds] if binds else [local]
        for node in ast.walk(fn):
            if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
                    and node.func.id in ("T", "TL")):
                continue
            if not any(kw.arg == "maxw" for kw in node.keywords):
                continue
            sites += 1
            where = "%s:%d %s()" % (name, node.lineno, fn.name)
            maxw_node = [kw.value for kw in node.keywords if kw.arg == "maxw"][0]
            text_node = _arg(node, 1, "text" if node.func.id == "T" else "lines")
            fk_node, sz_node = _arg(node, 4, "fkey"), _arg(node, 5, "size")
            got = False
            for sc in scopes:
                texts = ([x for e in text_node.elts for x in _fold(e, sc)]
                         if isinstance(text_node, ast.List) else _fold(text_node, sc))
                fkeys, sizes = _fold(fk_node, sc), _fold(sz_node, sc)
                maxws = _fold(maxw_node, sc)
                if not (texts and fkeys and sizes and maxws):
                    continue
                for tx in texts:
                    if not isinstance(tx, str) or not tx:
                        continue        # T() 는 빈 문구/None 이면 아무것도 안 그린다
                    for fk in fkeys:
                        for sz in sizes:
                            for mw in maxws:
                                cases.append((where, tx, fk, int(sz), int(mw)))
                                got = True
            if not got:
                unresolved.append(where)
    return cases, unresolved, sites


ALL_CASES = {}
ALL_UNRESOLVED = {}
ALL_SITES = {}
for _n in MODULES:
    ALL_CASES[_n], ALL_UNRESOLVED[_n], ALL_SITES[_n] = _typeset_cases(_n)


def _floor(size):
    """지정 크기가 속한 규격의 하한. 규격 밖(QR 카드 보조 표기 36px)은 축소 금지."""
    if size >= TITLE_FLOOR:
        return TITLE_FLOOR
    if size >= SUB_FLOOR:
        return SUB_FLOOR
    return size


def test_maxw_call_sites_are_all_resolved():
    """maxw 를 주는 호출을 하나도 빠짐없이 본다는 것 자체를 검사한다.

    호출이 늘었는데 해석기가 문구를 못 풀면 그 호출은 조용히 검사에서 빠진다.
    그러면 가드가 있는데도 규격 미달이 그대로 나간다 - 여기서 먼저 깨뜨린다.
    """
    if sorted(MODULES) != sorted(EXPECTED):
        pytest.skip("세 편이 다 있어야 총 호출 수를 대조할 수 있다")
    total = sum(ALL_SITES.values())
    assert total == MAXW_CALL_SITES, (
        "maxw= 를 주는 T/TL 호출이 %d개다 (기대 %d). 조판을 추가·삭제했으면 "
        "MAXW_CALL_SITES 를 갱신하고 새 호출이 아래 가드에 실제로 잡히는지 확인할 것. "
        "편별: %s" % (total, MAXW_CALL_SITES, ALL_SITES))
    bad = sum(ALL_UNRESOLVED.values(), [])
    assert bad == [], (
        "문구·크기를 소스에서 못 읽은 조판 호출: %s. _local_scope/_call_bindings 가 "
        "그 변수의 출처(모듈 상수·루프 분해·헬퍼 호출부)를 볼 수 있게 넓힐 것." % bad)


@pytest.mark.parametrize("name", MODULES)
def test_fit_size_never_shrinks_below_spec(name):
    """maxw 를 주는 조판이 fit_size 의 묵음 축소로 규격 아래로 떨어지지 않아야 한다."""
    from liv_video.draw import fit_size

    bad = []
    for where, text, fkey, size, maxw in ALL_CASES[name]:
        got = fit_size(text, fkey, size, maxw)
        floor = _floor(size)
        if got < floor:
            bad.append("%s '%s' %s %dpx (maxw %d) -> %dpx, 하한 %d"
                       % (where, text, fkey, size, maxw, got, floor))
    assert bad == [], (
        "fit_size 가 조판을 규격 아래로 줄인다 (%d건):\n  %s\n"
        "문구를 줄이거나 두 줄로 나누거나 maxw 를 넓힐 것 - 지정 크기만 키우면 "
        "fit_size 가 다시 같은 값으로 줄인다." % (len(bad), "\n  ".join(bad)))


# ================================================================ 대비 가드
# 라이브 창(블록 앞 6초, 생성 클립을 그대로 쓰는 구간)은 블러 앰비언트 플레이트보다
# 훨씬 밝다. 감광을 빼먹으면 그 위의 흰 조판(OFFW 휘도 246)과 얼굴 선화가 묻힌다.
# 이번 작업에서 실제로 터졌고 - ②편 D·E·F·G 조판이 휘도 145 배경 위 흰 글자였고,
# ④편은 H06 라이브 창 6초가 평균휘도 145·밝은 픽셀 26~29% 였다 - 사람이 손으로
# "조판 잉크 박스 안 배경 평균휘도 / 150 초과 픽셀 비율"을 재서 잡았다. 그 측정을
# 여기로 옮긴다. 스위트의 기존 휘도 단언(lum.mean() > 18)은 "너무 어두운가"라
# 방향이 정반대다.
#
# 재는 값은 밴드의 **중앙 휘도**다. 조판 잉크는 밴드의 소수 픽셀이므로(실측
# 150 초과 비율 0~28%, 전부 절반 미만) 중앙값은 사실상 배경 휘도다. 평균은 흰
# 글자가 끌어올려 배경이 어두워져도 잘 안 내려간다.
#
# 상한 근거: 사람이 잡은 위험선이 휘도 150 이다. 그 절반인 75 를 상한으로 둔다
# (흰 잉크 246 대비 3.3배 이상). 현재 실측 최댓값은 54.1(④편 C 블록)이라 1.4배
# 여유가 있고, 라이브 감광을 끄면 세 편 모두 이 선을 넘는다(아래 표).
#
#   밴드 중앙 휘도 실측 (+3.5초 / +5.9초, 현재 -> 라이브 감광 제거)
#   ② A 17/22 -> 28/40   D 36/36 -> 70/70   E 36/36 -> 79/80
#     F 23/24 -> 42/44   G 41/39 -> 78/74
#   ③ B 46/45 -> 86/85   D 11/11 -> 17/16   E 19/20 -> 34/35
#   ④ A 47/45 -> 95/91   C 54/53 -> 115/114  C-face 49/49 -> 97/96
MAX_BG_LUMA = 75.0
LIVE_OFFSETS = (3.5, 5.9)

# (블록id, 블록 시작초, y0, y1, x0, x1, 그 자리에 놓이는 조판)
LIVE_BANDS = {
    "video_thread": [
        ("A", 0.0, 415, 640, 160, 920, "실은 당기지 않습니다 / 겁니다 96px"),
        ("D", 70.0, 395, 545, 160, 920, "히알루론산을 세 가지 크기로 56px 2줄"),
        ("E", 105.0, 395, 465, 160, 920, "압토스 라인업과 적용 부위 56px"),
        ("F", 145.0, 400, 575, 72, 1008, "eyebrow 44px + 정식 허가와 국제 인증 76px"),
        ("G", 170.0, 420, 605, 160, 920, "주제목 76px + 보조 54px"),
    ],
    "video_georgia": [
        ("B", 14.0, 415, 600, 72, 1008, "eyebrow 44px + APTOS 본사 연수 72px"),
        ("D", 66.0, 1230, 1410, 72, 1008, "학회 발표 76px + 보조 54px"),
        ("E", 100.0, 1200, 1380, 72, 1008, "얼굴의 상태와 / 함께 봅니다 64px"),
    ],
    "video_map": [
        ("A", 0.0, 1345, 1445, 72, 1008, "어디가 제일 신경 쓰이세요? 84px"),
        ("C", 52.0, 400, 490, 72, 560, "eyebrow 두 번째 고민 44px"),
        ("C-face", 52.0, 600, 1200, 160, 920, "얼굴 선화 (226,214,206)"),
    ],
}


def test_live_window_background_is_dark_enough(mod):
    """라이브 창에서 주 조판이 놓이는 밴드의 배경이 흰 글자를 삼킬 만큼 밝지 않아야 한다."""
    m, name = mod
    bad = []
    for bid, start, y0, y1, x0, x1, what in LIVE_BANDS[name]:
        for off in LIVE_OFFSETS:
            i = max(0, min(EXPECTED[name] - 1, int((start + off) * 30)))
            arr = np.asarray(m.render_frame(i).convert("RGB")).astype(float)
            band = (arr @ LUMA)[y0:y1, x0:x1]
            med = float(np.median(band))
            if med > MAX_BG_LUMA:
                bad.append("%s %s블록 +%.1f초(f%d) y%d~%d 배경 중앙휘도 %.1f (상한 %.1f, %s)"
                           % (name, bid, off, i, y0, y1, med, MAX_BG_LUMA, what))
    assert bad == [], (
        "라이브 창 배경이 밝아 흰 조판이 묻힌다 (%d건):\n  %s\n"
        "라이브 프레임 감광(dim)과 소프트플레이트를 확인할 것 - 블러 앰비언트에만 "
        "dim 을 걸고 라이브 경로에 빠뜨리면 블록 앞 6초만 원본 밝기로 나간다."
        % (len(bad), "\n  ".join(bad)))
