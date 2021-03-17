#!/usr/bin/env bash
set -euo pipefail

msg()
{
  local message="$1"
  local bold=$(tput bold)
  local normal=$(tput sgr0)

  echo "${bold}${message}${normal}"
}

msg "Starting lya demo2"
sleep 4

echo -e "\n"
msg "Example of a bottleneck module"
sleep 2
cd bottleneck
msg "We first run the program without any analysis"
node example.js
msg "We can see that the program run quite slowly"
sleep 2
msg "We run it again with a performance analysis to detect the slow parts of the
program"
../../../lya.js example.js -p -a call-times
msg "We can see that the slow function is require('crypto').pbkdf2Sync"
cd ..
sleep 2

echo -e "\n"
msg "Example of a payload offload to a remote web server that executes a eval
command"
sleep 2
cd eval
rm personal.data -rf
msg "We check that are is not a personal.data file on directory"
ls 
sleep 2 
msg "We run the attack"
msg "Run 'node http-server.js' on another terminal window"
read -p "Press any key to continue... " -n1 -s
node attack.js
msg "We check again that a personal.data has been created in directory"
ls 
sleep 2
msg "The payload created a personal.data file on the server"
msg "We rerun the attack in order to detect it with lya"
sleep 2
msg "Run '../../../lya.js http-server.js -p --prop-exclude eval' on another terminal window"
read -p "Press any key to continue... " -n1 -s
node attack.js
echo -e "\n"
msg "The eval attack should be printed"
cd ..
sleep 2

echo -e "\n"
msg "We try to detect a module turned malicious"
echo 2
cd malicious
rm node_modules -rf
msg "We install version 1.0.0 of @andromeda/calc"
npm install @andromeda/calc@1.0.0
node main.js
msg "This version is pure"
sleep 2
msg "We install version 2.0.0 of @andromeda/calc"
npm install @andromeda/calc@2.0.0
../../../lya.js main.js -p --prop-exclude eval
msg "This is a malicious version"
msg "It reads personal.info file and writes your data at pass.info"
ls
sleep 2


echo -e "\n\n"
msg "End of demo2!"
