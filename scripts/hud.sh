#!/usr/bin/dash

pm2 status

echo
echo
echo

df -h | grep -v -E ' /dev|/run|/sys|/boot'

echo
echo
echo

echo "Mounts"
mount | grep mapper

echo
echo
echo

dir=$(dirname $0)
nvr=$(node $dir/summarizeNVRJSFiles.js 15)
echo "$nvr" | head -1
echo "$nvr" | tail -5

