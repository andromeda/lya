cd ../tst/synthetic

for name in t1 t2 t3 t4 t5 t6 t7 t8 t9
do
  if [ $name = "t1" ]; then
    cd $name
  else
    cd ../$name
  fi
  key=6 node main.js
  mv dynamic.json ../../../paper2/libraries/syntheticRWX/$name.json
done
