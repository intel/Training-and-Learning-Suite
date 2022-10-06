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

from celery.worker.request import Request
from celery import Celery
from celery import Task
from celery import states
from celery.task.control import revoke
from celery.task.control import inspect
from celery.exceptions import Ignore

from objectDetectionTrainer.SSDnFasterRCNN.objectDetectionTrainer import ObjectDetectionTrainer
from objectDetectionTrainer.yolov3.yoloTrainer import YoloTrainer
from classificationTrainer.classificationTrainer import ClassificationTrainer
from segmentationTrainer.segmentationTrainer import SegmentationTrainer
from autoencoderTrainer.autoencoderTrainer import AutoencoderTrainer

from inferOpenvino.classificationInfer import classificationInfer
from inferOpenvino.objectDetectionInfer import objectDetectionInfer
from inferOpenvino.segmentationInfer import segmentationInfer
from inferOpenvino.yoloInfer import yoloInfer
from inferOpenvino.autoencoderInfer import autoencoderInfer

from remoteAgentPublisher import agentPublisher
from remoteAgentSubscriber import agentSubscriber

import json
import time
import tensorflow as tf
import shutil
import os
import ssl
import pymongo
from bson.objectid import ObjectId

from celery.utils.log import get_task_logger
logger = get_task_logger(__name__)

keyfile = os.environ.get(
    'SSL_KEYFILE', '../../thirdparty/security/TLS_redis_key.pem')
certfile = os.environ.get(
    'SSL_CERTFILE', '../../thirdparty/security/TLS_redis_cert.crt')
cacerts = os.environ.get(
    'SSL_CACERTS', '../../thirdparty/security/ca/ca_certificate.pem')
redispass = os.environ.get(
    'REDIS_PASS', '../../thirdparty/security/TLS_redis_pass.txt')
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')

with open(redispass, 'r') as f:
    REDIS_PASS = f.read().strip()

MONGO_USER_FILE = os.getenv(
    "MONGO_USER_FILE", "../../thirdparty/security/TLS_mongodb_username.txt")
MONGO_PWD_FILE = os.getenv(
    "MONGO_PWD_FILE", "../../thirdparty/security/TLS_mongodb_pass.txt")

with open(MONGO_USER_FILE) as f:
    MONGO_USER = f.read().strip()

with open(MONGO_PWD_FILE) as f:
    MONGO_PWD = f.read().strip()

REDIS_URL = "rediss://:{0}@{1}:6379/0".format(REDIS_PASS, REDIS_HOST)
CELERY_RESULT_BACKEND = str(REDIS_URL)
BROKER_URL = str(REDIS_URL)
app = Celery('workers', broker=BROKER_URL, backend=CELERY_RESULT_BACKEND,
             broker_use_ssl={
                 'ssl_keyfile': keyfile,
                 'ssl_certfile': certfile,
                 'ssl_ca_certs': cacerts,
                 'ssl_cert_reqs': ssl.CERT_REQUIRED
             },
             redis_backend_use_ssl={
                 'ssl_keyfile': keyfile,
                 'ssl_certfile': certfile,
                 'ssl_ca_certs': cacerts,
                 'ssl_cert_reqs': ssl.CERT_REQUIRED
             }
             )


class TLSRequest(Request):
    def on_failure(self, exc_info, send_failed_event=True, return_ok=False):
        job_id = self.args[1]['jobId']
        task_id = self.task_id
        mgclient = pymongo.MongoClient(os.getenv("MONGO_HOST", "localhost"), os.getenv(
            "MONGO_PORT", 27017), userName=MONGO_USER, password=MONGO_PWD, tls=True, tlsAllowInvalidCertificates=True)
        mgdb = mgclient["tls20"]
        jobcl = mgdb.job
        status = jobcl.find_one( {"_id": ObjectId(job_id)}, {"status":1})['status']
        if status != 'COMPLETE':
            revoke(self.task_id, terminate=True)
            jobcl.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": "ERROR", 'jobStatus': {
                           "taskId": task_id,  "status": "ERROR"}}}, upsert=False)


class TLSTask(Task):
    Request = TLSRequest  # you can use a FQN 'my.package:MyRequest'


@app.task(bind=True)
def inference(self, type, status, model, jobData):
    result = ""
    if type == "object detection" and model == "yolo":
        result = yoloInfer(jobData)
    elif type == "object detection":
        result = objectDetectionInfer(jobData)
    elif type == "classification":
        result = classificationInfer(jobData)
    elif type == "segmentation":
        result = segmentationInfer(jobData)
    elif type == "autoencoder":
        result = autoencoderInfer(jobData)

    self.update_state(state='SUCCESS', meta={
                      "status": "RESULT", "result": result})
    raise Ignore()


@app.task(bind=True)
def remoteAgent(self, type, jobData, agentStatus, agentData):

    logger.info(agentStatus)

    agent_id = agentData['id']

    def statusCallback(task_id, state, message, agent_id):
        mgclient = pymongo.MongoClient(os.getenv("MONGO_HOST", "localhost"), os.getenv(
            "MONGO_PORT", 27017), userName=MONGO_USER, password=MONGO_PWD, tls=True, tlsAllowInvalidCertificates=True)
        mgdb = mgclient["tls20"]
        remoteagentcl = mgdb.agent
        status = message['status']
      
        agent_id =  ObjectId(agent_id)
        if status == "DEPLOY SUCCESS":
           
            agentID = ObjectId(message['agentID'])
            remoteagentcl.update_one({"_id": agentID}, {"$set": {
                "agentResult": False, 'agentStatus': "SUCCESS"}}, upsert=False)
        elif status == "DISCONNECTED":
            
            remoteagentcl.update_one({"_id": agent_id}, {"$set": {
                "agentResult": False, 'agentStatus': "DISCONNECTED"}}, upsert=False)
        elif status == 'CONNECTING':
            remoteagentcl.update_one({"_id": agent_id}, {"$set": {
                "agentResult": message['img'], 'agentStatus': 'CONNECTING'}}, upsert=False)

    if agentStatus == "DEPLOY":
        agentData['taskId'] = self.request.id
        agentSubscriber(
            statusCallback, agentData['taskId'], agent_id).subscribe()
        agentPublisher(jobData, agentData).deploy()
        self.update_state(state='SUCCESS', meta={"status": "SUCCESS"})
        raise Ignore()
    elif agentStatus == "INFERENCING":
        agentData['taskId'] = self.request.id
        agentSubscriber(
            statusCallback, agentData['taskId'], agent_id).subscribe()
        agentPublisher(jobData, agentData).infer()
        self.update_state(state='SUCCESS', meta={"status": "SUCCESS"})
        raise Ignore()
    elif agentStatus == "STOP":
        agentData['taskId'] = self.request.id
        agentPublisher(jobData, agentData).stop()
        self.update_state(state='SUCCESS', meta={"status": "SUCCESS"})
        raise Ignore()


@app.task(bind=True, base=TLSTask)
def training(self, type, jobData, model, dataset):
    mgclient = pymongo.MongoClient(os.getenv("MONGO_HOST", "localhost"), os.getenv(
        "MONGO_PORT", 27017), userName=MONGO_USER, password=MONGO_PWD, tls=True, tlsAllowInvalidCertificates=True)
    mgdb = mgclient["tls20"]
    print(mgdb)

    jobcl = mgdb.job

    job_id = jobData['jobId']
    task_id = self.request.id
    self.request.job = jobData

    def statusCallback(task_id, state, message):
        message['taskId'] = task_id
        message['jobId'] = job_id
        jobcl.update_one({"_id": ObjectId(job_id)}, {
                         "$set": {"status": message["status"], 'jobStatus': message}}, upsert=False)
        self.update_state(task_id=task_id, state=state, meta=message)

    jobcl.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": "RUNNING", 'jobStatus': {
                     "taskId": task_id,  "status": "RUNNING"}}}, upsert=False)
    jobData['taskId'] = self.request.id

    if type == "object detection" and model == "yolo":
        YoloTrainer(jobData, dataset, statusCallback).yoloTrainer()
    elif type == "object detection":
        ObjectDetectionTrainer(
            jobData, dataset, statusCallback).objectDetectionTrainer()
    elif type == "classification":
        ClassificationTrainer(
            jobData, dataset, statusCallback).classificationTrainer()
    elif type == "segmentation":
        SegmentationTrainer(
            jobData, dataset, statusCallback).segmentationTrainer()
    elif type == "autoencoder":
        AutoencoderTrainer(
            jobData, dataset, statusCallback).autoencoderTrainer()

    tf.keras.backend.clear_session()
    revoke(self.request.id, terminate=True)

@app.task(bind=True)
def runWorker(self, type, status, jobData, dataset, model):
    mgclient = pymongo.MongoClient(os.getenv("MONGO_HOST", "localhost"), os.getenv(
        "MONGO_PORT", 27017), userName=MONGO_USER, password=MONGO_PWD, tls=True, tlsAllowInvalidCertificates=True)
    mgdb = mgclient["tls20"]
    jobcl = mgdb.job

    job_id = jobData["jobId"]
    try:
        result = training.apply_async(args=(type, jobData, model, dataset))
        self.update_state(state='PROGRESS', meta={
                          "status": "PROCESS", "taskId": result.id, "jobId": jobData['jobId']})
    except:
        print("Error Intercepted")

    raise Ignore()


@app.task(bind=True)
def stopJob(self, type, status, jobData, dataset, model):
    mgclient = pymongo.MongoClient(os.getenv("MONGO_HOST", "localhost"), os.getenv(
        "MONGO_PORT", 27017), userName=MONGO_USER, password=MONGO_PWD, tls=True, tlsAllowInvalidCertificates=True)
    mgdb = mgclient["tls20"]
    jobcl = mgdb.job

    try:
        self.AsyncResult(jobData['taskId']).revoke(terminate=True)
        jobcl.update_one({"_id": ObjectId(jobData['jobId'])}, {
                         "$set": {"status": "STOP", 'jobStatus': "STOP"}}, upsert=False)
        raise Ignore()
    except:
        jobcl.update_one({"_id": ObjectId(jobData['jobId'])}, {
                         "$set": {"status": "STOP", 'jobStatus': {"status": "STOP"}}}, upsert=False)
        raise Ignore()


@app.task(bind=True)
def deleteJob(self, jobData):
    directory = os.path.join(
        './data', '{}_{}'.format(jobData['jobId'], jobData['jobName']))
    if os.path.isdir(directory):
        shutil.rmtree(directory)
    self.update_state(state='SUCCESS', meta={"status": "SUCCESS"})
    raise Ignore()
