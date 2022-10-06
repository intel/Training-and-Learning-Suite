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
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import Model


class ClassificationTrainer_DenseNet:

    model = None

    def createModel(self, numcls):
        tf.keras.backend.set_learning_phase(0)
        DenseNet = tf.keras.applications.densenet.DenseNet121(
            weights='imagenet')
        #DenseNet = tf.keras.applications.densenet.DenseNet169(weights='imagenet')
        #DenseNet = tf.keras.applications.densenet.DenseNet201(weights='imagenet')
        x = Dense(numcls, activation='softmax', name='fc1000')(
            DenseNet.layers[-2].output)
        self.model = Model(inputs=DenseNet.input, outputs=x)

        return self.model
