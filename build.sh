#! /bin/bash
# Linux Build Script
OLMCVER="1.0.1"
OLDDEBPACK="MCmake_${OLMCVER}_amd64"
MCVER="1.0.1"
DEBPACK="MCmake_${MCVER}_amd64"
#sudo npm -g install pkg
echo "Building for Windows x86"
mkdir -p "./dist"
mkdir -p "./build/win"
cp "./build/wininstall.ifp" "./build/win/wininstall.ifp"
pkg --no-bytecode --public --public-packages "*" -o "./build/win/mcmake.exe" -t node12-win-x86 .
cp "./build/LICENSE.txt" "./build/win/LICENSE.txt"

echo "Building for Mac OS x64"
mkdir -p "./build/mac"
pkg -o "./build/mac/mcmake" -t node12-macos-x64 .
cp "./build/LICENSE.txt" "./build/mac/LICENSE.txt"
echo "Compressing mcmake-${MCVER}-macos.tax.gz"
tar -czvf "./dist/mcmake-${MCVER}-macos.tax.gz" "./build/mac/"

echo "Building for Linux x64"
mkdir -p "./build/linux"
mkdir -p "./build/deb"
pkg -o "./build/linux/mcmake" -t node12-linux-x64 .
rm -rf "./build/deb/${OLDDEBPACK}"
cp "./build/LICENSE.txt" "./build/linux/LICENSE.txt"
mkdir "./build/deb/${DEBPACK}"
mkdir "./build/deb/${DEBPACK}/DEBIAN"
cp "./build/control" "./build/deb/${DEBPACK}/DEBIAN/control"
cp "./build/rules" "./build/deb/${DEBPACK}/DEBIAN/rules"
mkdir "./build/deb/${DEBPACK}/share"
mkdir "./build/deb/${DEBPACK}/share/doc"
mkdir "./build/deb/${DEBPACK}/share/doc/MCmake"
cp "./build/copyright" "./build/deb/${DEBPACK}/share/doc/MCmake/copyright"
mkdir "./build/deb/${DEBPACK}/usr"
mkdir "./build/deb/${DEBPACK}/usr/bin"
cp "./build/linux/mcmake" "./build/deb/${DEBPACK}/usr/bin/mcmake"

echo "Building ${DEBPACK}.deb"
dpkg -b "./build/deb/${DEBPACK}" "./dist/${DEBPACK}.deb"
echo "Compressing mcmake-${MCVER}-linux.tax.gz"
tar -czvf "./dist/mcmake-${MCVER}-linux.tax.gz" "./build/linux/"