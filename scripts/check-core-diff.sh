#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
baseline_commit="e33fe72f4498b3bca9f6f235f444e3a98a0a0549"
allowlist="$repo_root/eng/core-diff-allowlist.txt"
actual="$(mktemp)"
trap 'rm -f "$actual"' EXIT

{
  git -C "$repo_root" diff --name-only "$baseline_commit" -- PowerDocu.AppDocumenter
  git -C "$repo_root" ls-files --others --exclude-standard -- PowerDocu.AppDocumenter
} | sort -u > "$actual"

if ! diff -u "$allowlist" "$actual"; then
  echo "Unexpected retained-core diff. Update code or explicitly justify the allowlist change." >&2
  exit 1
fi

if ! git -C "$repo_root/modules/PowerDocu.Common" diff --quiet; then
  echo "PowerDocu.Common must be clean; browser seams are applied transiently from eng/patches." >&2
  exit 1
fi

echo "Retained-core diff matches the explicit allowlist."
