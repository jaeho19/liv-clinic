# -*- coding: utf-8 -*-
"""장면 모듈에 들어간 문자열에서 의료광고 금지 표현을 찾아낸다.

설계서 2026-09-19-lobby-monitor-video-set-design.md §4 기준.

이 도구가 잡지 못하는 것 (fix round 1, Finding 4 - 사람이 직접 검토해야 한다):
- 수치화된 개선의 일반형(예: "30% 개선", "2배 향상"). 숫자·퍼센트 패턴은
  일부러 BANNED 에 넣지 않았다 - "100개국 이상 사용" · "KR0062025" ·
  "의료기기 4등급" 같은 안전한 사실 표기까지 전부 걸리기 때문이다.
- 타 병원 비교의 자연어 변형 전반. BANNED 에는 흔한 리터럴 몇 개만 있다.
- "전후 비교"의 변형 표기(예: "Before/After" 표기 방식 차이, "시술 전 · 후").
  정확히 일치하는 문자열만 걸린다.
- 문맥·어조로만 판단되는 암묵적 효과 보장·과장 표현.
"""
import ast
import os
import sys

BANNED = (
    "최대 24개월", "압도적", "4세대", "오리지널", "유일", "최고", "최상",
    "1위", "보장", "완벽", "영구", "부작용 없", "즉시 효과", "할인", "이벤트가",
    "전후 비교", "비포 애프터", "후기", "체험담",
    # fix round 1, Finding 4 추가분 - 오탐 없이 확실히 안전한 리터럴만 추가.
    # SAFE_COPY_SAMPLES(41개) 회귀 테스트로 오탐 0 확인함.
    "비포", "애프터", "Before/After", "타 병원", "다른 병원",
)


def collect_strings(paths):
    """파이썬 소스에서 문자열 리터럴을 (파일, 줄, 값)으로 모은다."""
    out = []
    for path in paths:
        with open(path, encoding="utf-8") as f:
            src = f.read()
        tree = ast.parse(src, filename=path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                out.append((path, node.lineno, node.value))
    return out


def find_banned(items):
    hits = []
    for path, line, value in items:
        for b in BANNED:
            if b in value:
                hits.append((path, line, value, b))
    return hits


def main(argv):
    # fix round 1, Finding 3: 스캔된 리터럴 자체에 cp949 밖 문자(em dash 등)가
    # 있어도 %r 출력이 리디렉션 환경에서 죽지 않도록 방어적으로 인코딩한다.
    # repr() 은 출력 가능한 비ASCII 문자를 이스케이프하지 않으므로, 포맷
    # 템플릿의 문자만 안전하게 고쳐서는 부족하다.
    try:
        sys.stdout.reconfigure(errors="replace")
    except (AttributeError, ValueError):
        pass

    paths = argv[1:]
    if not paths:
        here = os.path.dirname(os.path.abspath(__file__))
        # fix round 1, Finding 2: video_*.py 가 임포트하는 저수준 모듈
        # (thread_anim/particle_anim/face_diagram)도 자체 문자열 리터럴을
        # 갖는다. collect_strings 는 임포트를 따라가지 않으므로 이 파일들을
        # 직접 후보로 나열해야 그 안의 리터럴이 스캔된다.
        candidates = (
            "video_thread.py", "video_georgia.py", "video_map.py",
            "thread_anim.py", "particle_anim.py", "face_diagram.py",
        )
        paths = [os.path.join(here, n) for n in candidates
                 if os.path.exists(os.path.join(here, n))]

    if not paths:
        # fix round 1, Finding 1: 검사 대상이 0개인 것은 규정 준수 증거가
        # 아니라 검사 실패다. 통과(0)와 절대 같은 종료 코드를 쓰면 안 된다.
        print("검사할 파일이 없다 - 이것은 규정 준수 확인이 아니라 검사 실패다.")
        return 2

    try:
        items = collect_strings(paths)
    except (OSError, SyntaxError) as exc:
        # Minor: 없는 경로(FileNotFoundError)나 문법이 깨진 모듈(SyntaxError)이
        # 트레이스백으로 터지지 않게 하고, 통과(0)/위반(1)과 구별되는 코드로
        # 끝낸다.
        print("모듈을 읽는 중 실패했다 - %s: %s" % (type(exc).__name__, exc))
        return 2

    hits = find_banned(items)
    for path, line, value, b in hits:
        print("금지 표현 '%s' - %s:%d - %r" % (b, os.path.basename(path), line, value))
    print("\n검사 파일 %d개, 위반 %d건" % (len(paths), len(hits)))
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
