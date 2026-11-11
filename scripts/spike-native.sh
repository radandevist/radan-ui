#!/usr/bin/env bash
# Manual proof of the native spike (docs/superpowers/spikes/2026-11-11-native-spike.md): packs the library, installs the
# tarball into apps/expo-consumer (an Expo SDK 58 + NativeWind v5 app), then checks Metro / Vite / tsc
# resolution and renders the Button under Jest. Not in `pnpm check`: ~900 MB of node_modules and a few minutes cold.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
pack="$(mktemp -d)"
trap 'rm -rf "$pack"' EXIT
cd "$root/packages/radan-ui"
pnpm build
tarball="$pack/$(pnpm pack --pack-destination "$pack" | tail -1 | xargs basename)"
cd "$root/apps/expo-consumer"
npm install --no-audit --no-fund --loglevel=error
npm install --no-save --no-audit --no-fund --loglevel=error "$tarball"
npm run verify
npm test
