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
msg "Example of a payload offload to a remote web server that executes a eval command"
sleep 2
cd eval
rm personal.data
msg "We first confirm that are is no personal.data file in this directory"
ls -l *.data
sleep 2 
msg "We run the attack"
msg "We first launch the HTTP server"
node http-server.js &
msg "We then send a malicious payload"
node attack.js
msg "We confirm that a personal.data has been created"
ls -l *.data
sleep 2
msg "The payload created a personal.data file on the server"
msg "We now run the HTTP server with lya"
sleep 2
# (Bug? why exclude eval from tracing?)
../../../lya.js http-server.js -p --prop-exclude eval &
msg "We then send a malicious payload"
node attack.js
echo -e "\n"
msg "The eval attack should be printed"
cd ..
sleep 2
# (Bug?: why not show accesses in the context of the library?)

echo -e "\n"
msg "We try to detect a module turned malicious"
echo 2
cd malicious
rm node_modules -rf
msg "We install version 1.0.0 of @andromeda/calc"
npm install @andromeda/calc@1.0.0
node main.js
msg "This version is not malicious and works as expected"
sleep 2
msg "We now install version 2.0.0 of @andromeda/calc"
npm install @andromeda/calc@2.0.0
../../../lya.js main.js -p --prop-exclude eval
msg "This is a malicious version"
msg "It reads a personal.info file and writes to pass.info"
ls
sleep 2


echo -e "\n"
msg "Example of a bottleneck module"
sleep 2
cd bottleneck
msg "We first run the program without any analysis"
node example.js
msg "The program has a performance bottleneck"
sleep 2
msg "We run it again with a simple performance analysis to extract call times"
../../../lya.js example.js -p -a call-times
msg "We can see that pbkdf2Sync is the slowest function call"
cd ..
sleep 2

echo -e "\n\n"
msg "End of demo2!"
