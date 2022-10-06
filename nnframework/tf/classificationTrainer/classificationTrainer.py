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

# for dataset preprocessing
import json
import matplotlib.pyplot as plt
import os
from tensorflow.keras import optimizers
import tensorflow as tf
from tensorflow.python.framework import graph_io
from keras.models import load_model
from sklearn.preprocessing import LabelEncoder
from keras.preprocessing.image import ImageDataGenerator
from keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, Callback
import glob
import numpy as np
import time
import shutil
import pandas as pd
from tensorflow.keras import backend as K
from sklearn.metrics import multilabel_confusion_matrix, confusion_matrix
from classificationTrainer.classificationDataset import ClassificationDataset
from visualizer.event_parser import EventParser
# import classification model
from classificationTrainer.classificationModel.objClassificationDenseNet import ClassificationTrainer_DenseNet
from classificationTrainer.classificationModel.objClassificationLenet5 import ClassificationTrainer_Lenet5
from classificationTrainer.classificationModel.objClassificationGoogleNet import ClassificationTrainer_GoogleNet
from classificationTrainer.classificationModel.objClassificationInceptionV3 import ClassificationTrainer_InceptionV3
from classificationTrainer.classificationModel.objClassificationInceptionResNetV2 import ClassificationTrainer_InceptionResNetV2
from classificationTrainer.classificationModel.objClassificationMobileNetV1 import ClassificationTrainer_MobileNetV1
from classificationTrainer.classificationModel.objClassificationMobileNetV2 import ClassificationTrainer_MobileNetV2
from classificationTrainer.classificationModel.objClassificationNASnet import ClassificationTrainer_NASnet
from classificationTrainer.classificationModel.objClassificationResNet50 import ClassificationTrainer_ResNet50
from classificationTrainer.classificationModel.objClassificationResNet50V2 import ClassificationTrainer_ResNet50V2
from classificationTrainer.classificationModel.objClassificationVGG_16 import ClassificationTrainer_VGG16
from classificationTrainer.classificationModel.objClassificationVGG_19 import ClassificationTrainer_VGG19
from classificationTrainer.classificationModel.objClassificationXception import ClassificationTrainer_Xception

from mo_tfOpenvino.mo_classification import conversion
from visualizer.confusionMatrix import ConfusionMatrix


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


class ClassificationTrainer:
    def __init__(self, _jobData, _dataset, _status_cb):
        self.jobData = _jobData
        self.dataset = _dataset
        self.status_cb = _status_cb
        self.taskId = self.jobData['taskId']
        self.modelTopology = self.jobData['model']
        self.jobId = self.jobData['jobId']
        self.jobName = self.jobData['jobName']
        self.configuration = self.jobData['configuration']
        self.params = self.configuration['params']
        self.loss = self.configuration['losses']
        self.optimizer = self.configuration['optimizer']
        self.optimizerArgu = self.configuration['optimizerArgu']
        self.earlyStopping = self.configuration['earlyStopping']
        self.reduceLR = self.configuration['reduceLR']
        self.numcls = self.jobData['numberClass']

    def classificationTrainer(self):
        # self.params['training_batch_size'] = 1
        EPOCH = int(self.params['epoch'])
        num_epochs = int(self.params['epoch'])
        TRAINING_BATCH_SIZE = int(self.params['training_batch_size'])
        num_batches = int(self.params['training_batch_size'])
        VALIDATION_BATCH_SIZE = int(
            self.params['validation_batch_size'])
        PERIOD = int(self.params['period'])
        LOSS = str(self.loss)
        OPTIMIZER = self.optimizer
        ES_MINDELTA = float(self.earlyStopping['min_delta'])
        ES_PATIENCE = int(self.earlyStopping['patience'])
        LR_FACTOR = float(self.reduceLR['factor'])
        LR_PATIENCE = int(self.reduceLR['patience'])
        LR_MINDELTA = float(self.reduceLR['min_delta'])
        LR_COOLDOWN = int(self.reduceLR['cooldown'])
        LR_MINLR = float(self.reduceLR['min_lr'])

        def createPath(jobId, jobName):
            parentDir = os.getcwd()
            directory = '{}_{}'.format(jobId, jobName)
            path = os.path.join(parentDir, 'data', directory)
            shutil.rmtree(path, ignore_errors=True)
            if not os.path.exists(path):
                os.makedirs(path)
            checkpointDir = os.path.join(path, 'model')
            if not os.path.exists(checkpointDir):
                os.makedirs(checkpointDir)
            return path, checkpointDir

        def selectModel(self, model, numcls):
            self.status_cb(self.taskId, 'PROGRESS', {
                           "status": "DOWNLOADMODEL"})

            if model == 'densenet':
                self.model = ClassificationTrainer_DenseNet.createModel(
                    self, numcls)
                return self.model
            elif model == 'googlenet':
                self.model = ClassificationTrainer_GoogleNet.createModel(
                    self, numcls)
                return self.model
            elif model == 'inceptionv3':
                self.model = ClassificationTrainer_InceptionV3.createModel(
                    self, numcls)
                return self.model
            elif model == 'inceptionresnetv2':
                self.model = ClassificationTrainer_InceptionResNetV2.createModel(
                    self, numcls)
                return self.model
            elif model == 'mobilenet':
                self.model = ClassificationTrainer_MobileNetV1.createModel(
                    self, numcls)
                return self.model
            elif model == 'mobilenetv2':
                self.model = ClassificationTrainer_MobileNetV2.createModel(
                    self, numcls)
                return self.model
            elif model == 'nasnet':
                self.model = ClassificationTrainer_NASnet.createModel(
                    self, numcls)
                return self.model
            elif model == 'resnet':
                self.model = ClassificationTrainer_ResNet50.createModel(
                    self, numcls)
                return self.model
            elif model == 'resnetv2':
                self.model = ClassificationTrainer_ResNet50V2.createModel(
                    self, numcls)
                return self.model
            elif model == 'vgg16':
                self.model = ClassificationTrainer_VGG16.createModel(
                    self, numcls)
                return self.model
            elif model == 'vgg19':
                self.model = ClassificationTrainer_VGG19.createModel(
                    self, numcls)
                return self.model
            elif model == 'xception':
                self.model = ClassificationTrainer_Xception.createModel(
                    self, numcls)
                return self.model
            else:
                # by default, Lenet5
                self.model = ClassificationTrainer_Lenet5.createModel(
                    self, numcls)
                return self.model

        def predict(model, validateGenerator, validateY):
            predictions = model.predict_generator(validateGenerator)
            confusionMatrix = multilabel_confusion_matrix(
                validateY.argmax(axis=1), predictions.argmax(axis=1))

            return confusionMatrix[0]

        def accurate(model, testGenerator, testX):
            _, acc = model.evaluate_generator(testGenerator)
            return acc

        def freezeGraph(model, bestModelPath, ckptDir):
            tf.keras.backend.set_learning_phase(0)
            # load the best model to write as pb file
            model.load_weights(bestModelPath)
            session = tf.keras.backend.get_session()
            OUTPUT_NODE = [node.op.name for node in model.outputs]
            with session.graph.as_default():
                # Prunes out nodes that aren't needed for inference.
                graphPruned = tf.graph_util.remove_training_nodes(
                    session.graph.as_graph_def())
                frozen = tf.graph_util.convert_variables_to_constants(
                    session, graphPruned, OUTPUT_NODE)
            graph_io.write_graph(
                frozen, ckptDir, 'frozen_inference_graph.pb', as_text=False)
            return True

        # --------------------------- Image Preprocessing ----------------------------------------------------
        self.status_cb(self.taskId, 'PROGRESS', {"status": "PREPAREDATASET"})

        aug, trainX, testX, validateX, trainY, testY, validateY, labelNames = ClassificationDataset(
            self.jobData, self.dataset).createDataset()

        trainGenerator = aug.flow(
            trainX, trainY, batch_size=TRAINING_BATCH_SIZE)

        testGenerator = aug.flow(
            testX, testY, batch_size=TRAINING_BATCH_SIZE, shuffle=False)

        validateGenerator = aug.flow(
            validateX, validateY, batch_size=VALIDATION_BATCH_SIZE, shuffle=False)

        # --------------------------- Create directory to store trained data ----------------------------------------------------
        path, ckptDir = createPath(self.jobId, self.jobName)

        # --------------------------- Select deel learning models for training ----------------------------------------------------
        model = selectModel(self, self.modelTopology, self.numcls)

        # --------------------------- Configures the model for training ----------------------------------------------------
        # Stop training when a monitored quantity has stopped improving.
        earlyStopping = EarlyStopping(monitor='loss', mode='min', min_delta=ES_MINDELTA, patience=ES_PATIENCE,  restore_best_weights=True)
        bestModelPath = os.path.join(ckptDir, 'bestModel.hdf5')
        # Save the model after every epoch.
        modelCheckpoint = ModelCheckpoint(bestModelPath, monitor='val_loss', save_best_only=True, period=PERIOD)
        # Reduce learning rate when a metric has stopped improving.
        reducePlateau = ReduceLROnPlateau(
            monitor='loss', factor=LR_FACTOR, patience=LR_PATIENCE, min_delta=LR_MINDELTA, cooldown=LR_COOLDOWN, min_lr=LR_MINLR)

        progressCb = ExtractProgressCallback(
            EPOCH, self.status_cb, self.taskId)

        callbacks = [earlyStopping, modelCheckpoint,
                     reducePlateau,  progressCb]

        if OPTIMIZER == "SGD":
            LR = float(self.optimizerArgu['learning_rate'])
            MOMENTUM = float(self.optimizerArgu['momentum'])
            NETSTEROV = self.optimizerArgu['nesterov']
            optimizer = optimizers.SGD(lr=LR, momentum=MOMENTUM, nesterov=NETSTEROV)
        elif OPTIMIZER == "Adam":
            LR = float(self.optimizerArgu['learning_rate'])
            BETA_1 = float(self.optimizerArgu['beta_1'])
            BETA_2 = float(self.optimizerArgu['beta_2'])
            AMSGRAD = self.optimizerArgu['amsgrad']
            optimizer = optimizers.Adam(lr=LR, beta_1=BETA_1, beta_2=BETA_2, amsgrad=AMSGRAD)
        elif OPTIMIZER == "RMSprop":
            LR = float(self.optimizerArgu['learning_rate'])
            RHO = float(self.optimizerArgu['rho'])
            optimizer = optimizers.RMSprop(lr=LR, rho=RHO)

        model.compile(
            optimizer=optimizer,
            loss=LOSS,
            metrics=["accuracy"])

        model.fit_generator(trainGenerator, verbose=0, validation_data=validateGenerator, steps_per_epoch=len(
            trainX)//TRAINING_BATCH_SIZE, epochs=EPOCH, callbacks=callbacks)

        # --------------------------- Generates predictions for the input validate samples  from a data generator. ----------------------------------------------------
        testGenerator.reset()
        predictions = model.predict_generator(testGenerator,steps=len(testX)/TRAINING_BATCH_SIZE)
        labelIndices = [ i for i in range(0, len(labelNames)) ]
        cm = confusion_matrix(testY.argmax(axis=1), predictions.argmax(axis=1), labels=labelIndices)
        ConfusionMatrix(cm, labelNames, ckptDir).plot_confusion_matrix()

        trainedWeights = os.path.join(ckptDir, 'trained-weights.hdf5')
        model.save(trainedWeights)

        # --------------------------- Generate scalars and metrics --------------------------------------------------------------
        acc = accurate(model, testGenerator, testY)

        testAccuracyLabel = []
        testAccuracyData = []
        
        testAccuracyLabel.append(EPOCH)
        testAccuracyData.append({'x': EPOCH, 'y': float(acc)})
        
        try:
            checkpointeventparser = EventParser(ckptDir)
            checkpointdata = checkpointeventparser.retrieveScalarData()
            checkpointdata["accuracy"] = {
                "labels": testAccuracyLabel,
                "datas": testAccuracyData
            }

            scalarDataPath = os.path.join(ckptDir, 'scalarData.json')
            with open(scalarDataPath, 'w') as write_file:
                json.dump(checkpointdata, write_file)
                write_file.write('\n')
        except:
            pass

        # --------------------------- convert to IR format ----------------------------------------------------
        self.status_cb(self.taskId, 'PROGRESS', {"status": 'MODELCONVERSION'})
        if os.path.isfile(bestModelPath):
            result = freezeGraph(model, bestModelPath, ckptDir)
            if result == True:
                pbFile = os.path.join(ckptDir, 'frozen_inference_graph.pb')
                conversion(pbFile, ckptDir,
                           self.modelTopology, self.jobName, self.jobId)
        else:
            result = freezeGraph(model, trainedWeights, ckptDir)
            if result == True:
                pbFile = os.path.join(ckptDir, 'frozen_inference_graph.pb')
                conversion(pbFile, ckptDir,
                           self.modelTopology, self.jobName, self.jobId)

        self.status_cb(self.taskId, 'COMPLETE', {"status": 'COMPLETE'})
        time.sleep(5)
