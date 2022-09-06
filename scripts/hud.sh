#!/usr/bin/dash

df -h

echo

mount | grep mapper

echo

dir=$(dirname $0)

nvr=$(node $dir/summarizeNVRJSFiles.js 15)
echo "$nvr" | head -1
echo "$nvr" | tail -15


