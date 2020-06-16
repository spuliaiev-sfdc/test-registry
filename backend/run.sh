#!/usr/bin/env bash

echo "Fetching the data from perforce"
/usr/local/bin/node ./src/check.js -u supreeth.murthy,kperumal  -f 2019/08/01 -t 2019/08/30 diffs

echo "Running the report and copying it into the clipboard"
/usr/local/bin/node ./src/check.js report -g > pbcopy
