#!/usr/bin/env bash
pnpx esbuild --format=iife --minify ./desktopIcon.js |
  tr '\n' '~' |
  sed 's/~$//; s/~/\\n/g; s/"/'"'/g" | # escape newlines,renove trailing newline, single-quote
  tee /tmp/desktopIcon.min.js |
  copy;

du -h /tmp/desktopIcon.min.js
