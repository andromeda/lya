for i in 1 2 3 4 5 6 7 8
do
	if [ $i -eq 1 ]; then
		dir=t$i
	else 
		dir=../t$i	
	fi
  	cd $dir
	[ -e staticSA.json ] && rm staticSA.json
	[ -e staticTD.json ] && rm staticTD.json

	key=1 node main.js 
	mv ./dynamic.json ./staticSA.json
	key=9 node main.js 
	mv ./dynamic.json ./staticTD.json
done
