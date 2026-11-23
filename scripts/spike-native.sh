#!/usr/bin/env bash
# Manual proof of the native spike (docs/superpowers/spikes/2026-11-11-native-spike.md): packs the library, installs the
# tarball into apps/expo-consumer (an Expo SDK 58 + NativeWind v5 app), then checks Metro / Vite / tsc
# resolution and renders the Button under Jest. Not in `pnpm check`: ~900 MB of node_modules and a few minutes cold.
set -euo pipefail
# Usage: spike-native.sh [verify|test|all]; `all` (default, local usage) runs both in parallel.
task="${1:-all}"
case "$task" in
verify | test | all) ;;
*)
	echo "usage: $0 [verify|test|all]" >&2
	exit 2
	;;
esac
root="$(cd "$(dirname "$0")/.." && pwd)"
pack="$(mktemp -d)"
logs="$(mktemp -d)"
trap 'rm -rf "$pack" "$logs"' EXIT
cd "$root/packages/radan-ui"
pnpm build
tarball="$pack/$(pnpm pack --pack-destination "$pack" | tail -1 | xargs basename)"
cd "$root/apps/expo-consumer"
# npm ci is far faster on a cold cache and keeps the fixture on its lockfile (CI caches ~/.npm keyed on that file).
# CI also caches node_modules on the exact lockfile + Node version: on that hit the tree is already installed.
if [ "${EXPO_MODULES_CACHED:-}" = "true" ] && [ -f node_modules/.package-lock.json ]; then
	echo "expo node_modules restored from cache, skipping npm ci"
elif [ -f package-lock.json ]; then
	npm ci --no-audit --no-fund --loglevel=error
else
	npm install --no-audit --no-fund --loglevel=error
fi
# Drop the previous tarball install first: a cached tree carries the package from the run that filled the cache, and
# npm can treat a same-version tarball as already up to date.
rm -rf node_modules/@radandevist/radan-ui
npm install --no-save --no-audit --no-fund --loglevel=error "$tarball"
# verify (Metro/Vite/tsc) and jest do not depend on each other: `all` runs both, keeps each log whole, fails on either;
# a single task runs alone (CI matrix splits them onto separate runners).
if [ "$task" = "all" ]; then
	npm run verify >"$logs/verify.log" 2>&1 &
	verify_pid=$!
	npm test >"$logs/jest.log" 2>&1 &
	jest_pid=$!
	status=0
	wait "$verify_pid" || status=1
	wait "$jest_pid" || status=1
	cat "$logs/verify.log" "$logs/jest.log"
	exit "$status"
elif [ "$task" = "verify" ]; then
	exec npm run verify
else
	exec npm test
fi
