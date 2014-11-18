#!/bin/bash

today=$(date "+%Y.%m.%d")
echo $today
find $1 -type f -not -name "*.gz" | while read file; do
  bname=$(basename $file)
  if [ "$bname" \< "$today" ]; then
    echo "zipping $file"
    gzip $file
  fi
done
