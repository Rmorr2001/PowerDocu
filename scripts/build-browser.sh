#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
common_dir="$repo_root/modules/PowerDocu.Common"
common_patch="$repo_root/eng/patches/powerdocu-common-browser-paths.patch"
publish_dir="$repo_root/.artifacts/wasm-release"
engine_dir="$repo_root/web/public/engine"
expected_common_commit="180780c3b56741a23307ff79cb3f89df758b7990"
image_name="powerdocu-web-sdk:10.0.400"
patch_applied=0

cleanup() {
  if [[ "$patch_applied" == "1" ]]; then
    git -C "$common_dir" apply --reverse "$common_patch"
  fi
}
trap cleanup EXIT INT TERM

"$repo_root/scripts/check-core-diff.sh"

if [[ "$(git -C "$common_dir" rev-parse HEAD)" != "$expected_common_commit" ]]; then
  echo "PowerDocu.Common is not at the pinned baseline commit." >&2
  exit 1
fi

if ! git -C "$common_dir" diff --quiet; then
  echo "PowerDocu.Common has tracked changes; refusing to overlap them." >&2
  exit 1
fi

git -C "$common_dir" apply --check "$common_patch"
git -C "$common_dir" apply "$common_patch"
patch_applied=1

docker build --platform linux/arm64 -f "$repo_root/eng/Dockerfile.wasm" -t "$image_name" "$repo_root/eng"

case "$publish_dir" in
  "$repo_root"/.artifacts/wasm-release) ;;
  *) echo "Unexpected publish directory." >&2; exit 1 ;;
esac
rm -rf "$publish_dir"

docker run --rm --platform linux/arm64 \
  -v "$repo_root:/src" -w /src "$image_name" \
  dotnet test PowerDocu.Browser.Tests/PowerDocu.Browser.Tests.csproj -c Release

docker run --rm --platform linux/arm64 \
  -v "$repo_root:/src" -w /src "$image_name" \
  dotnet publish PowerDocu.Web.Runtime/PowerDocu.Web.Runtime.csproj \
  -c Release -o /src/.artifacts/wasm-release

mkdir -p "$engine_dir"
rsync -a --delete "$publish_dir/wwwroot/" "$engine_dir/"
find "$engine_dir" -type f \( -name '*.br' -o -name '*.gz' \) -delete

npm --prefix "$repo_root/web" ci
npm --prefix "$repo_root/web" run build:static
npm --prefix "$repo_root/web" test

if [[ "${RUN_E2E:-0}" == "1" ]]; then
  npm --prefix "$repo_root/web" run test:e2e
fi

echo "Browser build complete: $repo_root/web/dist"
