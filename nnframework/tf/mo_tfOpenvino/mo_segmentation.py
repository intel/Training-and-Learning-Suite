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
from os.path import basename
import zipfile

mopy = "/opt/intel/openvino/deployment_tools/model_optimizer/mo_tf.py"
configurePath = "/opt/intel/openvino/deployment_tools/model_optimizer/extensions/front/tf"

def getObjDetectionTransformConfigPath(modelname):
    switcher = {
        "mask_rcnn_inception_resnet_v2_atrous_coco": "mask_rcnn_support_api_v1.15.json",
        "mask_rcnn_inception_v2_coco": "mask_rcnn_support_api_v1.15.json",
        "mask_rcnn_resnet50_atrous_coco": "mask_rcnn_support_api_v1.15.json",
        "mask_rcnn_resnet101_atrous_coco": "mask_rcnn_support_api_v1.15.json"
    }

    configname = switcher.get(modelname, "Invalid model")

    if(configname == "Invalid model"):
        raise ValueError("Not supported model", modelname)

    configpath = os.path.join(configurePath,
                              configname)
    return configpath


def conversion(model, pbfile, ckptDir, pipelineConfig, name, id):
    log.info("Converting to Openvino FP32")
    objdetectconfigpath = getObjDetectionTransformConfigPath(model)
    outputFP32 = os.path.join(ckptDir, 'FP32')
    subprocess.check_call(["python3",
                           mopy,
                           "--input_model",
                           pbfile,
                           "-o", outputFP32, "--transformations_config", objdetectconfigpath, "--tensorflow_object_detection_api_pipeline_config", pipelineConfig])
    zipfilepath32 = os.path.join(outputFP32, id+'_' + name+'_FP32.zip')
    with zipfile.ZipFile(zipfilepath32, mode="w") as zf:
        filepathxml = outputFP32 + '/frozen_inference_graph.xml'
        zf.write(filepathxml, basename(filepathxml))
        filepathbin = outputFP32 + '/frozen_inference_graph.bin'
        zf.write(filepathbin, basename(filepathbin))
    zf.close()

    log.info("Converting to Openvino FP16")
    outputFP16 = os.path.join(ckptDir, 'FP16')
    subprocess.check_call(["python3",
                           mopy,
                           "--input_model",
                           pbfile,
                           "-o", outputFP16, "--tensorflow_object_detection_api_pipeline_config", pipelineConfig,
                           "--transformations_config", objdetectconfigpath, "--data_type=FP16"])
    zipfilepath16 = os.path.join(outputFP16, id+'_' + name+'_FP16.zip')
    with zipfile.ZipFile(zipfilepath16, mode="w") as zf:
        filepathxml = outputFP16 + '/frozen_inference_graph.xml'
        zf.write(filepathxml, basename(filepathxml))
        filepathbin = outputFP16 + '/frozen_inference_graph.bin'
        zf.write(filepathbin, basename(filepathbin))
    zf.close()
