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

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import backend as K
from tensorflow.keras.layers import InputLayer, Conv2D, MaxPool2D, Dropout, Flatten, Dense
from tensorflow.keras import optimizers


class ClassificationTrainer_Lenet5:
    model = None

    def createModel(self, numcls):
        tf.keras.backend.set_learning_phase(0)
        self.model = keras.Sequential()

        self.model.add(InputLayer(input_shape=[28, 28, 3]))
        self.model.add(Conv2D(filters=8, kernel_size=5,
                              strides=1, padding="same", activation="relu"))
        self.model.add(MaxPool2D(pool_size=5, padding="same"))
        self.model.add(Conv2D(filters=16, kernel_size=5,
                              strides=1, padding="same", activation="relu"))
        self.model.add(MaxPool2D(pool_size=5, padding="same"))
        self.model.add(Conv2D(filters=32, kernel_size=5,
                              strides=1, padding="same", activation="relu"))
        self.model.add(MaxPool2D(pool_size=5, padding="same"))
        self.model.add(Dropout(0.25))
        self.model.add(Flatten(input_shape=(28, 28)))
        self.model.add(Dense(512, activation="relu"))
        self.model.add(Dropout(0.50))
        self.model.add(Dense(numcls, activation="softmax"))

        return self.model
