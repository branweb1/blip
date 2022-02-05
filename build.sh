#!/usr/bin/env bash

if [ -d "./build" ]; then
  rm -rf build
  mkdir build
else
  mkdir build
fi


FILES=$(ls .)

for FILE in ${FILES[@]}; do
  if [[ "$FILE" != "build" && "$FILE" != "build.sh" ]]; then
    cp -r "$FILE" "./build/${FILE}"
  fi  
done
