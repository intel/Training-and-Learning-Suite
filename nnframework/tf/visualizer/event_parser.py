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


import matplotlib.pyplot as plt
import matplotlib as mpl
import tensorflow as tf
import numpy as np
import os
import json

from datetime import datetime
from tensorboard.backend.event_processing.event_accumulator import EventAccumulator
from bson import json_util


class EventParser:
    eventAccumulator = None
    tags = None

    def __init__(self, path):
        options = {
            'compressedHistograms': 10,
            'images': 0,
            'scalars': 10,
            'histograms': 1
        }
        self.eventAccumulator = EventAccumulator(path, options)
        self.eventAccumulator.Reload()
        self.tags = self.eventAccumulator.Tags()['scalars']
        self.path = path
    # --------------------------- Generate scalars and metrics ----------------------------------------------------

    def retrieveScalarData(self):
        scalarDatas = {}
        for tag in self.tags:
            events = self.eventAccumulator.Scalars(tag)

            datas = []
            labels = []
            for event in events:
                labels.append(event.step)
                datas.append({'x': event.step, 'y': event.value})
            scalarDatas[tag] = {'labels': labels, 'datas': datas}
        return scalarDatas
