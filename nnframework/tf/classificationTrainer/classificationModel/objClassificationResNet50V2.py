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
import keras
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model


class ClassificationTrainer_ResNet50V2:
    model = None

    def createModel(self, numcls):
        tf.keras.backend.set_learning_phase(0)
        # _ResNet50V2top = keras.applications.resnet_v2.ResNet50V2(
        #     weights='imagenet')
        _ResNet50V2 = keras.applications.resnet_v2.ResNet50V2(
            weights='imagenet', include_top=False)
        x = GlobalAveragePooling2D()(_ResNet50V2.output)
        x = Dense(numcls, activation='softmax')(x)
        self.model = Model(inputs=_ResNet50V2.input, outputs=x)
        # x = Dense(numcls, activation='softmax', name='props')(
        #     _ResNet50V2.layers[-2].output)
        # x.summary()
        # self.model = Model(inputs=_ResNet50V2.input, outputs=x)
        self.model.summary()
        # return self.model
