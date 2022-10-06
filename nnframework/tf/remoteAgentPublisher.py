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

import logging
import os
import paho.mqtt.client as mqtt
import logging as log
import json
import struct
import time
import ssl
from celery.utils.log import get_task_logger
logger = get_task_logger(__name__)

MQTT_USER_FILE = os.getenv(
    "MQTT_USER_FILE", "../../thirdparty/security/TLS_mqtt_username.txt")
MQTT_PWD_FILE = os.getenv(
    "MQTT_PWD_FILE", "../../thirdparty/security/TLS_mqtt_pass.txt")

with open(MQTT_USER_FILE) as f:
    MQTT_USER = f.read().strip()

with open(MQTT_PWD_FILE) as f:
    MQTT_PWD = f.read().strip()


class agentPublisher:
    def __init__(self, jobData, agentData):
        self.jobData = jobData
        # create a client
        self.client = mqtt.Client()
        try:
            self.client.tls_set("/run/secrets/ca_tls", certfile="/run/secrets/tlscore_cert",
                                keyfile="/run/secrets/tlscore_key", cert_reqs=ssl.CERT_NONE)
        except BaseException:
            self.client.tls_set("../../thirdparty/security/ca/ca_certificate.pem", certfile="../../thirdparty/security/TLS_core_cert.crt",
                                keyfile="../../thirdparty/security/TLS_core_key.pem", cert_reqs=ssl.CERT_NONE)
        self.client.username_pw_set(MQTT_USER, MQTT_PWD)
        self.client.on_publish = self.on_publish

        self.client.connect(os.getenv("MQTT_HOST", "localhost"), 8883, 60)
        self.client.loop_start()
        self.agentData = agentData

    def on_publish(self, client, userdata, result):
        # self.client.loop_stop()
        pass

    def publish(self, uuid, jsonData, binData=b''):
        jsonDump = json.dumps(jsonData)
        jsonString = struct.pack('>I', len(jsonDump)) + \
            jsonDump.encode("utf-8") + binData
        self.client.publish("/tls/remoteagent/op/" + uuid, jsonString)

    def deploy(self):
        jobid = self.jobData['jobId']
        jobname = self.jobData['jobName']
        agentName = self.agentData['agentName']
        agentUUID = self.agentData['agentUUID']
        agentID = self.agentData['id']
        

        url32 = self.jobData['fp32']
        url16 = self.jobData['fp16']
        self.publish(agentUUID, {"op": 'deploy', "uuid": agentUUID,"agentID":agentID,
                                 'name': agentName, "modeltype": 'fp32', 'URL': url32})
        time.sleep(3)

        self.publish(agentUUID, {"op": 'deploy', "uuid": agentUUID, "agentID":agentID, 
                                 'name': agentName, "modeltype": 'fp16', 'URL': url16})

    def infer(self):
        agentName = self.agentData['agentName']
        agentUUID = self.agentData['agentUUID']
        labels = self.jobData['labels']
        
        inferLabels = []
        for x in labels:
            label = x['name'].split("_")[1]
            inferLabels.append(label)
        self.publish(agentUUID, {"op": "infer", "uuid": agentUUID,
                                 'name': agentName, "labels": inferLabels})

    def stop(self):
        agentUUID = self.agentData['agentUUID']
        self.publish(agentUUID, {"op": "inferstop", "uuid": agentUUID})
