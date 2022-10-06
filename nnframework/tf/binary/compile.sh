#!/bin/bash

scriptdir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )

rm -rf deploy
mkdir deploy

cp -rf $scriptdir/../autoencoderTrainer deploy/
cp -rf $scriptdir/../classificationTrainer deploy/
cp -rf $scriptdir/../objectDetectionTrainer deploy/
cp -rf $scriptdir/../segmentationTrainer deploy/
cp -rf $scriptdir/../visualizer deploy/
cp -rf $scriptdir/../callback deploy/
cp -rf $scriptdir/../inferOpenvino deploy/
cp -rf $scriptdir/../mo_tfOpenvino deploy/
cp -rf $scriptdir/../*.py deploy/
cp -rf $scriptdir/../env.sh deploy/
cp -rf $scriptdir/../startNN.sh deploy/

cp -rf $scriptdir/setup.py deploy/

cd deploy
python3 setup.py build_ext --inplace

find . -name "*.py" -type f -delete
find . -name "*.o" -type f -delete
find . -name "*.cpp" -type f -delete
find . -name "*.c" -type f -delete

rm -rf build

