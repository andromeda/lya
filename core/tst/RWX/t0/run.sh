#!/bin/bash

cat ../prologue.lya ./main.js ../epilogue.lya > generated.test

# Replace node with cat to see the generated script
node generated.test
