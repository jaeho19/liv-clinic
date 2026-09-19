# -*- coding: utf-8 -*-
import os
import subprocess
import sys

EDIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, EDIT)
import copy_guard as cg                                              # noqa: E402


def test_banned_list_covers_spec(tmp_path):
    for phrase in ("최대 24개월", "압도적", "4세대", "오리지널", "유일"):
        assert any(phrase in b for b in cg.BANNED), "%s 가 금지 목록에 없다" % phrase


def test_detects_banned_phrase(tmp_path):
    f = tmp_path / "scene.py"
    f.write_text('TITLE = "압도적인 라인업"\nOK = "울쎄라"\n', encoding="utf-8")
    hits = cg.find_banned(cg.collect_strings([str(f)]))
    assert len(hits) == 1
    assert hits[0][3] == "압도적"


def test_allows_safe_copy(tmp_path):
    f = tmp_path / "scene.py"
    f.write_text('A = "KFDA 의료기기 4등급 정식 허가"\nB = "100개국 이상 사용"\n',
                 encoding="utf-8")
    assert cg.find_banned(cg.collect_strings([str(f)])) == []


def test_four_etc_not_false_positive(tmp_path):
    """'4등급'이 '4세대'로 오탐되면 안 된다."""
    f = tmp_path / "scene.py"
    f.write_text('A = "의료기기 4등급"\n', encoding="utf-8")
    assert cg.find_banned(cg.collect_strings([str(f)])) == []


# 출처: docs/superpowers/specs/2026-09-19-lobby-monitor-video-set-design.md §4
# "그대로 쓰는 것(전부 사실)" 및 Task 6 브리프(컨트롤러 지시)가 "실제로 쓸 안전한
# 카피"로 명시한 36개 문구 + fix round 1(컨트롤러 리뷰, Finding 4 Minor)이 추가로
# 지정한 face_diagram.REGION_LABEL 짧은 값 5개(볼/중안부/턱선/이중턱/피부결) -
# 기존에는 긴 문장의 부분 문자열로만 들어 있어 단독 값으로도 추가한다.
# find_banned 가 이 중 하나라도 걸리면 BANNED 목록이 너무 거친 것이다 - 회귀가
# 생기면 이 테스트가 잡아낸다.
SAFE_COPY_SAMPLES = (
    "KFDA 의료기기 4등급 정식 허가",
    "유럽 CE 인증",
    "ISO 13485",
    "FDA MDSAP",
    "100개국 이상 사용",
    "히알루론산을 세 가지 크기로 나눠 담습니다",
    "압토스 실리프팅",
    "APTOS Visage",
    "김수영 대표원장",
    "APTOS Professional Course 수료",
    "KR0062025",
    "성형외과 전문의",
    "얼굴의 상태와 원하는 변화를 함께 봅니다",
    "정답은 상담에서 함께 정합니다",
    "처진 얼굴선과 턱선",
    "수술 없이 탄력 개선",
    "피부결 · 모공 · 재생",
    "압토스 · 실리프팅",
    "울쎄라 · 써마지 · 복합 리프팅",
    "포텐자 · 리쥬란 · 쥬베룩",
    "리브성형외과",
    "이 건물 4층",
    "02-797-2773",
    "실은 당기지 않습니다",
    "겁니다",
    "① 실이 들어갑니다",
    "② 돌기가 조직을 겁니다",
    "③ 걸린 채 고정됩니다",
    "개념도",
    "조지아 트빌리시",
    "APTOS 본사",
    "학회 발표",
    "Aptos Xperts Alliance",
    "어디가 제일 신경 쓰이세요?",
    "리브성형외과에서 상담합니다",
    "상담 안내",
    # fix round 1, Finding 4 Minor 추가분 - face_diagram.REGION_LABEL 단독 값.
    "볼",
    "중안부",
    "턱선",
    "이중턱",
    "피부결",
)


def test_safe_copy_samples_not_false_positive(tmp_path):
    """설계서·face_diagram.REGION_LABEL이 그대로 쓰는 안전 카피 41개는
    하나도 걸리면 안 된다."""
    f = tmp_path / "safe_scene.py"
    content = "\n".join(
        "V%d = %r" % (i, text) for i, text in enumerate(SAFE_COPY_SAMPLES)
    )
    f.write_text(content + "\n", encoding="utf-8")
    hits = cg.find_banned(cg.collect_strings([str(f)]))
    assert hits == [], hits


# --- fix round 1 (컨트롤러 리뷰) 회귀 테스트 ---------------------------------


def test_main_zero_files_is_error_not_pass(tmp_path):
    """검사 대상 파일이 0개면 통과(exit 0)가 아니라 오류로 끝나야 한다
    (Finding 1). copy_guard.py 사본을 파일이 하나도 없는 빈 tmp_path 에
    두고 인자 없이 실행 - 기본 탐색 후보 6개 중 무엇도 존재하지 않는
    상황을 실제 edit/ 디렉터리 상태와 무관하게 재현한다."""
    with open(os.path.join(EDIT, "copy_guard.py"), encoding="utf-8") as fh:
        src = fh.read()
    (tmp_path / "copy_guard.py").write_text(src, encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(tmp_path / "copy_guard.py")],
        capture_output=True, cwd=str(tmp_path),
    )
    assert result.returncode == 2, (result.returncode, result.stdout, result.stderr)


def test_main_default_discovery_includes_helper_modules(tmp_path):
    """video_*.py 뿐 아니라 thread_anim.py 같은 저수준 모듈도 인자 없이
    실행한 main() 의 기본 탐색에 걸려야 한다 (Finding 2). collect_strings
    는 임포트를 따라가지 않으므로, video_thread.py 가 thread_anim.py 를
    임포트해도 thread_anim.py 자체를 탐색 후보로 나열하지 않으면 그 안의
    리터럴은 영원히 스캔되지 않는다."""
    with open(os.path.join(EDIT, "copy_guard.py"), encoding="utf-8") as fh:
        src = fh.read()
    (tmp_path / "copy_guard.py").write_text(src, encoding="utf-8")
    (tmp_path / "thread_anim.py").write_text(
        'NOTE = "압도적인 라인업"\n', encoding="utf-8",
    )

    result = subprocess.run(
        [sys.executable, str(tmp_path / "copy_guard.py")],
        capture_output=True, cwd=str(tmp_path),
    )
    assert result.returncode == 1, (result.returncode, result.stdout, result.stderr)


def test_main_redirect_survives_non_cp949_char_in_value(tmp_path):
    """스캔된 문자열 값 자체에 cp949 밖 문자(em dash)가 있어도 main() 이
    리디렉션 환경에서 죽지 않아야 한다 (Finding 3). repr() 은 출력 가능한
    비ASCII 문자를 이스케이프하지 않으므로, 걸린 값을 %r 로 출력하는 줄이
    포맷 템플릿과 무관하게 값 자체 때문에 다시 크래시할 수 있었다.
    PYTHONIOENCODING=cp949 로 강제해 이 PC의 기본 인코딩과 무관하게
    재현되도록 한다."""
    f = tmp_path / "scene.py"
    f.write_text('TITLE = "압도적 — 신제품 소개"\n', encoding="utf-8")
    env = dict(os.environ)
    env["PYTHONIOENCODING"] = "cp949"

    result = subprocess.run(
        [sys.executable, os.path.join(EDIT, "copy_guard.py"), str(f)],
        capture_output=True, env=env,
    )
    assert b"Traceback" not in result.stderr, result.stderr
    assert result.returncode == 1, (result.returncode, result.stdout, result.stderr)
    out = result.stdout.decode("cp949", errors="replace")
    assert "위반 1건" in out
