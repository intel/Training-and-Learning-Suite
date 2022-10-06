# Copyright (c) 2020 Intel Corporation.

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

FROM ubuntu:bionic

ARG http_proxy
ARG https_proxy
ARG no_proxy
ARG socks_proxy
ARG user
ARG uid

ENV DEBIAN_FRONTEND=noninteractive \
    TERM=xterm \
    http_proxy=${http_proxy}   \
    https_proxy=${https_proxy} \
    no_proxy=${no_proxy} \
    socks_proxy=${socks_proxy} \
    LANG='C.UTF-8'  \
    LC_ALL='C.UTF-8'

RUN apt-get update -qq && apt-get install -y -qq wget curl git
RUN git config --global url."git@github.com:".insteadOf "https://github.com/"			
RUN	git config --global url."https://github.com/".insteadOf "git://github.com/"
RUN git config --global http.postBuffer 524288000
    
ENV USER=${user}
ENV HOME /home/${user}
WORKDIR ${HOME}

RUN groupadd ${user} -g ${uid}
RUN adduser --shell /bin/bash --disabled-password --gecos "" ${user} --gid ${uid} --uid ${uid}

RUN apt-get install software-properties-common -y && add-apt-repository ppa:deadsnakes/ppa -y \
    && apt-get update -qq && apt-get install -y -qq nano python3.7 python3.7-dev python3.7-distutils net-tools iputils-ping python-celery-common python3-pip libgtk-3-0 protobuf-compiler libjpeg-dev \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.7 1 \
    && update-alternatives --set python3 /usr/bin/python3.7
RUN apt-get install -y -qq net-tools iputils-ping python-celery-common python3-pip libgtk-3-0 protobuf-compiler libjpeg-dev
COPY nnframework ${HOME}/nnframework-tmp
RUN cd ${HOME}/nnframework-tmp/tf && python3 -m pip install --upgrade pip --user && python3 -m pip install --default-timeout=2000 Pillow lxml tk && python3 -m pip install --default-timeout=2000 -r requirements.txt

RUN cd ${HOME}/nnframework-tmp/tf/binary \
    && ./compile.sh

RUN mkdir -p ${HOME}/nnframework
RUN cp -rf ${HOME}/nnframework-tmp/tf/binary/deploy ${HOME}/nnframework/tf
RUN rm -rf ${HOME}/nnframework-tmp

RUN cd /tmp \
    && git clone https://github.com/cocodataset/cocoapi.git && cd cocoapi/PythonAPI \
    && python3 setup.py build_ext --inplace \
    && cp -rf pycocotools ${HOME}/nnframework/tf/

RUN cd /tmp \	
    && git clone https://github.com/tensorflow/models \
    && cd models/research \
    && git checkout 04c0409c400492a6079154e7659d6d09e0a6dada \
    && protoc object_detection/protos/*.proto --python_out=. \
    && cp -r object_detection ${HOME}/nnframework/tf/ \
    && cp -r slim ${HOME}/nnframework/tf/ \
    && python3 -m pip install pycocotools tf_slim

RUN cd ${HOME}/nnframework/tf/objectDetectionTrainer/yolov3 \
    && rm -rf keras-yolo3 \
    && git clone -b devel https://github.com/Borda/keras-yolo3.git keras-yolo3 \
    && cd keras-yolo3 \
    && git checkout 78f15139ebcfcba5215602aa9b7431fab767cd17

RUN cd ${HOME}/nnframework/tf/objectDetectionTrainer/yolov3/keras-yolo3 \
    && wget https://pjreddie.com/media/files/yolov3.weights \
    && python3 scripts/convert_weights.py --config_path model_data/yolo.cfg --weights_path yolov3.weights --output_path ../model/yolo.h5 \
    && sed -i -e 's/K.cast(grid\_shape\[\:\:-1]/K.cast(grid_shape[...,::-1]/g' keras_yolo3/model.py \
    && sed -i -e 's/K.cast(input\_shape\[\:\:-1]/K.cast(input_shape[...,::-1]/g' keras_yolo3/model.py

RUN cd nnframework/tf/objectDetectionTrainer/SSDnFasterRCNN/pretrainedModel \
    && ./download-models.sh

RUN cd nnframework/tf/segmentationTrainer/pretrainedModel \
    && ./download-models.sh

RUN cd nnframework/tf/objectDetectionTrainer/SSDnFasterRCNN/protos \
    && protoc label.proto --python_out=.

#Removing build dependencies
RUN apt-get remove -y wget && \
    apt-get remove -y git  && \
    apt-get remove curl -y && \
    apt-get autoremove -y

VOLUME ["/opt/intel/"]

COPY nnframework/tf/startNN.sh ${HOME}/start.sh
RUN chmod +x ${HOME}/start.sh
RUN chown -R ${user}:${user} nnframework

USER ${user}

CMD ["./start.sh"]
