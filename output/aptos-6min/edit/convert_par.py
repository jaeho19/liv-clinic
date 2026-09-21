# -*- coding: utf-8 -*-
"""클립 변환을 병렬로. `clips.py --convert` 와 같은 일을 하되 프로세스를 나눈다.

`minterpolate` 는 사실상 단일 스레드라 24fps -> 30fps 변환이 클립당 1분쯤 걸린다.
25편이면 25분이다. 출력 폴더가 키마다 갈리므로 병렬로 돌려도 서로 안 밟는다.

**clip_report.json 은 건드리지 않는다.** 여러 프로세스가 같은 파일을 쓰면
마지막에 쓴 놈만 남아 앞의 기록이 사라진다. 키마다 `clips/_meta_<key>.json` 에
따로 쓰고, 끝난 뒤 `--merge` 가 하나로 접는다.

사용:
  PYTHONIOENCODING=utf-8 python convert_par.py --spec clips6b.json --jobs 3
  PYTHONIOENCODING=utf-8 python convert_par.py --merge
"""
import argparse, json, os, subprocess, sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
import clips as C


def one(item):
    key, want = item["key"], int(item["frames"])
    src = os.path.join(C.CLIPS, key + ".mp4")
    info = C._probe(src)
    outdir = os.path.join(C.FRAMES, key)
    os.makedirs(outdir, exist_ok=True)
    for old in os.listdir(outdir):
        os.remove(os.path.join(outdir, old))
    vf = ("scale=%d:%d:force_original_aspect_ratio=increase:flags=lanczos,"
          "crop=%d:%d" % (C.W, C.H, C.W, C.H))
    if abs(info["fps"] - C.FPS) > 0.1:
        vf += (",minterpolate=fps=%d:mi_mode=mci:mc_mode=aobmc:"
               "me_mode=bidir:vsbmc=1" % C.FPS)
    else:
        vf += ",fps=%d" % C.FPS
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", vf,
                    "-q:v", "2", "-fps_mode", "passthrough",
                    os.path.join(outdir, "%04d.jpg")], check=True)
    got = sorted(os.listdir(outdir))
    if len(got) > want:
        for extra in got[want:]:
            os.remove(os.path.join(outdir, extra))
        fixed = "잘라냄 %d장" % (len(got) - want)
    elif len(got) < want:
        last = os.path.join(outdir, got[-1])
        for i in range(len(got) + 1, want + 1):
            Image.open(last).save(os.path.join(outdir, "%04d.jpg" % i), quality=95)
        fixed = "복제 %d장" % (want - len(got))
    else:
        fixed = "그대로"
    n = len(os.listdir(outdir))
    assert n == want, "%s: %d장 (기대 %d)" % (key, n, want)
    meta = {"source": info, "note": item.get("note", ""), "url": item.get("url", ""),
            "want_frames": want, "frames": want, "fixed": fixed,
            "interpolated": abs(info["fps"] - C.FPS) > 0.1}
    with open(os.path.join(C.CLIPS, "_meta_%s.json" % key), "w", encoding="utf-8") as f:
        json.dump({key: meta}, f, ensure_ascii=False, indent=1)
    return "%-4s -> %d프레임 (%s)" % (key, want, fixed)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec")
    ap.add_argument("--jobs", type=int, default=3)
    ap.add_argument("--merge", action="store_true")
    a = ap.parse_args()
    if a.merge:
        rep = C._load_report()
        n = 0
        for fn in sorted(os.listdir(C.CLIPS)):
            if not fn.startswith("_meta_"):
                continue
            path = os.path.join(C.CLIPS, fn)
            with open(path, encoding="utf-8") as f:
                for k, v in json.load(f).items():
                    rep.setdefault(k, {}).update(v)
                    n += 1
            os.remove(path)
        C._save_report(rep)
        print("%d편을 clip_report.json 에 접었다" % n)
        return
    with open(a.spec, encoding="utf-8") as f:
        spec = json.load(f)
    with ProcessPoolExecutor(max_workers=a.jobs) as ex:
        for line in ex.map(one, spec):
            print(" ", line)


if __name__ == "__main__":
    main()
