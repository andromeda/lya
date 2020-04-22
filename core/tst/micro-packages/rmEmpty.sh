STATIC_ANALYSIS="static.json"

removeEmpty() {
  cd $1
  if [ -s "$STATIC_ANALYSIS" ]
  then
    # if static analysis is empty remove folder
    cd ..
    rm -r $1
  else
    cd ..
  fi
}

for d in */; do
  removeEmpty $d
done

