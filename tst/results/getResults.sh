#!/bin/bash

PRE="_correct"

cd depth
for d in *; do
  echo "$d"
  grep correct $d > $d$PRE
done

cd ../context
for d in *; do
  echo "$d"
  grep correct $d > $d$PRE
done

cd ../depth_no_children
for d in *; do
  echo "$d"
  grep correct $d > $d$PRE
done
