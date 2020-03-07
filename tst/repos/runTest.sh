for name in chalk classnames colorette debug mkdirp moment yargs 
do
	if [ $name = "chalk" ]; then
		cd ./$name
	else
		cd ../$name
	fi

	for i in 10 11 12
	do 
		if [ $name = "moment" ]; then
			key=$i node main.js > /dev/null
		else
			npm --key=$i test > /dev/null
		fi

		if [ $name = "debug" ] || [ $name = "moment" ]; then
			mv ./dynamic.json ../../../paper2/libraries/moreDynamic/$name/dynamic$i.json
		else
			mv ./test/dynamic.json ../../../paper2/libraries/moreDynamic/$name/dynamic$i.json
		fi
	done
done

cd ../minimist
for name in dotted long short stop_early whitespace
do 
	if [ $name = "dotted" ]; then
                cd ./$name
        else
                cd ../$name
        fi

	for i in 10 11 12 
	do
		key=$i node $name.js > /dev/null
		mv dynamic.json ../../../../paper2/libraries/moreDynamic/minimist/$name/dynamic$i.json
	done
done		
