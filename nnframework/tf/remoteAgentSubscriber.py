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

import paho.mqtt.client as mqtt
import json
import struct
import os
import ssl
import logging
import pymongo

MQTT_USER_FILE = os.getenv(
    "MQTT_USER_FILE", "../../thirdparty/security/TLS_mqtt_username.txt")
MQTT_PWD_FILE = os.getenv(
    "MQTT_PWD_FILE", "../../thirdparty/security/TLS_mqtt_pass.txt")

with open(MQTT_USER_FILE) as f:
    MQTT_USER = f.read().strip()

with open(MQTT_PWD_FILE) as f:
    MQTT_PWD = f.read().strip()


MONGO_USER_FILE = os.getenv(
    "MONGO_USER_FILE", "../../thirdparty/security/TLS_mongodb_username.txt")
MONGO_PWD_FILE = os.getenv(
    "MONGO_PWD_FILE", "../../thirdparty/security/TLS_mongodb_pass.txt")

with open(MONGO_USER_FILE) as f:
    MONGO_USER = f.read().strip()

with open(MONGO_PWD_FILE) as f:
    MONGO_PWD = f.read().strip()


myclient = pymongo.MongoClient(
    os.getenv("MONGO_HOST", "localhost"), os.getenv("MONGO_PORT", 27017), userName=MONGO_USER, password=MONGO_PWD)
mydb = myclient["tls20"]
remoteagentcl = mydb.agent


class agentSubscriber():
    def __init__(self, status_cb, task_id, agent_id):
        self.status_cb = status_cb
        self.task_id = task_id
        self.agent_id = agent_id

        self.client = mqtt.Client(clean_session=True)
        try:
            self.client.tls_set("/run/secrets/ca_tls", certfile="/run/secrets/tlscore_cert",
                                keyfile="/run/secrets/tlscore_key", cert_reqs=ssl.CERT_NONE)
        except BaseException as e:
            self.client.tls_set("../../thirdparty/security/ca/ca_certificate.pem", certfile="../../thirdparty/security/TLS_core_cert.crt",
                                keyfile="../../thirdparty/security/TLS_core_key.pem", cert_reqs=ssl.CERT_NONE)

        self.client.username_pw_set(MQTT_USER, MQTT_PWD)
        self.client.connect(os.getenv("MQTT_HOST", "localhost"), 8883, 60)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, rc):
        print("Connected with result code "+str(rc))
        self.client.subscribe("/tls/remoteagent/op/response")
        self.client.subscribe("/tls/remoteagent/op/inference/#")

    def on_message(self, client, userdata, msg):
        jsonData = json.loads(msg.payload.decode("utf-8", "ignores"))
        
        if jsonData['status'] == 'complete':
            ID = jsonData['agentID']
            if ID != self.agent_id:
                pass
            else:
                jsonData["status"] = "DEPLOY SUCCESS"
                self.status_cb(self.task_id, 'SUCCESS', jsonData, self.agent_id)
                # self.stop()
        elif jsonData["status"] == 'result':
            jsonData["status"] = "CONNECTING"
            self.status_cb(self.task_id, 'SUCCESS', jsonData, self.agent_id)
        elif jsonData["status"] == "stop":
            jsonData["status"] = "DISCONNECTED"
            self.status_cb(self.task_id, 'SUCCESS', jsonData, self.agent_id)
            self.stop()

    def subscribe(self):
        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
