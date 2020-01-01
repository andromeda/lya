rm timeResultsPure.txt
rm timeResultsLya.txt
cd sunspider
input="./LIST"
echo "We are going to run the test for pure programs"
while IFS= read -r line
do
	name=$line.js
	echo "******************************"
  	echo "We are processing this: $name"
  	echo "The name of file $name" >> timetests.txt
  	(/usr/bin/time node $name) >> "toRemove.txt" 2>> "timetests.txt"

done < "$input"

rm toRemove.txt
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
  	sed -i "s/${prevname}/${name}/" main.js
  	echo "The name of file $name" >> timeResultsLya.txt
  	(/usr/bin/time node main.js) >> "toRemove.txt" 2>> "timeResultsLya.txt"
  	prevname=$name

done < "$input"

rm toRemove.txt
sed -i "s/${prevname}/replaceme.js/" main.js
