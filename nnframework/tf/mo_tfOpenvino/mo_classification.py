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

import subprocess
import os
import logging as log
import zipfile
from os.path import basename
mopy = "/opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py"


def conversion(pbfile, ckptDir, model, name, id):
    if model == 'densenet' or model == 'vgg16' or model == 'vgg19' or model == 'resnet' or model == 'resnetv2' or model == 'mobilenet' or model == 'mobilenetv2' or model == 'nasnet' or model == "googlenet":
        inputShape = "[1,224,224,3]"
    elif model == 'xception' or model == 'inceptionv3' or model == 'inceptionresnetv2':
        inputShape = "[1,299,299,3]"
    else:
        inputShape = "[1,28,28,3]"

    log.info("converting to fp32")

    outputFP32 = os.path.join(ckptDir, 'FP32')
    subprocess.check_call(["python3",
                           mopy,
                           "--input_model",
                           pbfile,
                           "--scale", "255",
                           "-o", outputFP32,
                           "--input_shape", inputShape])
    zipfilepath32 = os.path.join(outputFP32, id+'_' + name+'_FP32.zip')
    with zipfile.ZipFile(zipfilepath32, mode="w") as zf:
        filepathxml = outputFP32 + '/frozen_inference_graph.xml'
        zf.write(filepathxml, basename(filepathxml))
        filepathbin = outputFP32 + '/frozen_inference_graph.bin'
        zf.write(filepathbin, basename(filepathbin))
    zf.close()
    log.info("converting to fp16")
    outputFP16 = os.path.join(ckptDir, 'FP16')
    subprocess.check_call(["python3",
                           mopy,
                           "--input_model",
                           pbfile,
                           "--scale", "255",
                           "-o", outputFP16,
                           "--input_shape", inputShape, "--data_type=FP16"])
    zipfilepath16 = os.path.join(outputFP16, id+'_' + name+'_FP16.zip')
    with zipfile.ZipFile(zipfilepath16, mode="w") as zf:
        filepathxml = outputFP16 + '/frozen_inference_graph.xml'
        zf.write(filepathxml, basename(filepathxml))
        filepathbin = outputFP16 + '/frozen_inference_graph.bin'
        zf.write(filepathbin, basename(filepathbin))
    zf.close()
