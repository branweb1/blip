#!/usr/bin/env bash

ICONS=(incr decr pause)

for icon in ${ICONS[@]}; do
  cp "${icon}.svg" "${icon}-hover.svg"
  sed -i 's/#111/#cc0033/g' "${icon}-hover.svg"
done
