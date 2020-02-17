for i in 1 2 3 4 5 6 7 8
do
	if [ $i -eq 1 ]; then
		dir=t$i
	else 
		dir=../t$i	
	fi
  	cd $dir
	[ -e dynamic.json ] && rm dynamic.json

	key=1 node main.js
	cmp --silent ./dynamic.json ./staticSA.json || echo "files at t$i are different -- SA"
	
	[ -e dynamic.json ] && rm dynamic.json
	key=9 node main.js
	cmp --silent ./dynamic.json ./staticTD.json || echo "files at t$i are different -- TD"
done