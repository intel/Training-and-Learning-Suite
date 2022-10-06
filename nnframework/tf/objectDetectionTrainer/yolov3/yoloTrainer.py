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
import numpy as np
import time
import logging as log
import tensorflow as tf
import keras.backend as K
K.control_flow_ops = tf

from math import ceil
from functools import partial
from keras_yolo3.model import create_model, yolo_head, yolo_body_full
from keras_yolo3.utils import (check_params_path, get_anchors, get_dataset_class_names, get_nb_classes, data_generator)
from tensorflow.python.framework import graph_util
from tensorflow.python.framework import graph_io
from keras.layers import Input, Lambda
from keras.models import Model
from keras.optimizers import Adam
from keras.callbacks import ModelCheckpoint, ReduceLROnPlateau, EarlyStopping
from keras.models import load_model
from sklearn.metrics import multilabel_confusion_matrix

from objectDetectionTrainer.yolov3.yoloDataset import YoloDataset
from mo_tfOpenvino.mo_yolo import conversion

class ExtractProgressCallback(tf.keras.callbacks.Callback):
    def __init__(self, num_epochs, status_cb, task_id):
        super(ExtractProgressCallback, self).__init__()
        self.num_epochs = num_epochs
        self.status_cb = status_cb
        self.task_id = task_id

    def on_epoch_end(self, epoch, _logs=None):
        if epoch % 1 != 0:
            return
        percentage = float((epoch/self.num_epochs)*100)
        percentage = str(round(percentage, 2))
        self.status_cb(self.task_id, 'PROGRESS', {
                       'status': 'PROGRESS', 'done': epoch, 'total':  self.num_epochs})
        return percentage


class YoloTrainer:
    def __init__(self, _jobData, _dataset, _status_cb):
        self.jobData = _jobData
        self.jobId = self.jobData['jobId']
        self.jobName = self.jobData['jobName']
        self.dataset = _dataset
        self.status_cb = _status_cb
        self.taskId = self.jobData['taskId']
        self.modelTopology = self.jobData['model']
        self.numcls = self.jobData['numberClass']
        self.parentDir = './objectDetectionTrainer/yolov3/'
        self.configuration = self.jobData['configuration']
        self.earlyStopping = self.configuration['earlyStopping']
        self.reduceLR = self.configuration['reduceLR']
        self.params = self.configuration['params']

    def yoloTrainer(self):
        EPOCH = int(self.params['epoch'])
        TRAINING_BATCH_SIZE = int(self.params['training_batch_size'])
        VALIDATION_BATCH_SIZE = int(self.params['validation_batch_size'])
        PERIOD = int(self.params['period'])
        INITIAL_EPOCH = int(self.params['initial_epoch'])
        ES_MINDELTA = float(self.earlyStopping['min_delta'])
        ES_PATIENCE = int(self.earlyStopping['patience'])
        LR_FACTOR = float(self.reduceLR['factor'])
        LR_PATIENCE = int(self.reduceLR['patience'])
        LR_MINDELTA = float(self.reduceLR['min_delta'])
        LR_COOLDOWN = int(self.reduceLR['cooldown'])
        LR_MINLR = float(self.reduceLR['min_lr'])
        datasetSplit = self.jobData['datasetSplit']
        numberClass = self.jobData['numberClass']
        trainRatio = (datasetSplit['trainRatio'])/100
        validateRatio = (datasetSplit['validateRatio'])/100
        testRatio = (datasetSplit['testRatio'])/100

        def split_dataset(dataAnnotatedPath):
            with open(dataAnnotatedPath) as f:
                lines = f.readlines()

            np.random.seed(10101)
            np.random.shuffle(lines)
            np.random.seed(None)
            
            numberVal = max(int(len(lines)*validateRatio), 1)
            numberTrain = len(lines) - numberVal
            train_lines = lines[:numberTrain]
            valid_lines = lines[numberTrain:]

            return train_lines, valid_lines, numberTrain, numberVal

        def freezeGraph(savedModelPath, ckptDir):
            K.set_learning_phase(0)

            savedmodel = yolo_body_full(Input(shape=(None, None, 3)), 3, self.numcls)
            savedmodel.load_weights(savedModelPath)
            OUTPUT_NODE = [node.op.name for node in savedmodel.outputs]

            session = K.get_session()
            with session.graph.as_default():
                frozen = graph_util.convert_variables_to_constants(session, session.graph.as_graph_def(), OUTPUT_NODE)

            graph_io.write_graph(frozen, ckptDir, 'frozen_inference_graph.pb', as_text=False)
            pbFile = os.path.join(ckptDir, 'frozen_inference_graph.pb')
            return True

        # --------------------------- Define weights path ----------------------------------------------------
        weights_path = os.path.join(self.parentDir, 'model', 'yolo.h5')

        # --------------------------- Image prepocessing----------------------------------------------------
        dataAnnotatedPath, classesPath, anchorsPath, ckptDir = YoloDataset(self.jobData, self.dataset).createDataset()

        anchors = get_anchors(anchorsPath)
        numcls = get_nb_classes(dataAnnotatedPath)

        lines_train, lines_valid, trainX, validateX = split_dataset(dataAnnotatedPath)
        input_shape = (608, 608)

        # --------------------------- Training ----------------------------------------------------
        model = create_model(input_shape, anchors, numcls, freeze_body=2, weights_path=weights_path)

        bestModelPath = os.path.join(ckptDir, 'bestModel.hdf5')
        modelCheckpoint = ModelCheckpoint(bestModelPath, monitor='val_loss', save_best_only=True, period=PERIOD)
        reducePlateau = ReduceLROnPlateau(monitor='val_loss', factor=LR_FACTOR, patience=LR_PATIENCE,min_delta=LR_MINDELTA, cooldown=LR_COOLDOWN, min_lr=LR_MINLR)
        earlyStopping = EarlyStopping(monitor='val_loss', min_delta=ES_MINDELTA, patience=ES_PATIENCE, restore_best_weights=True)

        progressCb = ExtractProgressCallback(EPOCH, self.status_cb, self.taskId)

        callbacks = [progressCb, modelCheckpoint, reducePlateau, earlyStopping]
        model.compile(optimizer=Adam(lr=1e-3),loss={'yolo_loss': lambda y_true, y_pred: y_pred[0]})

        imageGenerator = partial(data_generator,input_shape=input_shape,anchors=anchors,nb_classes=numcls,augment=False,resize_img=True,nb_threads=1)
        trainGenerator = imageGenerator(lines_train, batch_size=TRAINING_BATCH_SIZE)
        validGenerator = imageGenerator(lines_valid, augment=False)

        model.fit_generator(trainGenerator,
                            steps_per_epoch=max(1, trainX//TRAINING_BATCH_SIZE),
                            validation_data=validGenerator,
                            validation_steps=max(1, validateX//VALIDATION_BATCH_SIZE),
                            epochs=EPOCH * 0.6,
                            use_multiprocessing=False,
                            initial_epoch=INITIAL_EPOCH,
                            callbacks=callbacks)

        for i, _e in enumerate(model.layers):
            model.layers[i].trainable = True

        model.compile(optimizer=Adam(lr=1e-4), loss={'yolo_loss': lambda y_true, y_pred: y_pred[0]})

        trainGenerator = imageGenerator(lines_train, batch_size= ceil(TRAINING_BATCH_SIZE*0.5))
        model.fit_generator(trainGenerator,
                            steps_per_epoch=max(1, trainX// ceil(TRAINING_BATCH_SIZE*0.5)),
                            validation_data=validGenerator,
                            validation_steps=max(1, validateX// ceil(VALIDATION_BATCH_SIZE*0.5)),
                            epochs=EPOCH,
                            use_multiprocessing=False,
                            initial_epoch=EPOCH * 0.6,
                            callbacks=callbacks)        

        trainedModel = os.path.join(ckptDir, 'trained-model.h5')
        model.save_weights(trainedModel)

        # --------------------------- Generates predictions for the input validate samples  from a data generator. ----------------------------------------------------
        # cm = predict(model, validateGenerator, lines[validateX:], EPOCH)
        # class_names = le.classes_
        # saveCM = ConfusionMatrix(
        #     cm, class_names, ckptDir).plot_confusion_matrix()

        # --------------------------- convert to IR format ----------------------------------------------------
        self.status_cb(self.taskId, 'PROGRESS', {"status": 'MODELCONVERSION'})
        pb = freezeGraph(trainedModel, ckptDir)

        if os.path.isfile(bestModelPath):
            # pb = freezeGraph(bestModelPath, ckptDir)
            if pb == True:
                pbFile = os.path.join(ckptDir, 'frozen_inference_graph.pb')
                conversion(pbFile, ckptDir, self.jobName, self.jobId, self.numcls)
        else:
            # pb = freezeGraph(trainedModel, ckptDir)
            if pb == True:
                pbFile = os.path.join(ckptDir, 'frozen_inference_graph.pb')
                conversion(pbFile, ckptDir, self.jobName, self.jobId, self.numcls)

        self.status_cb(self.taskId, 'COMPLETE', {"status": 'COMPLETE'})
        time.sleep(5)
