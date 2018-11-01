#!/usr/bin/env bash

set -e

git clone git@gitlab.com:gruut/gruut-authority.git
source /home/ubuntu/.nvm/nvm.sh

cd gruut-authority
echo "Running Server!"
npm install

npm start
