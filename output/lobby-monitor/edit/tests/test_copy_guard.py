# -*- coding: utf-8 -*-
import os
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
# 카피"로 명시한 36개 문구. find_banned 가 이 중 하나라도 걸리면 BANNED 목록이
# 너무 거친 것 — 회귀가 생기면 이 테스트가 잡아낸다.
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
)


def test_safe_copy_samples_not_false_positive(tmp_path):
    """설계서가 '그대로 쓴다'고 명시한 안전 카피 36개는 하나도 걸리면 안 된다."""
    f = tmp_path / "safe_scene.py"
    content = "\n".join(
        "V%d = %r" % (i, text) for i, text in enumerate(SAFE_COPY_SAMPLES)
    )
    f.write_text(content + "\n", encoding="utf-8")
    hits = cg.find_banned(cg.collect_strings([str(f)]))
    assert hits == [], hits
