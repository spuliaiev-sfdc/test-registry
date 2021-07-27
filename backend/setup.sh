#!/usr/bin/env bash
echo " This tool needs Node Version Manager (nvm)"
brew install nvm

echo ""
echo " Set up the Node 12 for execution"
nvm install 12

echo ""
echo "Install local environment for node to avoid custom repositories"
npm i npmrc -g

echo ""
echo " Switch to local environment without any repositories"
npmrc -c default
npmrc default

echo ""
echo " Install all the required modules"
npm i

