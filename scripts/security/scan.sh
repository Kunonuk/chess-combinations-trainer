#!/bin/sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$project_root"

# Pin the free CLI images by both release and immutable manifest digest.
semgrep_image='semgrep/semgrep:1.182.1@sha256:451b3d875c00dac7ed5db5293e584a07de11449a409c10b3c2d2652f429630b6'
gitleaks_image='ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f'

run_scanner() {
  docker run --rm \
    --mount "type=bind,source=$project_root,target=/repo,readonly" \
    --workdir /repo \
    --env GIT_CONFIG_COUNT=1 \
    --env GIT_CONFIG_KEY_0=safe.directory \
    --env GIT_CONFIG_VALUE_0=/repo \
    "$@"
}

case "${1:-}" in
  code)
    report_path=$(mktemp "${TMPDIR:-/tmp}/chess-semgrep.XXXXXX")
    trap 'rm -f "$report_path"' EXIT HUP INT TERM
    status=0
    run_scanner "$semgrep_image" semgrep scan \
      --oss-only --config p/default --error --verbose \
      --metrics=off --disable-version-check \
      --json --text-output /dev/stderr . > "$report_path" || status=$?
    # Semgrep can return 0 if a warning follows a fatal error. Check every error.
    if ! node --experimental-strip-types scripts/security/checkSemgrep.ts "$report_path"; then
      [ "$status" -ne 0 ] || status=1
    fi
    exit "$status"
    ;;
  secrets)
    # Always run both scans, including when history already contains a finding.
    status=0
    run_scanner "$gitleaks_image" git \
      --config .gitleaks.toml --redact=100 --no-banner --verbose \
      --log-opts='--all --full-history' . || status=$?
    run_scanner "$gitleaks_image" dir \
      --config .gitleaks.toml --redact=100 --no-banner --verbose . || status=$?
    exit "$status"
    ;;
  *)
    printf 'Usage: sh scripts/security/scan.sh {code|secrets}\n' >&2
    exit 2
    ;;
esac
