"""Self-check for the generated loops: length, loudness and a clean loop junction after AAC/Opus decoding.

Usage: python scripts/ambiances/verify-loops.py [dir]   (needs ffmpeg and numpy)
Exit code 1 if any file fails.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
TARGET_LUFS, LUFS_TOL = -20.0, 0.5
LEN_RANGE = (60.0, 120.0)
# First/last 20 ms must sit within the file's own 0.5-99.5 percentile of 20 ms windows, plus a margin: a real codec
# gap or fade is tens of dB (a 30 ms silent head measures about -200 dB), a 1 dB wobble is inaudible.
EDGE_MS, EDGE_PCT, EDGE_MARGIN_DB = 20, 0.5, 2.0


def decode(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        check=True, capture_output=True,
    ).stdout
    x = np.frombuffer(raw, dtype="<f4").reshape(-1, 2)
    # ffmpeg decodes AAC end padding past the nominal length; players trim to the container duration, so do we.
    nominal = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout)
    return x[: round(nominal * SR)]


def lufs(path: Path) -> float:
    err = subprocess.run(
        ["ffmpeg", "-nostdin", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    return float([l for l in err.splitlines() if l.strip().startswith("I:")][-1].split()[1])


def db(x: np.ndarray) -> float:
    return 20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)


def main() -> int:
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[3] / "ambiances-src" / "generated"
    files = sorted(list(folder.glob("*.m4a")) + list(folder.glob("*.opus")))
    if not files:
        print(f"no .m4a/.opus in {folder}")
        return 1
    failed = False
    for f in files:
        x = decode(f)
        seconds, loud = len(x) / SR, lufs(f)
        n = int(SR * EDGE_MS / 1000)
        # Level of every 20 ms window: a codec gap or fade at an edge falls far below this natural spread.
        levels = np.array([db(x[i:i + n]) for i in range(0, len(x) - n, n)])
        lo, hi = np.percentile(levels, [EDGE_PCT, 100 - EDGE_PCT])
        head, tail, whole = db(x[:n]), db(x[-n:]), db(x)
        problems = []
        if not LEN_RANGE[0] <= seconds <= LEN_RANGE[1]:
            problems.append(f"length {seconds:.2f}s outside {LEN_RANGE}")
        if abs(loud - TARGET_LUFS) > LUFS_TOL:
            problems.append(f"{loud:.1f} LUFS, expected {TARGET_LUFS}")
        if not (lo - EDGE_MARGIN_DB <= head <= hi + EDGE_MARGIN_DB and lo - EDGE_MARGIN_DB <= tail <= hi + EDGE_MARGIN_DB):
            problems.append(f"edge level head {head:.1f} / tail {tail:.1f} dB outside the file's own range [{lo:.1f}, {hi:.1f}]")
        failed |= bool(problems)
        print(f"{'FAIL' if problems else 'ok  '} {f.name}: {seconds:.2f}s {loud:.1f} LUFS edges {head - whole:+.1f}/{tail - whole:+.1f} dB (range {lo - whole:+.1f}..{hi - whole:+.1f})"
              + (" <- " + "; ".join(problems) if problems else ""))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
