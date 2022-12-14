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
import sys
import time
import cv2
import numpy as np
from openvino.inference_engine import IENetwork, IECore
from inferOpenvino.instance_segmentation_demo.visualizer import Visualizer
from PIL import Image
import io
import base64

TMP_FILE = "/tmp/tmp.png"

def generateLabels(labels):
    label = []
    for x in labels:
        lbl = x['name'].split('_')[1]
        label.append(lbl)
    return label


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


def expand_box(box, scale):
    w_half = (box[2] - box[0]) * .5
    h_half = (box[3] - box[1]) * .5
    x_c = (box[2] + box[0]) * .5
    y_c = (box[3] + box[1]) * .5
    w_half *= scale
    h_half *= scale
    box_exp = np.zeros(box.shape)
    box_exp[0] = x_c - w_half
    box_exp[2] = x_c + w_half
    box_exp[1] = y_c - h_half
    box_exp[3] = y_c + h_half
    return box_exp


def segm_postprocess(box, raw_cls_mask, im_h, im_w):
    # Add zero border to prevent upsampling artifacts on segment borders.
    raw_cls_mask = np.pad(raw_cls_mask, ((1, 1), (1, 1)),
                          'constant', constant_values=0)
    extended_box = expand_box(
        box, raw_cls_mask.shape[0] / (raw_cls_mask.shape[0] - 2.0)).astype(np.uint32)
    w, h = np.maximum(extended_box[2:] - extended_box[:2] + 1, 1)
    x0, y0 = np.clip(extended_box[:2], a_min=0, a_max=[im_w, im_h])
    x1, y1 = np.clip(extended_box[2:] + 1, a_min=0, a_max=[im_w, im_h])

    raw_cls_mask = cv2.resize(raw_cls_mask, (w, h)) > 0.5
    mask = raw_cls_mask.astype(np.uint8)
    # Put an object mask in an image mask.
    im_mask = np.zeros((im_h, im_w), dtype=np.uint8)
    im_mask[y0:y1, x0:x1] = mask[(y0 - extended_box[1]):(y1 - extended_box[1]),
                                 (x0 - extended_box[0]):(x1 - extended_box[0])]
    return im_mask


def segmentationInfer(data):
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

    n, c, h, w = net.inputs['image_tensor'].shape

    log.info('Loading IR to the plugin...')
    exec_net = ie.load_network(network=net, device_name=DEVICE, num_requests=2)

    labels = generateLabels(data['labels'])
    visualizer = Visualizer(labels)
    convertBase64(data['image'])
    frame = cv2.imread(TMP_FILE)
    scale_x = scale_y = min(h / frame.shape[0], w / frame.shape[1])
    input_image = cv2.resize(frame, None, fx=scale_x, fy=scale_y)
    input_image_size = input_image.shape[:2]
    frame_h, frame_w = input_image.shape[:2]
    input_image = np.pad(input_image, ((0, h - input_image_size[0]),
                                       (0, w - input_image_size[1]),
                                       (0, 0)),
                         mode='constant', constant_values=0)
    # Change data layout from HWC to CHW.
    input_image = input_image.transpose((2, 0, 1))
    input_image = input_image.reshape((n, c, h, w)).astype(np.float32)
    input_image_info = np.asarray(
        [[input_image_size[0], input_image_size[1], 1]], dtype=np.float32)

    # Run the net.
    inf_start = time.time()
    # Parse detection results of the current request
    outputs = exec_net.infer(
        {'image_tensor': input_image, 'image_info': input_image_info})
    inf_end = time.time()
    det_time = inf_end - inf_start
    do_data = outputs['reshape_do_2d']
    scores = []
    boxes = []
    classes = []
    for obj in do_data:
        box = []
        class_id = int(obj[1])
        score = obj[2]
        xmin = obj[3]*frame_w
        box.append(xmin)
        ymin = obj[4]*frame_h
        box.append(ymin)
        xmax = obj[5]*frame_w
        box.append(xmax)
        ymax = obj[6]*frame_h
        box.append(ymax)
        boxes.append(box)
        scores.append(score)
        classes.append(class_id-1)
    boxes = np.array(boxes)
    classes = np.array(classes)
    scores = np.array(scores)
    masks = []
    for box, cls, raw_mask in zip(boxes, classes, outputs['masks']):
        raw_cls_mask = raw_mask[cls, ...]
        mask = segm_postprocess(
            box, raw_cls_mask, frame.shape[0], frame.shape[1])
        masks.append(mask)

    # # Filter out detections with low confidence.
    detections_filter = scores > CONFIDENT
    scores = scores[detections_filter]
    classes = classes[detections_filter]
    boxes = boxes[detections_filter]
    masks = list(segm for segm, is_valid in zip(
        masks, detections_filter) if is_valid)

    # Visualize masks.
    frame = visualizer(frame, boxes, classes, scores, masks, None)
    # Draw performance stats.
    inf_time_message = 'Inference time: {:.3f} ms'.format(det_time * 1000)
    cv2.putText(frame, inf_time_message, (15, 15),
                cv2.FONT_HERSHEY_COMPLEX, 0.5, (200, 10, 10), 1)

    retval, encoded = cv2.imencode('.jpeg', frame)
    jpgb64 = base64.b64encode(encoded).decode('ascii')
    return jpgb64
