loopNumber=100
for ((i=0; i<=loopNumber; i=i+1))
do
  (time node app.js) >> /dev/null 2>> saveMe.txt 
done

