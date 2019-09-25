#! /bin/bash
#sudo npm -g install pkg
echo "Building for Windows x64"
pkg -o "./build/mcmake-winx64.exe" -t node12-win-x64 .
echo "Building for Windows x86"
pkg --no-bytecode --public --public-packages "*" -o "./build/mcmake-winx86.exe" -t node12-win-x86 .
echo "Building for Mac OS x64"
pkg -o "./build/mcmake-macosx64" -t node12-macos-x64 .
echo "Building for Linux x64"
pkg -o "./build/mcmake-linuxx64" -t node12-linux-x64 .