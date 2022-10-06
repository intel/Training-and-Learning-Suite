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

import threading
import os
import time
from tensorboard.backend.event_processing.event_accumulator import EventAccumulator

class EventParser:
    eventAccumulator = None
    tags = None

    def __init__(self, path, steps, job_id, callback):
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
        self.steps = steps
        self.job_id = job_id
        self.callback = callback

    def retrieveScalarData(self):
        scalarDatas = {}
        for tag in self.tags:
            events = self.eventAccumulator.Scalars(tag)
            datas = []
            labels = []
            for event in events:
                labels.append(event.step)
                datas.append({'x': event.step, 'y': event.value})
                self.callback(self.job_id, 'PROGRESS', {"status": 'Progress', 'done': event.step, 'total':  self.steps})

class trainingProgress (threading.Thread):
    eventparser = None
    checkpointdir = None
    trainingSteps = None
    stop = None

    def __init__(self, _name, ckptDir, trainingSteps, job_id, callback):
        threading.Thread.__init__(self)
        self.name = _name
        self.trainingSteps = trainingSteps
        self.ckptDir = ckptDir
        self.stop = False
        self.job_id = job_id
        self.eventparser = EventParser(self.ckptDir, self.trainingSteps, self.job_id, callback)

    def run(self):
        while not self.stop:
            if not os.path.exists(self.ckptDir):
                time.sleep(10)
            else:
                datas = self.eventparser.retrieveScalarData()
                time.sleep(5)

    def end(self):
        self.stop = True
