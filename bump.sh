#!/usr/bin/env bash
# Gives the site's CSS/JS a new version tag so browsers load the latest files right away.
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M)
sed -i -E "s#(src|href)=\"([a-z-]+\.(js|css))(\?v=[0-9]+)?\"#\1=\"\2?v=$V\"#g" *.html
echo "version $V"
