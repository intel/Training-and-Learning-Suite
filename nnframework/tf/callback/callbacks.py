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
import workers


class ExtractProgressCallback(tf.keras.callbacks.Callback):
    def __init__(self, num_epochs):
        super(ExtractProgressCallback, self).__init__()
        self.num_epochs = num_epochs

    def on_epoch_end(self, epoch, _logs=None):
        # run on every 3 epoch only
        if epoch % 1 != 0:
            return
        percentage = float((epoch/self.num_epochs)*100)
        percentage = str(round(percentage, 2))
        workers.worker.update_state(state='PROGRESS', meta={'status': 'Progress', 'done': epoch, 'total':  self.num_epochs})
        print('training percentage: {}%'.format(percentage))
        return percentage
