"""
Generate a short notification chime WAV file.
- Two-tone bell (A5 880Hz + E6 1318.5Hz, major third)
- 0.5 sec duration, fade-out envelope
- Mono, 16-bit PCM, 44.1kHz
- Output: liv-clinic/public/sounds/notification.wav (~44KB)
"""
import wave
import struct
import math
import os
import sys

# Resolve output path relative to script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUT = os.path.join(PROJECT_ROOT, 'liv-clinic', 'public', 'sounds', 'notification.wav')

SAMPLE_RATE = 44100
DURATION = 0.5  # seconds
FREQS = [880.0, 1318.51]  # A5 + E6 (major third, "ding")
FADE_IN = 0.01
FADE_OUT = 0.35

n = int(SAMPLE_RATE * DURATION)
frames = bytearray()
for i in range(n):
    t = i / SAMPLE_RATE
    # Envelope: short fade-in, long exponential fade-out
    if t < FADE_IN:
        env = t / FADE_IN
    elif t > DURATION - FADE_OUT:
        # Exponential decay
        decay_t = (t - (DURATION - FADE_OUT)) / FADE_OUT
        env = math.exp(-3.5 * decay_t)
    else:
        env = 1.0

    # Sum of two sine waves
    val = 0.0
    for f in FREQS:
        val += 0.35 * env * math.sin(2 * math.pi * f * t)

    int_val = max(-32767, min(32767, int(val * 32767)))
    frames.extend(struct.pack('<h', int_val))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with wave.open(OUT, 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    wav.writeframes(bytes(frames))

size_kb = os.path.getsize(OUT) / 1024
print(f'Generated: {OUT}', file=sys.stderr)
print(f'  Size: {size_kb:.1f} KB', file=sys.stderr)
print(f'  Duration: {DURATION}s, {n} samples')
