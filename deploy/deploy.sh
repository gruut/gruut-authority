#!/usr/bin/env bash
set -e

eval $(ssh-agent -s)
echo "${PRIVATE_KEY}" | tr -d '\r' | ssh-add - > /dev/null

mkdir -p ~/.ssh/
touch ~/.ssh/config
echo -e "Host */n/tStrictHostChecking no/n/n" >> ~/.ssh/config

echo "Deploying to ${DEPLOY_SERVER}"
