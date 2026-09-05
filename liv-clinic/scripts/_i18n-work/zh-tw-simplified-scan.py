#!/usr/bin/env python3
"""zh-TW 텍스트에서 간체 전용 글자를 찾는다.

사용: python zh-tw-simplified-scan.py <file.md|file.json|-> [...]
  - JSON이면 값만 훑고 privacy.* / metaSeo.privacy.* 는 건너뛴다(P0 정책: 법무 문구 유지).
  - '-' 는 stdin(HTML 등)을 한 줄씩 훑는다.
종료 코드 1 = 발견. 번체와 공통인 글자(惠·信·別 등)는 넣지 않는다 — 오탐이 나오면 여기서 뺀다.
"""
import json
import re
import sys

# Windows 콘솔(cp949)에서 한자 출력이 깨지지 않게 stdout을 UTF-8로 고정한다
sys.stdout.reconfigure(encoding="utf-8")

SIMPLIFIED_ONLY = re.compile(
    r"[于术诊说语请咨询医疗应头发时间后从与对这为们体验价护见觉爱让业务预约线网针国际须区号层还问银韩现"
    r"购买质专调结构题给开设础检备识别长变额颈脸颊选择剂达显确满师内两个卖财]"
)


def walk(node, path, hits):
    if isinstance(node, dict):
        for key, value in node.items():
            walk(value, path + [key], hits)
    elif isinstance(node, list):
        for i, value in enumerate(node):
            walk(value, path + [str(i)], hits)
    elif isinstance(node, str):
        if path and path[0] == "privacy":
            return
        if path[:2] == ["metaSeo", "privacy"]:
            return
        if SIMPLIFIED_ONLY.search(node):
            hits.append((".".join(path), node[:80]))


def scan_text(text, hits):
    for n, line in enumerate(text.splitlines(), 1):
        if SIMPLIFIED_ONLY.search(line):
            hits.append((f"line {n}", line.strip()[:80]))


found = 0
for name in sys.argv[1:]:
    hits = []
    if name == "-":
        scan_text(sys.stdin.read(), hits)
    else:
        with open(name, encoding="utf-8") as fh:
            text = fh.read()
        if name.endswith(".json"):
            walk(json.loads(text), [], hits)
        else:
            scan_text(text, hits)
    for where, sample in hits:
        print(f"{name}: {where}: {sample}")
    found += len(hits)

print(f"{found} hit(s)")
sys.exit(1 if found else 0)
