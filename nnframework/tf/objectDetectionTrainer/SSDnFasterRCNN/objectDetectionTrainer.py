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

from objectDetectionTrainer.SSDnFasterRCNN.objectDetectionDataset import ObjectDetectionDataset
from objectDetectionTrainer.SSDnFasterRCNN.pipelineCFG import PipelineConfig
from visualizer.event_parser import EventParser
from object_detection import model_lib
from object_detection import model_hparams
from object_detection import exporter
from object_detection.protos import pipeline_pb2
from tensorflow.python.training import basic_session_run_hooks
from tensorflow.python.platform import tf_logging as logging
from mo_tfOpenvino.mo_objectdetection import conversion
from callback.threadingCallback import trainingProgress
import os
import tensorflow as tf
from google.protobuf import text_format
import shutil
import json
import time


class TotalStepCounter(basic_session_run_hooks.StepCounterHook):
    def __init__(self, batch_size, every_n_steps=100, total_steps=1000, st_callback=None, task_id=-1):
        self._batch_size = batch_size
        self._total_steps = total_steps
        self._st_callback = st_callback
        self._task_id = task_id
        super(TotalStepCounter, self).__init__(every_n_steps=every_n_steps,
                                               every_n_secs=None, output_dir=None, summary_writer=None)

    def _log_and_record(self, elapsed_steps, elapsed_time, global_step):
        global_step_per_sec = elapsed_steps / elapsed_time
        examples_per_sec = self._batch_size * global_step_per_sec
        logging.info('Total Steps: %g', global_step)
        self._st_callback(self._task_id, 'PROGRESS', {"status": 'PROGRESS', 'done': int(
            global_step), 'total':  int(self._total_steps)})


class ObjectDetectionTrainer:
    def __init__(self, _jobData, _dataset, status_cb):
        self.jobData = _jobData
        self.dataset = _dataset
        self.status_cb = status_cb
        self.modelTopology = self.jobData['model']
        self.numcls = self.jobData['numberClass']
        self.jobId = self.jobData['jobId']
        self.taskId = self.jobData['taskId']
        self.jobName = self.jobData['jobName']
        self.configuration = self.jobData['configuration']
        self.parentDir = './objectDetectionTrainer/SSDnFasterRCNN'
        self.min_dimension = self.jobData['min_dimension']
        self.max_dimension = self.jobData['max_dimension']

    def objectDetectionTrainer(self):
        STEPS = int(self.configuration['train_steps'])
        BATCHSIZE = int(self.configuration['batch_size'])
        LR = float(self.configuration['learning_rate'])
        MOMENTUM_OPTIMIZER_VALUE = float(
            self.configuration['momentum_optimizer_value'])

        def exportGraph(ckptDir, pipeline_config_path):
            savedModel = os.path.join(ckptDir, 'saved_model')
            if os.path.isdir(savedModel) is True:
                shutil.rmtree(savedModel)

            pipeline_config = pipeline_pb2.TrainEvalPipelineConfig()
            with tf.gfile.GFile(pipeline_config_path, 'r') as f:
                text_format.Merge(f.read(), pipeline_config)
            trained_checkpoint_prefix = tf.train.latest_checkpoint(
                ckptDir, latest_filename=None)
            exporter.export_inference_graph(
                "image_tensor", pipeline_config, trained_checkpoint_prefix, ckptDir)
            return True

        def createPath(jobId, jobName):
            parentDir = os.getcwd()
            directory = '{}_{}'.format(jobId, jobName)
            pipelinePath = os.path.join(
                parentDir, 'data', directory, 'pipeline')

            if os.path.exists(pipelinePath):
                shutil.rmtree(pipelinePath)
            if not os.path.exists(pipelinePath):
                os.makedirs(pipelinePath)

            checkpointDir = os.path.join(parentDir, 'data', directory, 'model')
            if os.path.exists(checkpointDir):
                shutil.rmtree(checkpointDir)
            if not os.path.exists(checkpointDir):
                os.makedirs(checkpointDir)

            return pipelinePath, checkpointDir

        def configurePipeline(model, pipelinesavedir, trainTFrecordDir, testTFrecordDir, validateTFrecordDir, labelPath):
            pipelinepath = os.path.join(
                self.parentDir, 'pipelines', model+'.config')
            pipelinecfg = PipelineConfig(pipelinepath)
            
            model_split = model.split('_')
            if (model_split[0] == "ssd"):
                hparams = tf.contrib.training.HParams(
                    **{"model.ssd.num_classes": self.numcls})
                pipelinecfg.configureParams(hparams)
                finetuneminImg = tf.contrib.training.HParams(
                    **{"model.ssd.image_resizer.fixed_shape_resizer.height": int(self.min_dimension)})

                finetunemaxImg = tf.contrib.training.HParams(
                    **{"model.ssd.image_resizer.fixed_shape_resizer.width": int(self.max_dimension)})
                pipelinecfg.configureParams(finetuneminImg)
                pipelinecfg.configureParams(finetunemaxImg)
            else:
                hparams = tf.contrib.training.HParams(
                    **{"model.faster_rcnn.num_classes": self.numcls})
                pipelinecfg.configureParams(hparams)
                if model == "faster_rcnn_nas_coco":
                    pass
                else:
                    finetuneminImg = tf.contrib.training.HParams(
                        **{"model.faster_rcnn.image_resizer.keep_aspect_ratio_resizer.min_dimension": int(self.min_dimension)})

                    finetunemaxImg = tf.contrib.training.HParams(
                        **{"model.faster_rcnn.image_resizer.keep_aspect_ratio_resizer.max_dimension": int(self.max_dimension)})
                    pipelinecfg.configureParams(finetuneminImg)
                    pipelinecfg.configureParams(finetunemaxImg)
            pipelinecfg.configureTrainInputPath(
                trainTFrecordDir + "/train-?????-of-00010")
            pipelinecfg.configureLabelMapPath(
                labelPath + "/label.pbtxt")
            pipelinecfg.configureEvalInputPath(
                validateTFrecordDir + "/validate-?????-of-00010")

            pipelinecfg.configureLearningRate(LR)
            pipelinecfg.configureBatchSize(BATCHSIZE)
            pipelinecfg.configureMomentumOptimizerValue(
                MOMENTUM_OPTIMIZER_VALUE)
            pipelinecfg.savePipelineConfig(pipelinesavedir)

        def training(modelpath, pipelinepath, trainingsteps):
            config = tf.estimator.RunConfig(model_dir=modelpath)
            train_and_eval_dict = model_lib.create_estimator_and_inputs(
                run_config=config,
                hparams=model_hparams.create_hparams(None),
                pipeline_config_path=pipelinepath,
                train_steps=trainingsteps,
                sample_1_of_n_eval_examples=1,
                sample_1_of_n_eval_on_train_examples=1)
            estimator = train_and_eval_dict['estimator']
            train_input_fn = train_and_eval_dict['train_input_fn']
            eval_input_fns = train_and_eval_dict['eval_input_fns']
            eval_on_train_input_fn = train_and_eval_dict['eval_on_train_input_fn']
            predict_input_fn = train_and_eval_dict['predict_input_fn']
            train_steps = train_and_eval_dict['train_steps']

            train_spec, eval_specs = model_lib.create_train_and_eval_specs(
                train_input_fn,
                eval_input_fns,
                eval_on_train_input_fn,
                predict_input_fn,
                train_steps,
                eval_on_train_data=False)

            train_specx = tf.estimator.TrainSpec(input_fn=train_input_fn, max_steps=train_steps, hooks=[
                                                 TotalStepCounter(BATCHSIZE, 1, train_steps, self.status_cb, self.taskId)])
            tf.estimator.train_and_evaluate(
                estimator, train_specx, eval_specs[0])
            return True

        # --------------------------- Image Preprocessing & Generate TFrecord----------------------------------------------------
        trainTFrecordDir, testTFrecordDir, validateTFrecordDir, labelPath = ObjectDetectionDataset(
            self.jobData, self.dataset).createDataset()

        # --------------------------- Create directory to store trained data ----------------------------------------------------
        pipelinesavedir, ckptDir = createPath(self.jobId, self.jobName)

        # --------------------------- Configure Training Pipeline ---------------------------------------------------------------
        model = self.modelTopology
        configurePipeline(model, pipelinesavedir, trainTFrecordDir,
                          testTFrecordDir, validateTFrecordDir, labelPath)
        pipelinesavepath = os.path.join(pipelinesavedir, "pipeline.config")

        # --------------------------- Training ----------------------------------------------------------------------------------
        result = training(ckptDir, pipelinesavepath, STEPS)

        # --------------------------- Export Graph & convert to IR format -------------------------------------------------------
        self.status_cb(self.taskId, 'PROGRESS', {"status": 'MODELCONVERSION'})
        exportTrainedGraph = exportGraph(ckptDir, pipelinesavepath)
        if exportTrainedGraph == True:
            pbpath = os.path.join(ckptDir, 'frozen_inference_graph.pb')
            conversion(model, pbpath, ckptDir, pipelinesavepath,
                       self.jobName, self.jobId)
        time.sleep(1)

        # --------------------------- Generate scalars and metrics --------------------------------------------------------------
        self.status_cb(self.taskId, 'PROGRESS', {"status": 'PREPAREMETRICS'})
        scalarData = EventParser(ckptDir).retrieveScalarData()
        scalarDataPath = os.path.join(ckptDir, 'scalarData.json')
        with open(scalarDataPath, 'w') as write_file:
            json.dump(scalarData, write_file)
            write_file.write('\n')

        self.status_cb(self.taskId, 'COMPLETE', {"status": 'COMPLETE'})
        time.sleep(5)
