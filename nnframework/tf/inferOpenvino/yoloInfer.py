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


import logging as log
import os
import cv2
import sys
import base64
import numpy as np
import time
import io

from PIL import Image
from math import exp as exp
from openvino.inference_engine import IENetwork, IECore

TMP_FILE = "/tmp/tmp.png"

class YoloParams:
    # ------------------------------------------- Extracting layer parameters ------------------------------------------
    # Magic numbers are copied from yolo samples
    def __init__(self, param, side, anchors):
        self.num = 3 if 'num' not in param else int(param['num'])
        self.coords = 4 if 'coords' not in param else int(param['coords'])
        self.classes = 80 if 'classes' not in param else int(param['classes'])
        self.side = side
        self.anchors = anchors

        self.isYoloV3 = False

        if param.get('mask'):
            mask = [int(idx) for idx in param['mask'].split(',')]
            self.num = len(mask)

            maskedAnchors = []
            for idx in mask:
                maskedAnchors += [self.anchors[idx * 2], self.anchors[idx * 2 + 1]]
            self.anchors = maskedAnchors

            self.isYoloV3 = True # Weak way to determine but the only one.

def entry_index(side, coord, classes, location, entry):
    side_power_2 = side ** 2
    n = location // side_power_2
    loc = location % side_power_2
    return int(side_power_2 * (n * (coord + classes + 1) + entry) + loc)

def scale_bbox(x, y, h, w, class_id, confidence, h_scale, w_scale):
    xmin = int((x - w / 2) * w_scale)
    ymin = int((y - h / 2) * h_scale)
    xmax = int(xmin + w * w_scale)
    ymax = int(ymin + h * h_scale)
    return dict(xmin=xmin, xmax=xmax, ymin=ymin, ymax=ymax, class_id=class_id, confidence=confidence)

def parse_yolo_region(blob, resized_image_shape, original_im_shape, params, threshold):
    # ------------------------------------------ Validating output parameters ------------------------------------------
    _, _, out_blob_h, out_blob_w = blob.shape
    assert out_blob_w == out_blob_h, "Invalid size of output blob. It sould be in NCHW layout and height should " \
                                     "be equal to width. Current height = {}, current width = {}" \
                                     "".format(out_blob_h, out_blob_w)

    # ------------------------------------------ Extracting layer parameters -------------------------------------------
    orig_im_h, orig_im_w = original_im_shape
    resized_image_h, resized_image_w = resized_image_shape
    objects = list()
    predictions = blob.flatten()
    side_square = params.side * params.side

    # ------------------------------------------- Parsing YOLO Region output -------------------------------------------
    for i in range(side_square):
        row = i // params.side
        col = i % params.side
        for n in range(params.num):
            obj_index = entry_index(params.side, params.coords, params.classes, n * side_square + i, params.coords)
            scale = predictions[obj_index]
            if scale < threshold:
                continue
            box_index = entry_index(params.side, params.coords, params.classes, n * side_square + i, 0)
            # Network produces location predictions in absolute coordinates of feature maps.
            # Scale it to relative coordinates.
            x = (col + predictions[box_index + 0 * side_square]) / params.side
            y = (row + predictions[box_index + 1 * side_square]) / params.side
            # Value for exp is very big number in some cases so following construction is using here
            try:
                w_exp = exp(predictions[box_index + 2 * side_square])
                h_exp = exp(predictions[box_index + 3 * side_square])
            except OverflowError:
                continue
            # Depends on topology we need to normalize sizes by feature maps (up to YOLOv3) or by input shape (YOLOv3)
            w = w_exp * params.anchors[2 * n] / (resized_image_w if params.isYoloV3 else params.side)
            h = h_exp * params.anchors[2 * n + 1] / (resized_image_h if params.isYoloV3 else params.side)
            for j in range(params.classes):
                class_index = entry_index(params.side, params.coords, params.classes, n * side_square + i,
                                          params.coords + 1 + j)
                confidence = scale * predictions[class_index]
                if confidence < threshold:
                    continue
                objects.append(scale_bbox(x=x, y=y, h=h, w=w, class_id=j, confidence=confidence,
                                          h_scale=orig_im_h, w_scale=orig_im_w))
    return objects


def intersection_over_union(box_1, box_2):
    width_of_overlap_area = min(box_1['xmax'], box_2['xmax']) - max(box_1['xmin'], box_2['xmin'])
    height_of_overlap_area = min(box_1['ymax'], box_2['ymax']) - max(box_1['ymin'], box_2['ymin'])
    if width_of_overlap_area < 0 or height_of_overlap_area < 0:
        area_of_overlap = 0
    else:
        area_of_overlap = width_of_overlap_area * height_of_overlap_area
    box_1_area = (box_1['ymax'] - box_1['ymin']) * (box_1['xmax'] - box_1['xmin'])
    box_2_area = (box_2['ymax'] - box_2['ymin']) * (box_2['xmax'] - box_2['xmin'])
    area_of_union = box_1_area + box_2_area - area_of_overlap
    if area_of_union == 0:
        return 0
    return area_of_overlap / area_of_union


def get_anchors(anchorspath):
    with open(anchorspath) as f:
        anchors = f.readlines()
    arr = []
    for a in anchors:
        arr += [ float(x) for x in a.split(",") ]    
    return arr

def to_base64(imgb64):
    encimgb64 = imgb64.split(",")[1]
    pads = len(encimgb64) % 4
    if pads == 2:
        encimgb64 += "=="
    elif pads == 3:
        encimgb64 += "="

    imgb64 = base64.b64decode(encimgb64)
    img = Image.open(io.BytesIO(imgb64))
    img.save(TMP_FILE)
    return TMP_FILE

def gen_labels(labels):
    label = []
    for x in labels:
        lbl = x['name'].split('_')[1]
        label.append(lbl)
    return label

def yoloInfer(data):
    log.info("Loading Inference Engine")

    
    PATH = os.path.join('./data/{}_{}/model').format(data['jobId'], data['jobName'])
    DEVICE = 'CPU'
    CONFIDENT = data['confident']

    anchorspath = os.path.join('./data/{}_{}/label/data_annotations_anchors.csv').format(data['jobId'], data['jobName'])
    anchors = get_anchors(anchorspath)

    modelPath = os.path.join(PATH, 'FP32')
    model_xml = os.path.join(modelPath, 'frozen_inference_graph.xml')
    model_bin = os.path.splitext(model_xml)[0] + ".bin"

    # ------------- 1. Plugin initialization for specified device and load extensions library if specified -------------
    ie = IECore()
    # -------------------- 2. Reading the IR generated by the Model Optimizer (.xml and .bin files) --------------------
    log.info("Loading network files:\n\t{}\n\t{}".format(model_xml, model_bin))
    # net = IENetwork(model=model_xml, weights=model_bin)
    net = ie.read_network(model_xml, model_bin)

    # ---------------------------------------------- 4. Preparing inputs -----------------------------------------------
    log.info("Preparing inputs")
    input_blob = next(iter(net.inputs))

    #  Defaulf batch_size is 1
    net.batch_size = 1

    # Read and pre-process input images
    n, c, h, w = net.inputs[input_blob].shape

    labels_map = gen_labels(data['labels'])
    TMP_FILE = to_base64(data['image'])

    # ----------------------------------------- 5. Loading model to the plugin -----------------------------------------
    log.info("Loading model to the plugin")
    exec_net = ie.load_network(network=net, num_requests=2, device_name=DEVICE)

    cur_request_id = 0

    # ----------------------------------------------- 6. Doing inference -----------------------------------------------
    log.info("Starting inference...")

    frame = cv2.imread(TMP_FILE)
    in_frame = cv2.resize(frame, (w, h))
    in_frame = in_frame.transpose((2, 0, 1))
    in_frame = in_frame.reshape((n, c, h, w))

    # Start inference
    start_time = time.time()
    exec_net.start_async(request_id=cur_request_id, inputs={input_blob: in_frame})
    end_time = time.time()
    det_time = end_time - start_time

    objects = list()
    if exec_net.requests[cur_request_id].wait(-1) == 0:
        output = exec_net.requests[cur_request_id].outputs
        for layer_name, out_blob in output.items():
            out_blob = out_blob.reshape(net.layers[net.layers[layer_name].parents[0]].shape)
            layer_params = YoloParams(net.layers[layer_name].params, out_blob.shape[2], anchors)
            objects += parse_yolo_region(out_blob, in_frame.shape[2:], frame.shape[:-1], layer_params, CONFIDENT)

    objects = sorted(objects, key=lambda obj : obj['confidence'], reverse=True)
    for i in range(len(objects)):
        if objects[i]['confidence'] == 0:
            continue
        for j in range(i + 1, len(objects)):
            if intersection_over_union(objects[i], objects[j]) > 0.4 and objects[i]['class_id'] == objects[j]['class_id']:
                objects[j]['confidence'] = 0

    objects = [obj for obj in objects if obj['confidence'] >= CONFIDENT]

    origin_im_size = frame.shape[:-1]
    for obj in objects:
        # Validation bbox of detected object
        if obj['xmax'] > origin_im_size[1]:
            obj['xmax'] = origin_im_size[1]

        if obj['ymax'] > origin_im_size[0]:
            obj['ymax'] = origin_im_size[0]

        if obj['xmin'] < 0:
            obj['xmin'] = 0
    
        if obj['ymin'] < 0:
            obj['ymin'] = 0

        color = (int(min(obj['class_id'] * 12.5, 255)), min(obj['class_id'] * 7, 255), min(obj['class_id'] * 5, 255))
        det_label = labels_map[obj['class_id']] if labels_map and len(labels_map) >= obj['class_id'] else str(obj['class_id'])
        cv2.rectangle(frame, (obj['xmin'], obj['ymin']), (obj['xmax'], obj['ymax']), color, 2)
        cv2.putText(frame,"#" + det_label + ' ' + str(round(obj['confidence'] * 100, 1)) + ' %',(obj['xmin'], obj['ymin'] - 7), cv2.FONT_HERSHEY_COMPLEX, 0.6, color, 1)
    
    # Draw performance stats over frame
    inf_time_message = "Inference time: {:.3f} ms".format(det_time * 1e3)
    cv2.putText(frame, inf_time_message, (15, 15), cv2.FONT_HERSHEY_COMPLEX, 0.5, (200, 10, 10), 1)
    retval, encoded = cv2.imencode('.jpeg', frame)
    jpgb64 = base64.b64encode(encoded).decode('ascii')
    return jpgb64
