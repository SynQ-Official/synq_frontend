#!/usr/bin/env bash
# Uploads ambient sounds (and, with --videos, the web film encodes) to Cloudflare R2 through its S3 API.
# NOT RUN by anyone yet. It is a dry run unless you pass --apply. No key is stored here:
#   export R2_ACCOUNT_ID=...  R2_BUCKET=...  AWS_ACCESS_KEY_ID=...  AWS_SECRET_ACCESS_KEY=...
# Usage: scripts/ambiances/upload-r2.sh [--apply] [--videos]
#
# Files are served with a 1-year immutable cache: never overwrite a file under the same name, re-encode under a new one.
# The bucket also needs a CORS rule (GET from the app origin) if the player fetches audio through Web Audio.
set -euo pipefail

: "${R2_ACCOUNT_ID:?set R2_ACCOUNT_ID}" "${R2_BUCKET:?set R2_BUCKET}"
: "${AWS_ACCESS_KEY_ID:?set AWS_ACCESS_KEY_ID}" "${AWS_SECRET_ACCESS_KEY:?set AWS_SECRET_ACCESS_KEY}"

APPLY=0 VIDEOS=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --videos) VIDEOS=1 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

HERE="$(cd "$(dirname "$0")" && pwd)"
SOUNDS="$HERE/../../../ambiances-src"
ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
CACHE="public, max-age=31536000, immutable"
DRY=(--dryrun); [ "$APPLY" = 1 ] && DRY=()
export AWS_DEFAULT_REGION=auto

# sync <local dir> <prefix> <extension> <content-type>
sync() {
  aws s3 sync "$1" "s3://$R2_BUCKET/$2/" --endpoint-url "$ENDPOINT" \
    --exclude "*" --include "*.$3" --content-type "$4" --cache-control "$CACHE" ${DRY[@]+"${DRY[@]}"}
}

# Only the final encodes: generated noise and the licensed loops, never the raw sources.
for dir in generated adhd bipolar psychosis; do
  [ -d "$SOUNDS/$dir" ] || continue
  sync "$SOUNDS/$dir" "ambiances/$dir" m4a audio/mp4
  sync "$SOUNDS/$dir" "ambiances/$dir" opus audio/ogg
done

if [ "$VIDEOS" = 1 ]; then
  sync "$HERE/../../public/media/web" "video" mp4 video/mp4
fi

[ "$APPLY" = 1 ] || echo "Dry run only. Re-run with --apply to upload."
