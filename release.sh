#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="$ROOT_DIR/src"
DIST_DIR="$ROOT_DIR/dist"
BUILD_DIR="$DIST_DIR/build"
DOWNLOADS_DIR="$HOME/Downloads"

CHROMIUM_STAGE_DIR="$BUILD_DIR/chromium"
FIREFOX_STAGE_DIR="$BUILD_DIR/firefox"

CHROMIUM_ZIP="$DIST_DIR/utm-chromium.zip"
FIREFOX_ZIP="$DIST_DIR/utm-firefox.zip"

rm -rf "$BUILD_DIR"
mkdir -p "$CHROMIUM_STAGE_DIR" "$FIREFOX_STAGE_DIR"

find "$ROOT_DIR" -type f -name ".DS_Store" -delete

rsync -a --delete "$SRC_DIR/" "$CHROMIUM_STAGE_DIR/"
rsync -a --delete "$SRC_DIR/" "$FIREFOX_STAGE_DIR/"
cp "$ROOT_DIR/manifests/firefox.json" "$FIREFOX_STAGE_DIR/manifest.json"

rm -f "$CHROMIUM_ZIP" "$FIREFOX_ZIP"

(
  cd "$CHROMIUM_STAGE_DIR"
  zip -qr "$CHROMIUM_ZIP" .
)

(
  cd "$FIREFOX_STAGE_DIR"
  zip -qr "$FIREFOX_ZIP" .
)

mkdir -p "$DOWNLOADS_DIR"
cp "$CHROMIUM_ZIP" "$DOWNLOADS_DIR/utm-chromium.zip"
cp "$FIREFOX_ZIP" "$DOWNLOADS_DIR/utm-firefox.zip"

echo "Built:"
echo "  $CHROMIUM_ZIP"
echo "  $FIREFOX_ZIP"
echo
echo "Copied to Downloads:"
echo "  $DOWNLOADS_DIR/utm-chromium.zip"
echo "  $DOWNLOADS_DIR/utm-firefox.zip"
