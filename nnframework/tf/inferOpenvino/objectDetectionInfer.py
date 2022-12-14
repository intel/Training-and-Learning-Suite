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

import sys
import os
import cv2
import numpy as np
import logging as log
from openvino.inference_engine import IECore
from PIL import Image
import io
import time
import base64

TMP_FILE = "/tmp/tmp.png"

def convertBase64(imgb64):
    encimgb64 = imgb64.split(",")[1]
    pads = len(encimgb64) % 4
    if pads == 2:
        encimgb64 += "=="
    elif pads == 3:
        encimgb64 += "="

    imgb64 = base64.b64decode(encimgb64)
    img = Image.open(io.BytesIO(imgb64))
    img.save(TMP_FILE)


def generateLabels(labels):
    label = []
    for x in labels:
        lbl = x['name'].split('_')[1]
        label.append(lbl)
    return label


def objectDetectionInfer(data):
    log.info("Loading Inference Engine")
    ie = IECore()
    PATH = os.path.join(
        './data/{}_{}/model').format(data['jobId'], data['jobName'])
    DEVICE = 'CPU'
    CONFIDENT = data['confident']

    # --------------------------- 1. Read IR Generated by ModelOptimizer (.xml and .bin files) ------------
    modelPath = os.path.join(PATH, 'FP32')
    model_xml = os.path.join(modelPath, 'frozen_inference_graph.xml')
    model_bin = os.path.splitext(model_xml)[0] + ".bin"
    log.info("Loading network files:\n\t{}\n\t{}".format(model_xml, model_bin))
    net = ie.read_network(model=model_xml, weights=model_bin)

    img_info_input_blob = None
    feed_dict = {}
    for blob_name in net.inputs:
        if len(net.inputs[blob_name].shape) == 4:
            input_blob = blob_name
        elif len(net.inputs[blob_name].shape) == 2:
            img_info_input_blob = blob_name
        else:
            raise RuntimeError("Unsupported {}D input layer '{}'. Only 2D and 4D input layers are supported"
                               .format(len(net.inputs[blob_name].shape), blob_name))

    assert len(net.outputs) == 1, "Demo supports only single output topologies"

    # --------------------------- Performing inference ----------------------------------------------------

    out_blob = next(iter(net.outputs))
    log.info("Loading IR to the plugin...")
    exec_net = ie.load_network(
        network=net, num_requests=2, device_name=DEVICE)
    # Read and pre-process input image
    n, c, h, w = net.inputs[input_blob].shape
    if img_info_input_blob:
        feed_dict[img_info_input_blob] = [h, w, 1]

    labels = generateLabels(data['labels'])
    convertBase64(data['image'])

    cur_request_id = 0
    next_request_id = 1

    frame = cv2.imread(TMP_FILE)
    frame_h, frame_w = frame.shape[:-1]

    in_frame = cv2.resize(frame, (w, h))
    # Change data layout from HWC to CHW
    in_frame = in_frame.transpose((2, 0, 1))
    in_frame = in_frame.reshape((n, c, h, w))
    feed_dict[input_blob] = in_frame
    inf_start = time.time()
    exec_net.start_async(request_id=cur_request_id, inputs=feed_dict)
    if exec_net.requests[cur_request_id].wait(-1) == 0:
        inf_end = time.time()
        det_time = inf_end - inf_start

    # Parse detection results of the current request
        res = exec_net.requests[cur_request_id].outputs[out_blob]
        for obj in res[0][0]:
            # Draw only objects when probability more than specified threshold
            if obj[2] > CONFIDENT:
                xmin = int(obj[3] * frame_w)
                ymin = int(obj[4] * frame_h)
                xmax = int(obj[5] * frame_w)
                ymax = int(obj[6] * frame_h)
                class_id = int(obj[1])
                # Draw box and label\class_id
                color = (min(class_id * 12.5, 255),
                         min(class_id * 7, 255), min(class_id * 5, 255))
                cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)
                det_label = labels[class_id-1]
                cv2.putText(frame, det_label + ' ' + str(round(obj[2] * 100, 1)) + ' %', (xmin, ymin - 7),
                            cv2.FONT_HERSHEY_COMPLEX, 0.6, color, 1)

    # Draw performance stats

    inf_time_message = "Inference time: {:.3f} ms".format(det_time * 1000)
    cv2.putText(frame, inf_time_message, (15, 15),
                cv2.FONT_HERSHEY_COMPLEX, 0.5, (200, 10, 10), 1)

    retval, encoded = cv2.imencode('.jpeg', frame)
    jpgb64 = base64.b64encode(encoded).decode('ascii')
    return jpgb64
