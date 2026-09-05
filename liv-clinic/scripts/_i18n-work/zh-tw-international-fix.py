# zh-TW.json의 `international` 네임스페이스가 간체 중국어 그대로였던 문제(2026-09-05 발견) 수정.
# 간체 값을 OpenCC s2twp(대만 관용구)로 변환한 뒤 의료 용어를 보정해 value-edits 목록(JSON)을 만든다.
# 실제 파일 수정은 apply-value-edits.mjs가 바이트 보존으로 수행한다.
# 사용: python scripts/_i18n-work/zh-tw-international-fix.py > scripts/_i18n-work/value-edits.zh-tw-international.json
import json
import re
import sys
from pathlib import Path

from opencc import OpenCC  # pip install opencc-python-reimplemented

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src" / "messages" / "zh-TW.json"

# 번체 텍스트에는 나오지 않는 간체 전용 글자(휴리스틱)
SIMPLIFIED_ONLY = re.compile(r"[于术诊说语请咨询医疗应头发时间后从与对这为们体验价护见觉爱让业务预约线网]")

# OpenCC는 글자 변환(s2tw)만 쓴다 — 관용구 변환(s2twp)은 "项目"을 "專案(프로젝트)"으로 바꾸는 등 의료 문맥을 깨뜨린다.
# 대만 의료·서비스 용어는 아래에서 직접 보정한다 (순서 유지).
TERM_FIXES = [
    ("肉毒素", "肉毒桿菌素"),
    ("在線", "線上"),
    ("視頻", "影片"),
    ("信息", "資訊"),
    ("軟件", "軟體"),
    ("網絡", "網路"),
]
# "項目"은 시술 문맥에서만 "療程"으로 — 개인정보처리방침에서는 '수집 항목'이라 그대로 둔다
TREATMENT_ONLY_FIXES = [("項目", "療程")]

cc = OpenCC("s2tw")


def convert(value: str, path: list[str]) -> str:
    out = cc.convert(value)
    for a, b in TERM_FIXES:
        out = out.replace(a, b)
    if path[0] != "privacy" and not (path[0] == "metaSeo" and path[1] == "privacy"):
        for a, b in TREATMENT_ONLY_FIXES:
            out = out.replace(a, b)
    return out


def walk(node, path, out):
    if isinstance(node, dict):
        for k, v in node.items():
            walk(v, path + [k], out)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, path + [str(i)], out)
    elif isinstance(node, str) and SIMPLIFIED_ONLY.search(node):
        out.append((path, node))


data = json.loads(SRC.read_text(encoding="utf-8"))
hits = []
walk(data, [], hits)

# 2026-09-05 실측: international 80개 외에도 privacy·formExtras·metaSeo·medical.faq 등 29개가 간체였다 → 전부 변환한다.
outside = [".".join(p) for p, _ in hits if p[0] != "international"]
if outside:
    print("simplified text outside international (also converted):", outside, file=sys.stderr)

edits = []
for path, value in hits:
    new = convert(value, path)
    if path == ["international", "hero", "subtitle"]:
        new = new.replace("新沙站步行1分鐘的非手術", "新沙站步行1分鐘（林蔭道旁）的非手術")
    if new == value:
        continue
    # JSON 인코딩된 형태로 찾는다(따옴표 포함) — 값이 다른 곳에 똑같이 있어도 키와 함께 찾으면 유일하다.
    last = path[-1]
    enc_old = json.dumps(value, ensure_ascii=False)
    enc_new = json.dumps(new, ensure_ascii=False)
    if last.isdigit():  # 배열 원소: 값만으로 찾는다 (치환기가 유일성을 검증한다)
        edits.append({"file": "zh-TW.json", "find": enc_old, "replace": enc_new})
    else:
        edits.append({"file": "zh-TW.json", "find": f'"{last}": {enc_old}', "replace": f'"{last}": {enc_new}'})

# 같은 키·값이 두 곳 이상에 있으면(예: hero.ctaChat와 closing.ctaChat) 하나로 합쳐 전부 치환한다.
raw = SRC.read_text(encoding="utf-8")
merged = {}
for e in edits:
    if e["find"] in merged:
        continue
    n = raw.count(e["find"])
    if n == 0:
        raise SystemExit(f"not found in file: {e['find'][:60]}")
    if n > 1:
        e = {**e, "all": True, "expect": n}
    merged[e["find"]] = e
edits = list(merged.values())

print(json.dumps(edits, ensure_ascii=False, indent=1))
print(f"{len(hits)} simplified values found, {len(edits)} edits generated", file=sys.stderr)
