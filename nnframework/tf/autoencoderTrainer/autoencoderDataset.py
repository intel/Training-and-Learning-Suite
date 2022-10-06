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

# split data into train, test and validation and image prepocessing
from keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
import cv2
import numpy as np
import random

class AutoencoderDataset:
    def __init__(self, _jobData, _dataset):
        self.jobData = _jobData
        self.dataset = _dataset

    def createDataset(self):
        images = []
        augList = []
        datasetSplit = self.jobData['datasetSplit']
        augmentation = self.jobData['datasetAug']
        trainRatio = (datasetSplit['trainRatio'])/100
        validateRatio = (datasetSplit['validateRatio'])/100
        testRatio = (datasetSplit['testRatio'])/100
        for x in self.dataset:
            for imgData in x:
                imgFile = imgData['file']
                imgPath = imgFile['path']
                image = cv2.imread(imgPath)
                image = cv2.resize(image, (224, 224))
                images.append(image)

        # --------------------------- Image Preprocessing ----------------------------------------------------
        images = np.array(images, dtype="float32") / 255.0
        random.shuffle(images)

        (trainX, testX) = train_test_split(
            images, test_size=float(testRatio), shuffle=True)
        validationRatio = validateRatio/(1-validateRatio-testRatio)
        (trainX, validateX) = train_test_split(
            images, test_size=float(validationRatio), shuffle=True)

        return trainX, validateX
