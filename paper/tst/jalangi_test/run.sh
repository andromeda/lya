#!/bin/bash

# set -e

rm timeResultsPure.txt
rm timeResultsLya.txti
rm timeResultsLyaNOWITH.txt
cd sunspider

input="./LIST"
echo "We are going to run the test for pure programs"
while IFS= read -r line
do
	name=$line.js
	echo "******************************"
  	echo "We are processing this: $name"
  	echo "The name of file $name" >> timetests.txt
  	(time node $name) >> /dev/null 2>> "timetests.txt"

done < "$input"

mv ./timetests.txt ../timeResultsPure.txt
cd ../

echo "******************************"
echo "******************************"
echo "We are going to run the test for programs with lya"

prevname="replaceme.js"
input="./sunspider/LIST"
while IFS= read -r line
do
	name=$line.js
	echo "******************************"
  	echo "We are processing this: $name"
  	sed -i "s/${prevname}/${name}/" noWith.js
  	echo "The name of file $name" >> timeResultsLyaNOWITH.txt
  	(time node noWith.js) >>  /dev/null 2>> "timeResultsLyaNOWITH.txt"
  	prevname=$name

done < "$input"

sed -i "s/${prevname}/replaceme.js/" noWith.js

prevname="replaceme.js"
input="./sunspider/LIST"
while IFS= read -r line
do
	name=$line.js
	echo "******************************"
  	echo "We are processing this: $name"
  	sed -i "s/${prevname}/${name}/" main.js
  	echo "The name of file $name" >> timeResultsLya.txt
  	(time node main.js) >>  /dev/null 2>> "timeResultsLya.txt"
  	prevname=$name

done < "$input"

sed -i "s/${prevname}/replaceme.js/" main.js

echo "******************************"
echo "******************************"
echo "We are going to run the test for programs with lya but noWith"


