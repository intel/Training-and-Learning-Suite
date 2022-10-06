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
from autoencoderTrainer.autoencoderDataset import AutoencoderDataset
from keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from keras.preprocessing.image import ImageDataGenerator
import os
import tensorflow as tf
from tensorflow.keras import backend as K
from tensorflow.python.framework import graph_io
import numpy as np
from mo_tfOpenvino.mo_autoencoder import conversion
import time


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


class AutoencoderTrainer:
    def __init__(self, _jobData, _dataset, _status_cb):
        self.jobData = _jobData
        self.dataset = _dataset
        self.status_cb = _status_cb
        self.taskId = self.jobData['taskId']
        self.jobId = self.jobData['jobId']
        self.jobName = self.jobData['jobName']
        self.configuration = self.jobData['configuration']
        self.params = self.configuration['params']
        self.earlyStopping = self.configuration['earlyStopping']
        self.reduceLR = self.configuration['reduceLR']

    def autoencoderTrainer(self):
        num_epochs = int(self.params['epoch'])
        EPOCH = int(self.params['epoch'])
        TRAINING_BATCH_SIZE = int(self.params['training_batch_size'])
        VALIDATION_BATCH_SIZE = int(
            self.params['validation_batch_size'])
        PERIOD = int(self.params['period'])
        INITIAL_EPOCH = int(self.params['initial_epoch'])
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
            if not os.path.exists(path):
                os.makedirs(path)
            checkpointDir = os.path.join(path, 'model')
            if not os.path.exists(checkpointDir):
                os.makedirs(checkpointDir)
            return path, checkpointDir

        def freezeGraph(bestModelPath, ckptDir):
            tf.keras.backend.set_learning_phase(0)
            model = tf.keras.models.load_model(bestModelPath)
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

        def autoencoderModel():
            # define the input to the encoder
            inputs = tf.keras.layers.Input(shape=(224, 224, 3))
            x = inputs
            # loop over the number of filters
            for f in (8, 16, 32, 64, 128):
                # apply a CONV => RELU => BN operation
                x = tf.keras.layers.Conv2D(f, (3, 3), strides=2, padding="same")(x)
                x = tf.keras.layers.LeakyReLU(alpha=0.2)(x)
                x = tf.keras.layers.BatchNormalization(axis=-1)(x)

            # flatten the network and then construct our latent vector
            volumeSize = K.int_shape(x)
            x = tf.keras.layers.Flatten()(x)
            latent = tf.keras.layers.Dense(16)(x)

            # build the encoder model
            encoder = tf.keras.models.Model(inputs, latent, name="encoder")

            # start building the decoder model which will accept the
            # output of the encoder as its inputs
            latentInputs = tf.keras.layers.Input(shape=(16,))
            x = tf.keras.layers.Dense(np.prod(volumeSize[1:]))(latentInputs)
            x = tf.keras.layers.Reshape((volumeSize[1], volumeSize[2], volumeSize[3]))(x)

            # loop over our number of filters again, but this time in
            # reverse order
            for f in (8, 16, 32, 64, 128)[::-1]:
                # apply a CONV_TRANSPOSE => RELU => BN operation
                x = tf.keras.layers.Conv2DTranspose(f, (3, 3), strides=2,
                                    padding="same")(x)
                x = tf.keras.layers.LeakyReLU(alpha=0.2)(x)
                x = tf.keras.layers.BatchNormalization(axis=-1)(x)

            # apply a single CONV_TRANSPOSE layer used to recover the
            # original depth of the image
            x = tf.keras.layers.Conv2DTranspose(3, (3, 3), padding="same")(x)
            outputs = tf.keras.layers.Activation("sigmoid")(x)

            # build the decoder model
            decoder = tf.keras.models.Model(latentInputs, outputs, name="decoder")

            # our autoencoder is the encoder + decoder
            model = tf.keras.models.Model(inputs, decoder(encoder(inputs)),
                                name="autoencoder")
            return model

        # --------------------------- Image Preprocessing ----------------------------------------------------
        trainX, validateX = AutoencoderDataset(
            self.jobData, self.dataset).createDataset()
        path, ckptDir = createPath(self.jobId, self.jobName)

        # --------------------------- Configures the model for training ----------------------------------------------------
        # Stop training when a monitored quantity has stopped improving.
        earlyStopping = EarlyStopping(
            monitor='loss', mode='min', min_delta=ES_MINDELTA, patience=ES_PATIENCE,  restore_best_weights=True)
        bestModelPath = os.path.join(ckptDir, 'bestModel.hdf5')
        # Save the model after every epoch.
        modelCheckpoint = ModelCheckpoint(
            bestModelPath, monitor='val_loss', save_best_only=True, period=PERIOD)
        # Reduce learning rate when a metric has stopped improving.
        reducePlateau = ReduceLROnPlateau(
            monitor='loss', factor=LR_FACTOR, patience=LR_PATIENCE, min_delta=LR_MINDELTA, cooldown=LR_COOLDOWN, min_lr=LR_MINLR)
        progressCb = ExtractProgressCallback(
            EPOCH, self.status_cb, self.taskId)
        callbacks = [earlyStopping, modelCheckpoint,
                     reducePlateau,  progressCb]
        model = autoencoderModel()
        model.compile(optimizer='adam', loss='mse')
        if os.path.isfile(bestModelPath):
            model.load_weights(bestModelPath)
        model.fit(x=trainX, y=trainX, verbose=1, validation_data=(validateX, validateX), steps_per_epoch=len(
            trainX)/TRAINING_BATCH_SIZE, epochs=EPOCH, batch_size=TRAINING_BATCH_SIZE, shuffle=True, callbacks=callbacks)
        trainedWeights = os.path.join(ckptDir, 'trained-weights.hdf5')
        model.save(trainedWeights)

        # --------------------------- Generate scalars and metrics --------------------------------------------------------------

        # --------------------------- convert to IR format ----------------------------------------------------
        self.status_cb(self.taskId, 'PROGRESS', {"status": 'MODELCONVERSION'})
        if os.path.isfile(bestModelPath):
            tf.keras.backend.clear_session()
            pb = freezeGraph(bestModelPath, ckptDir)
            if pb == True:
                pbFile = os.path.join(ckptDir, 'frozen_inference_graph.pb')
                conversion(pbFile, ckptDir,
                           self.jobName, self.jobId)
        else:
            tf.keras.backend.clear_session()
            pb = freezeGraph(trainedWeights, ckptDir)
            if pb == True:
                pbFile = os.path.join(ckptDir, 'frozen_inference_graph.pb')
                conversion(pbFile, ckptDir,
                           self.jobName, self.jobId)

        self.status_cb(self.taskId, 'COMPLETE', {"status": 'COMPLETE'})
        time.sleep(5)
