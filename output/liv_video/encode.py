# -*- coding: utf-8 -*-
"""프레임 함수를 받아 ffmpeg(libx264) 로 인코딩."""
import os
import subprocess

from .spec import W, H, FPS


def encode_range(render_frame, first, last, out_path, crf=12, preset="medium", quiet=False):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-",
           "-an", "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-g", "30", "-keyint_min", "30",
           "-x264-params", "scenecut=0:open_gop=0", "-fps_mode", "cfr", out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = last - first
    for k, i in enumerate(range(first, last)):
        proc.stdin.write(render_frame(i).tobytes())
        if not quiet and k % 60 == 0:
            print("  %s %d/%d" % (os.path.basename(out_path), k, n), flush=True)
    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise SystemExit("ffmpeg failed rc=%d" % rc)
    return out_path
