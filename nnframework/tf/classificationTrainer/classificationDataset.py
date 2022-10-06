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
from keras.utils import np_utils
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import cv2
import numpy as np

class ClassificationDataset:
    def __init__(self, _jobData, _dataset):
        self.jobData = _jobData
        self.dataset = _dataset
        self.modelTopology = self.jobData['model']

    def createDataset(self):
        images = []
        data = []
        labels = []
        labelNames = []
        augList = []
        datasetSplit = self.jobData['datasetSplit']
        augmentation = self.jobData['datasetAug'] 
        duplicateFactor = 1

        if augmentation == None:
            duplicateFactor = 1
        else:
            if "duplicate_factor" in augmentation:
                duplicateFactor = augmentation['duplicate_factor']
                del augmentation["duplicate_factor"]
            else:
                duplicateFactor = 1

        selectedLabels = self.jobData['labels']
        numberClass = self.jobData['numberClass']
        trainRatio = (datasetSplit['trainRatio'])/100
        validateRatio = (datasetSplit['validateRatio'])/100
        testRatio = (datasetSplit['testRatio'])/100
        
        lbls = {}
        index = 0
        for lbl in selectedLabels:
            label = np.zeros((len(selectedLabels),), dtype=int)
            label[index] = 1
            index = index + 1
            lbls[lbl['id']] = label
            labelNames.append(lbl['name'][lbl['name'].find("_")+1:])
        
        for x in self.dataset:
            for imgData in x:
                for _i in range(0, int(duplicateFactor)):
                    imgFile = imgData['file']
                    label = lbls[imgData['label']['id']]
                    imgPath = imgFile['path']
                    
                    image = cv2.imread(imgPath)
                    if self.modelTopology == 'densenet' or self.modelTopology == 'vgg16' or self.modelTopology == 'vgg19' or self.modelTopology == 'resnet' or self.modelTopology == 'resnetv2' or self.modelTopology == 'mobilenet' or self.modelTopology == 'mobilenetv2' or self.modelTopology == 'nasnet' or self.modelTopology == 'googlenet':
                        image = cv2.resize(image, (224, 224))
                    elif self.modelTopology == 'xception'or self.modelTopology == 'inceptionv3' or self.modelTopology == 'inceptionresnetv2':
                        image = cv2.resize(image, (299, 299))
                    else:
                        image = cv2.resize(image, (28, 28))
                    data.append([image, label])

        images = np.array([cv2.cvtColor(i[0], cv2.COLOR_BGR2RGB) for i in data])
        labels = np.array([i[1] for i in data])

        if self.modelTopology == 'densenet' or self.modelTopology == 'vgg16' or self.modelTopology == 'vgg19' or self.modelTopology == 'resnet' or self.modelTopology == 'resnetv2' or self.modelTopology == 'mobilenet' or self.modelTopology == 'mobilenetv2' or self.modelTopology == 'nasnet' or self.modelTopology == 'googlenet':
            images = np.array(images).reshape(-1, 224, 224, 3)
        elif self.modelTopology == 'xception'or self.modelTopology == 'inceptionv3' or self.modelTopology == 'inceptionresnetv2':
            images = np.array(images).reshape(-1, 299, 299, 3)
        else:
            images = np.array(images).reshape(-1, 28, 28, 3)

        # split data into train, test and validation
        (trainX, testX, trainY, testY) = train_test_split(images, labels, test_size=float(testRatio), stratify=labels, shuffle=True)
        (trainX, validateX, trainY, validateY) = train_test_split(trainX, trainY, test_size=float(validateRatio/(1 - validateRatio - testRatio)), stratify=trainY, shuffle=True)

        # Data augmentation
        try:
            kwargs = {'rescale' : 1/255.}
            for info in augmentation:
                kwargs[info] = augmentation[info]
            aug = ImageDataGenerator(**kwargs)
        except:
            aug = ImageDataGenerator(rescale=1/255.)

        return aug, trainX, testX, validateX, trainY, testY, validateY, labelNames
