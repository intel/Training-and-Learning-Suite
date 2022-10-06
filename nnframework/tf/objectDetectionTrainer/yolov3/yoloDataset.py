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

import os
import objectDetectionTrainer.SSDnFasterRCNN.protos.label_pb2 as labelPB
import logging as log
import numpy as np
np.seterr(divide='ignore', invalid='ignore')

from collections import defaultdict
from google.protobuf import text_format
from object_detection.utils import label_map_util
from keras_yolo3.kmeans import YOLO_Kmeans

class YoloKmeans(YOLO_Kmeans):
    def iou(self, boxes, clusters):  # 1 box -> k clusters
        n = boxes.shape[0]
        k = self.cluster_number

        box_area = boxes[:, 0] * boxes[:, 1]
        box_area = box_area.repeat(k)
        box_area = np.reshape(box_area, (n, k))

        cluster_area = clusters[:, 0] * clusters[:, 1]
        cluster_area = np.tile(cluster_area, [1, n])
        cluster_area = np.reshape(cluster_area, (n, k))
        cluster_area[np.isnan(cluster_area)] = 0

        box_w_matrix = np.reshape(boxes[:, 0].repeat(k), (n, k))
        cluster_w_matrix = np.reshape(np.tile(clusters[:, 0], (1, n)), (n, k))
        min_w_matrix = np.minimum(cluster_w_matrix, box_w_matrix)

        box_h_matrix = np.reshape(boxes[:, 1].repeat(k), (n, k))
        cluster_h_matrix = np.reshape(np.tile(clusters[:, 1], (1, n)), (n, k))
        min_h_matrix = np.minimum(cluster_h_matrix, box_h_matrix)
        inter_area = np.multiply(min_w_matrix, min_h_matrix)

        result = inter_area / (box_area + cluster_area - inter_area)
        result[np.isnan(result)] = 0

        return result

class YoloDataset:
    def __init__(self, _jobData, _dataset):
        self.jobData = _jobData
        self.dataset = _dataset
        self.jobId = self.jobData['jobId']
        self.jobName = self.jobData['jobName']
        self.labels = self.jobData['labels']
        self.augmentation = self.jobData['datasetAug']
        self.duplicateFactor = 1
        
        if self.augmentation == None:
            self.duplicateFactor = 1
        else:
            if "duplicate_factor" in self.augmentation:
                self.duplicateFactor = self.augmentation['duplicate_factor']
            else:
                self.duplicateFactor = 1

    def createDataset(self):
        labels = []
        data = []

        def createLabelMap(labels, labelpath):
            f = open(labelpath + "/label.pbtxt", "w")
            for index, lbl in enumerate(labels):
                node = labelPB.Item()
                label = node.item.add()
                label.id = index+1
                label.name = lbl
                f.write(text_format.MessageToString(node))
            f.close()
            label_map_dict = label_map_util.get_label_map_dict(
                labelpath + "/label.pbtxt")
            return label_map_dict

        def createPath(jobId, jobName):
            parentDir = os.getcwd()
            directory = '{}_{}'.format(jobId, jobName)
            path = os.path.join(parentDir, 'data', directory)
            if not os.path.exists(path):
                os.makedirs(path)
            labelpath = os.path.join(path, 'label')
            if not os.path.exists(labelpath):
                os.makedirs(labelpath)
            checkpointDir = os.path.join(path, 'model')
            if not os.path.exists(checkpointDir):
                os.makedirs(checkpointDir)
            return labelpath, checkpointDir

        def createYOLOlabel(annotations, path):
            dataAnnotatedpath = os.path.join(path, 'data_annotations.txt')
            f = open(dataAnnotatedpath, 'w')
            for key in annotations.keys():
                f.write(key)
                boxInfo = annotations[key]
                for info in boxInfo:
                    xmin = int(info['xmin'])
                    ymin = int(info['ymin'])
                    width = int(info['width'])
                    height = int(info['height'])
                    classID = int(info['classID']-1)
                    box_info = " %d,%d,%d,%d,%d" % (xmin, ymin, width, height, classID)
                    f.write(box_info)
                f.write('\n')
            f.close()
            return dataAnnotatedpath

        def createYOLOclasses(label, path):
            classpath = os.path.join(path, 'label_classes.txt')
            f = open(classpath, 'w')
            for label in enumerate(labels):
                f.write(label[1])
                f.write('\n')
            f.close()
            return classpath

        labelPath, ckptDir = createPath(self.jobId, self.jobName)
        for lbl in self.labels:
            label = lbl['name'].split('_')[1]
            labels.append(label)

        labelMap = createLabelMap(labels, labelPath)
        classesPath = createYOLOclasses(labels, labelPath)
        annotations = defaultdict(list)

        for x in self.dataset:
            for imgData in x:
                for _i in range(0, int(self.duplicateFactor)):
                    imgFile = imgData['file']
                    imgPath = imgFile['path']
                    label = imgData['label']['name'].split("_")[1]
                    bbox = imgData['bbox']
                    xmin = bbox[0]
                    width = bbox[0]+bbox[2]
                    ymin = bbox[1]
                    height = bbox[1]+bbox[3]
                    classes = labelMap[label]
                    data = {
                        "xmin": xmin,
                        "ymin": ymin,
                        "width": width,
                        "height": height,
                        "classID": classes
                    }
                    annotations[imgPath].append(data)

        # --------------------------- Image Preprocessing ----------------------------------------------------
        # create path
        dataAnnotatedPath = createYOLOlabel(annotations, labelPath)

        # create anchors
        anchorsPath = os.path.join(labelPath, 'data_annotations_anchors.csv')
        kmeans = YoloKmeans(9, filename=dataAnnotatedPath)
        kmeans.txt2clusters(labelPath)

        return dataAnnotatedPath, classesPath, anchorsPath, ckptDir
