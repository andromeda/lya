#!/bin/bash

set -e

[ -e timeResultsJalangiEns.txt ] && rm timeResultsJalangiEns.txt
[ -e timeResultsJalangiDir.txt ] && rm timeResultsJalangiDir.txt
[ -e timeResultsJalangi.txt    ] && rm timeResultsJalangi.txt

input="../tests/sunspider1/LIST"
while IFS= read -r line
do
        name=$line.js
        echo "******************************"
        echo "We are processing this: $name"
	echo "The name of file $name" >> timeResultsJalangiEns.txt
        echo "The name of file $name" >> timeResultsJalangiDir.txt
        echo "The name of file $name" >> timeResultsJalangi.txt

        (time node ../src/js/commands/esnstrument_cli.js --inlineIID --inlineSource  ../tests/sunspider1/$name) > /dev/null 2>> "timeResultsJalangiEns.txt"
        (time node ../src/js/commands/direct.js --analysis analysis.js ../tests/sunspider1/$name) > /dev/null 2>> "timeResultsJalangiDir.txt"
        (time node ../src/js/commands/jalangi.js --inlineIID --inlineSource --analysis analysis.js ../tests/sunspider1/$name) > /dev/null 2>> "timeResultsJalangi.txt"
done < "$input"

