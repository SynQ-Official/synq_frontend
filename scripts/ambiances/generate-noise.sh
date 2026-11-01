#!/usr/bin/env bash
# Generates the pink and white noise loops into ambiances-src/generated/ (created by SynQ, no third party).
# 90 s, stereo (independent channels), seamless loop, -20 LUFS, AAC 128 kb/s (.m4a) + Opus 128 kb/s (.opus).
# Seeds are fixed, so the output is reproducible. Usage: scripts/ambiances/generate-noise.sh [out-dir]
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$HERE/../../../ambiances-src/generated}"
mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

TARGET_LUFS=-20
XFADE=2      # seconds of equal-power crossfade at the loop junction
LEN=90       # final loop length, seconds

make_loop() {
  local color="$1" seed_l="$2" seed_r="$3"
  local total=$((LEN + XFADE))

  # Loop trick: take LEN+XFADE seconds, fade the extra tail (B) into the head (A). The file then starts on the very
  # sample that follows its last one, so the wrap-around is continuous. Equal-power fade keeps uncorrelated noise level.
  ffmpeg -nostdin -v error -y \
    -f lavfi -i "anoisesrc=color=$color:duration=$total:sample_rate=48000:seed=$seed_l:amplitude=0.5" \
    -f lavfi -i "anoisesrc=color=$color:duration=$total:sample_rate=48000:seed=$seed_r:amplitude=0.5" \
    -filter_complex "[0][1]amerge=inputs=2,asplit[x][y];\
[x]atrim=start=$LEN:end=$total,asetpts=PTS-STARTPTS[b];\
[y]atrim=start=0:end=$LEN,asetpts=PTS-STARTPTS[a];\
[b][a]acrossfade=d=$XFADE:c1=qsin:c2=qsin" \
    -c:a pcm_f32le "$TMP/$color.raw.wav"

  # Stationary noise: a plain linear gain reaches the target (no loudnorm dynamics). A lossy codec low-passes the
  # noise and shifts its loudness (white noise most), so each encode is re-measured once and its gain corrected.
  local measured gain
  measured="$(lufs "$TMP/$color.raw.wav")"
  gain="$(awk -v t="$TARGET_LUFS" -v m="$measured" 'BEGIN{printf "%.3f", t-m}')"
  encode "$color" m4a "$gain" -c:a aac -b:a 128k -movflags +faststart
  encode "$color" opus "$gain" -c:a libopus -b:a 128k -vbr on
}

lufs() { ffmpeg -nostdin -nostats -i "$1" -af ebur128 -f null - 2>&1 | awk '/^ *I:/{i=$2} END{print i}'; }

# encode <color> <ext> <start gain dB> <codec args...>
encode() {
  local color="$1" ext="$2" gain="$3"; shift 3
  local out="$OUT/noise-$color.$ext" got pass
  for pass in 1 2; do
    ffmpeg -nostdin -v error -y -i "$TMP/$color.raw.wav" -af "volume=${gain}dB" "$@" "$out"
    got="$(lufs "$out")"
    if [ "$pass" = 1 ]; then gain="$(awk -v g="$gain" -v t="$TARGET_LUFS" -v m="$got" 'BEGIN{printf "%.3f", g+t-m}')"; fi
  done
  echo "noise-$color.$ext: ${got} LUFS decoded (final gain ${gain} dB)"
}

make_loop pink 11 12
make_loop white 21 22
ls -l "$OUT"
