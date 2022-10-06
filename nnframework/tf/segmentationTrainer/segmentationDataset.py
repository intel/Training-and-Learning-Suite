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

from object_detection.utils import label_map_util
import objectDetectionTrainer.SSDnFasterRCNN.protos.label_pb2 as labelPB
from sklearn.model_selection import train_test_split
from google.protobuf import text_format
from object_detection.dataset_tools import tf_record_creation_util
from object_detection.utils import dataset_util
from collections import defaultdict
from pycocotools import mask
import os
import tensorflow as tf
import contextlib2
import io
import PIL.Image
import hashlib
import numpy as np

class segmentationDataset:
    def __init__(self, _jobData, _dataset):
        self.jobData = _jobData
        self.dataset = _dataset
        self.jobId = self.jobData['jobId']
        self.jobName = self.jobData['jobName']
        self.labels = self.jobData['labels']

    def createDataset(self):
        labels = []
        datas = []
        datasetSplit = self.jobData['datasetSplit']
        trainRatio = (datasetSplit['trainRatio'])/100
        validateRatio = (datasetSplit['validateRatio'])/100
        testRatio = (datasetSplit['testRatio'])/100

        def createPath(jobId, jobName):

            parentDir = os.getcwd()
            directory = '{}_{}'.format(jobId, jobName)
            path = os.path.join(parentDir, 'data', directory)
            if not os.path.exists(path):
                os.makedirs(path)
            labelpath = os.path.join(path, 'label')
            if not os.path.exists(labelpath):
                os.makedirs(labelpath)
            records = os.path.join(path, 'records')
            if not os.path.exists(records):
                os.makedirs(records)

            return labelpath, records

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

        def createdata(data):
            datas = defaultdict(list)
            for imgData in data:
                imgFile = imgData['file']
                imgPath = imgFile['path']
                label = imgData['label']['name'].split("_")[1]
                bbox = imgData['bbox']
                segmentation = imgData['segmentation']
                xmin = bbox[0]
                xmax = bbox[0]+bbox[2]
                ymin = bbox[1]
                ymax = bbox[1]+bbox[3]
                height = imgFile['height']
                width = imgFile['width']
                data = {
                    'height': height,
                    'width': width,
                    'xmin': xmin,
                    'ymin': ymin,
                    'xmax': xmax,
                    'ymax': ymax,
                    'label': label,
                    'segmentation': segmentation
                }
                datas[imgPath].append(data)
            return datas

        def write(datas, labelMap, parentDir, foldername, file):
            numShares = 10
            path = os.path.join(parentDir, foldername)
            if not os.path.exists(path):
                os.mkdir(path)
            filename = os.path.join(path, file)
            with contextlib2.ExitStack() as tf_record_close_stack:
                output_tfrecords = tf_record_creation_util.open_sharded_output_tfrecords(
                    tf_record_close_stack, filename, numShares)

                for index, key in enumerate(datas.keys()):
                    example = datas[key]
                    tf_example = createTFexample(key, example, labelMap)
                    output_shard_index = index % numShares
                    output_tfrecords[output_shard_index].write(
                        tf_example.SerializeToString())
            return path

        def createTFexample(file, example, labelMap):
            filename = file.encode("utf8")
            with tf.gfile.GFile(file, 'rb') as fileid:
                encoded_jpg = fileid.read()
            encoded_jpg_io = io.BytesIO(encoded_jpg)
            image = PIL.Image.open(encoded_jpg_io)
            key = hashlib.sha256(encoded_jpg).hexdigest()
            width = example[0]['width']
            height = example[0]['height']

            image_format = file.split('.')[-1].encode("utf8")
            xmins = []
            xmaxs = []
            ymins = []
            ymaxs = []
            classes_text = []
            classes = []
            encoded_mask_png = []
            for x in example:
                run_len_encoding = mask.frPyObjects(
                    x['segmentation'], height, width)

                binary_mask = mask.decode(run_len_encoding)
                binary_mask = np.amax(binary_mask, axis=2)
                pil_image = PIL.Image.fromarray(binary_mask)
                output_io = io.BytesIO()
                pil_image.save(output_io, format='PNG')
                encoded_mask_png.append(output_io.getvalue())
                xmin = float(x['xmin'])
                xmax = float(x['xmax'])
                ymin = float(x['ymin'])
                ymax = float(x['ymax'])
                xmins.append(xmin / width)
                xmaxs.append(xmax / width)
                ymins.append(ymin / height)
                ymaxs.append(ymax / height)
                classname = x['label']
                classes_text.append(classname.encode('utf8'))
                classes.append(labelMap[classname])
            tf_example = tf.train.Example(features=tf.train.Features(feature={
                'image/height': dataset_util.int64_feature(height),
                'image/width': dataset_util.int64_feature(width),
                'image/filename': dataset_util.bytes_feature(filename),
                'image/source_id': dataset_util.bytes_feature(filename),
                'image/key/sha256':
                dataset_util.bytes_feature(key.encode('utf8')),
                'image/encoded': dataset_util.bytes_feature(encoded_jpg),
                'image/format': dataset_util.bytes_feature(image_format),
                'image/object/bbox/xmin': dataset_util.float_list_feature(xmins),
                'image/object/bbox/xmax': dataset_util.float_list_feature(xmaxs),
                'image/object/bbox/ymin': dataset_util.float_list_feature(ymins),
                'image/object/bbox/ymax': dataset_util.float_list_feature(ymaxs),
                'image/object/class/text': dataset_util.bytes_list_feature(classes_text),
                'image/object/class/label': dataset_util.int64_list_feature(classes),
                'image/object/mask':  dataset_util.bytes_list_feature(encoded_mask_png)
            }))

            return tf_example
        # --------------------------- Image Preprocessing ----------------------------------------------------
        # create label.txt
        labelpath, records = createPath(self.jobId, self.jobName)
        for lbl in self.labels:
            label = lbl['name'].split('_')[1]
            labels.append(label)

        # create tfrecord
        labelMap = createLabelMap(labels, labelpath)
        for x in self.dataset:
            (trainX, testX) = train_test_split(
                x, test_size=float(testRatio), shuffle=True)
            validationRatio = validateRatio/(1-validateRatio-testRatio)
            (trainX, validateX) = train_test_split(
                x, test_size=float(validationRatio), shuffle=True)
        train_x = createdata(trainX)
        test_x = createdata(testX)
        validate_x = createdata(validateX)

        writeTrainTFReord = write(
            train_x, labelMap, records, 'training', 'train')
        writeTestTFReord = write(test_x, labelMap, records, 'testing', 'test')
        writeValidateTFReord = write(
            validate_x, labelMap, records, 'validate', 'validate')

        return writeTrainTFReord, writeTestTFReord, writeValidateTFReord, labelpath
