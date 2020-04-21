#!/bin/bash
# Fetch mir-sa.jar tool

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR

curl -O http://nikos.vasilak.is/sw/mir-sa.jar
