# -*- coding: utf-8 -*-
"""장면 모듈에 들어간 문자열에서 의료광고 금지 표현을 찾아낸다.

설계서 2026-09-19-lobby-monitor-video-set-design.md §4 기준.
"""
import ast
import os
import sys

BANNED = (
    "최대 24개월", "압도적", "4세대", "오리지널", "유일", "최고", "최상",
    "1위", "보장", "완벽", "영구", "부작용 없", "즉시 효과", "할인", "이벤트가",
    "전후 비교", "비포 애프터", "후기", "체험담",
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
    paths = argv[1:]
    if not paths:
        here = os.path.dirname(os.path.abspath(__file__))
        paths = [os.path.join(here, n) for n in
                 ("video_thread.py", "video_georgia.py", "video_map.py")
                 if os.path.exists(os.path.join(here, n))]
    hits = find_banned(collect_strings(paths))
    for path, line, value, b in hits:
        print("금지 표현 '%s' - %s:%d - %r" % (b, os.path.basename(path), line, value))
    print("\n검사 파일 %d개, 위반 %d건" % (len(paths), len(hits)))
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
