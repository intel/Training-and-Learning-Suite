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
import json
import tempfile
from os.path import basename

mopy = "/opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py"
customOperationConfig = "./mo_tfOpenvino/yolo_v3.json"
tmpOperationConfig = "./mo_tfOpenvino/custom_yolo_v3.json"

def create_custom_config(numcls):
    with open(customOperationConfig, "r") as f:
        data = json.load(f)
    data[0]["custom_attributes"]["classes"] = numcls

    with open(tmpOperationConfig, "w") as f:
        json.dump(data, f)

def conversion(pbfile, ckptDir, name, id, numcls):
    log.info("converting to fp32")

    create_custom_config(numcls)

    inputShape = "[1,608,608,3]"
    outputFP32 = os.path.join(ckptDir, 'FP32')
    subprocess.check_call(["python3",
                           mopy,
                           "--input_model",
                           pbfile,
                           "--tensorflow_use_custom_operations_config",
                           tmpOperationConfig,
                           "-o", outputFP32, "--input_shape", inputShape, "--scale", "255"])
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
                           "--tensorflow_use_custom_operations_config",
                           tmpOperationConfig,
                           "-o", outputFP16, "--input_shape", inputShape, "--scale", "255", "--data_type=FP16"])
    zipfilepath16 = os.path.join(outputFP16, id+'_' + name+'_FP16.zip')
    with zipfile.ZipFile(zipfilepath16, mode="w") as zf:
        filepathxml = outputFP16 + '/frozen_inference_graph.xml'
        zf.write(filepathxml, basename(filepathxml))
        filepathbin = outputFP16 + '/frozen_inference_graph.bin'
        zf.write(filepathbin, basename(filepathbin))
    zf.close()
