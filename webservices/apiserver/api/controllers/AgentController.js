/* Copyright (c) 2020 Intel Corporation.

* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:

* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.

* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

/**
 * AgentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const celery = require("celery-node");
const fs = require("fs");
const redis_host = process.env.REDIS_HOST || "localhost";
const redis_pass_file =
  process.env.REDIS_PASS || "../../thirdparty/security/TLS_redis_pass.txt";
const ca_cert_file =
  process.env.CA_CERT || "../../thirdparty/security/ca/ca_certificate.pem";

const client = celery.createClient(
  `redis://${redis_host}:6379/0`,
  `redis://${redis_host}:6379/0`
);

client.conf.TASK_PROTOCOL = 1;
client.conf.CELERY_BROKER_OPTIONS = {
  password: fs
    .readFileSync(redis_pass_file)
    .toString()
    .trim(),
  tls: {
    ca: fs.readFileSync(ca_cert_file),
    checkServerIdentity: () => {
      return null;
    }
  }
};
client.conf.CELERY_BACKEND_OPTIONS = {
  password: fs
    .readFileSync(redis_pass_file)
    .toString()
    .trim(),
  tls: {
    ca: fs.readFileSync(ca_cert_file),
    checkServerIdentity: () => {
      return null;
    }
  }
};



module.exports = {
  async deploy(req, res) {
    const { agentId } = req.params;

    try {
      const agent = await Agent.findOne({
        id: agentId
      })
        .populate("job")
        .populate("project");

      if (!agent) {
        return res.notFound();
      }

      const job = agent.job;
      const project = agent.project;

      const label = await Project.findOne({
        id: project.id
      }).populate("labels");

      const { labels } = label;

      const url32 = `/api/job/${job.id}/downloadFP32/`
      const url16 = `/api/job/${job.id}/downloadFP16/`

      const jobData = {
        jobId: job.id,
        projectId: project.id,
        jobName: job.jobName,
        model: job.jobModel,
        type: project.type,
        labels,
        fp32: url32,
        fp16: url16
      };

      type = project.type;
      model = job.jobModel;

      const task = client.createTask("workers.remoteAgent");
      const result = task.applyAsync([type, jobData, "DEPLOY", agent]);
      return res.json(true);
    } catch (err) {
      return res.negotiate(err);
    }
  },

  async infer(req, res) {
    const { agentId } = req.params;
    const { op } = req.body;
    try {
      const agent = await Agent.findOne({
        id: agentId
      })
        .populate("job")
        .populate("project");

      if (!agent) {
        return res.notFound();
      }

      const job = agent.job;
      const project = agent.project;

      const label = await Project.findOne({
        id: project.id
      }).populate("labels");

      const { labels } = label;
      const jobData = {
        jobId: job.id,
        projectId: project.id,
        jobName: job.jobName,
        model: job.jobModel,
        type: project.type,
        labels
      };

      type = project.type;
      model = job.jobModel;
      if (op == "INFERENCING") {
        const task = client.createTask("workers.remoteAgent");
        const result = task.applyAsync([type, jobData, op, agent]);

      } else if (op == "STOP") {
        const task = client.createTask("workers.remoteAgent");
        const result = task.applyAsync([type, jobData, op, agent]);

      }

      return res.json(true);
    } catch (err) {
      return res.negotiate(err);
    }
  }
};
