#!/bin/bash
#We add a 1000 loops to a list of js programs

cd ../tests/sunspider1
input="./LIST"
echo "We are going to add the loops to the begining of all programs in sunspider"
while IFS= read -r line
do
	name=$line.js
	echo "This file first $name"
   	sed -i "1s/^/for (var loopiiii = 0; loopiiii < 100; loopiiii++) {\n/" $name 
	sed -i "\$a}" $name 
done < "$input"


