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

import object_detection.utils.config_util as config_util


class PipelineConfig:
    configs = None

    def __init__(self, configpath):
        self.configs = config_util.get_configs_from_pipeline_file(configpath)

    def configureParams(self, hparams):
        self.configs = config_util.merge_external_params_with_configs(
            self.configs, hparams)

    def configureLearningRate(self, lr):
        self.configs = config_util.merge_external_params_with_configs(
            self.configs, kwargs_dict={"learning_rate": lr})

    def configureBatchSize(self, batchsize):
        self.configs = config_util.merge_external_params_with_configs(
            self.configs, kwargs_dict={"batch_size": batchsize})

    def configureMomentumOptimizerValue(self, optimizerValue):
        self.configs = config_util.merge_external_params_with_configs(
            self.configs, kwargs_dict={"momentum_optimizer_value": optimizerValue})

    def configureTrainInputPath(self, inputpath):
        self.configs = config_util.merge_external_params_with_configs(
            self.configs, kwargs_dict={"train_input_path": inputpath})

    def configureLabelMapPath(self, labelmappath):
        self.configs = config_util.merge_external_params_with_configs(
            self.configs, kwargs_dict={"label_map_path": labelmappath})

    def configureEvalInputPath(self, evalinputpath):
        self.configs = config_util.merge_external_params_with_configs(
            self.configs, kwargs_dict={"eval_input_path": evalinputpath})

    def savePipelineConfig(self, savepath):
        pipeline_config = config_util.create_pipeline_proto_from_configs(
            self.configs)
        config_util.save_pipeline_config(pipeline_config, savepath)
