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
 * JobController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const celery = require("celery-node");
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const dateFormat = require("dateformat");

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
  async jobdelete(req, res) {
    var jobId = req.body.id;

    var job = await Job.findOne({ id: jobId });
    const jobData = {
      jobId: job.id,
      jobName: job.jobName
    };

    var result = await Job.destroyOne({ id: jobId });
    if (result) {
      const task = client.createTask("workers.deleteJob");
      const result = task.applyAsync([jobData]);
    }
    return res.json(result);
  },

  async trainingop(req, res) {
    const { jobId } = req.params;
    const { op } = req.body;

    try {
      if (op == "TRAINING") {
        const job = await Job.findOne({
          id: jobId
        }).populate("project");
        if (!job) {
          return res.notFound();
        }
        const project = await Project.findOne({
          id: job.project.id
        }).populate("labels");

        const { labels } = project;
        const numClass = labels.length;

        try {
          const datasets = await Promise.all(
            labels.map(async label => {
              const labelsData = await LabelData.find({
                label: label.id
              })
                .populate("label")
                .populate("file");

              return labelsData;
            })
          );


          const jobData = {
            jobId: job.id,
            projectId: project.id,
            jobName: job.jobName,
            model: job.jobModel,
            configuration: job.jobConfiguration,
            min_dimension: job.minDin,
            max_dimension: job.maxDin,
            type: project.type,
            datasetSplit: project.datasetSplit,
            datasetAug: project.datasetAugmentation,
            numberClass: numClass,
            labels
          };
          type = project.type;
          status = job.jobStatus.status;
          model = job.jobModel;

          const task = client.createTask("workers.runWorker");
          const result = task.applyAsync([
            type,
            status,
            jobData,
            datasets,
            model
          ]);
          return res.json(datasets);
        } catch (err) {
          return res.negotiate(err);
        }
      } else if (op == "STOP") {
        const job = await Job.findOne({
          id: jobId
        });

        type = "stop";
        jobData = { taskId: job.jobStatus.taskId, jobId: jobId };

        const task = client.createTask("workers.stopJob");
        const result = task.applyAsync([type, null, jobData, null, null]);
        return res.json("success");
      }
    } catch (err) {
      switch (err) {
        case "Error":
          return res.badRequest(err);
        default:
          throw err;
      }
    }
  },

  async inferencing(req, res) {
    const { jobId } = req.params;
    const { op } = req.body;
    const image = op['image']
    const confident = op['confident']


    try {
      const job = await Job.findOne({
        id: jobId
      }).populate("project");

      if (!job) {
        return res.notFound();
      }
      const project = await Project.findOne({
        id: job.project.id
      }).populate("labels");

      const { labels } = project;
      const fpath = path.join(
        __dirname,
        `../../../../nnframework/tf/data/${job.id}_${job.jobName}/model/FP32/frozen_inference_graph.xml`
      );

      if (fs.existsSync(fpath)) {
        const jobData = {
          jobId: job.id,
          projectId: project.id,
          jobName: job.jobName,
          model: job.jobModel,
          type: project.type,
          labels,
          image: image,
          confident: confident
        };

        type = project.type;
        status = job.jobStatus;
        model = job.jobModel;

        const task = client.createTask("workers.inference");
        const result = task.applyAsync([type, status, model, jobData]);
        result.get().then(rdata => {
          res.json(rdata.result);
        });
      } else {
        res.json("model is not ready yet");
      }
    } catch (err) {
      return res.negotiate(err);
    }
  },

  async cm(req, res) {
    const { jobId } = req.params;
    try {
      const job = await Job.findOne({
        id: jobId
      }).populate("project");
      if (!job) {
        return res.notFound();
      }

      const cm = path.join(
        `../../nnframework/tf/data/${job.id}_${job.jobName}/model/confusionMatrix.png`
      );
      if (fs.existsSync(cm)) {
        Jimp.read(cm).then(img => {
          img.getBase64(Jimp.MIME_PNG, (error, base64) => {
            res.json(base64);
          });
        });
      } else {
        res.json(null);
      }
    } catch (err) {
      return res.negotiate(err);
    }
  },

  async scalardata(req, res) {
    const { jobId } = req.params;
    try {
      const job = await Job.findOne({
        id: jobId
      }).populate("project");
      if (!job) {
        return res.notFound();
      }

      const sd = path.join(
        `../../nnframework/tf/data/${job.id}_${job.jobName}/model/scalarData.json`
      );
      const propArray = ["learning_rate_1", "global_norm/gradient_norm", "loss_1", "global_norm/clipped_gradient_norm", "loss_2"];
      var parsedObj, safeObj = {};
      if (fs.existsSync(sd)) {
        fs.readFile(sd, "utf8", (error, jsonString) => {
          if (error) throw error;
          try {
            parsedObj = JSON.parse(jsonString);
            if (typeof parsedObj !== "object" || Array.isArray(parsedObj)) {
              safeObj = parsedObj;
            } else {
              propArray.forEach(function(prop) {
                if (parsedObj.hasOwnProperty(prop)) {
                  safeObj[prop] = parsedObj[prop];
                  }
                });
              }
            res.json(safeObj);
            } catch (error) {
              rs.negotiate(error);
              }
          });
        } else {
          res.json(null);
          }
    } catch (err) {
      return res.negotiate(err);
    }
  },

  async downloadFP32(req, res) {
    const { jobId } = req.params;

    try {
      const job = await Job.findOne({
        id: jobId
      }).populate("project");
      if (!job) {
        return res.notFound();
      }
      const fpath = path.join(
        __dirname,
        `../../../../nnframework/tf/data/${job.id}_${job.jobName}/model/FP32`,
        `${job.id}_${job.jobName}_FP32.zip`
      );

      const formatted_date = dateFormat(new Date(), "yyyymmdd_hMMss");
      var filename =
        `${job.id}`.substr(`${job.id}`.length - 4) +
        `_${job.jobName}` +
        "_" +
        formatted_date +
        "_FP32.zip";
      return res.download(fpath, filename);
    } catch (err) {
      return res.err(err);
    }
  },

  async downloadFP16(req, res) {
    const { jobId } = req.params;

    try {
      const job = await Job.findOne({
        id: jobId
      }).populate("project");
      if (!job) {
        return res.notFound();
      }
      const fpath = path.join(
        __dirname,
        `../../../../nnframework/tf/data/${job.id}_${job.jobName}/model/FP16`,
        `${job.id}_${job.jobName}_FP16.zip`
      );

      const formatted_date = dateFormat(new Date(), "yyyymmdd_hMMss");
      var filename =
        `${job.id}`.substr(`${job.id}`.length - 4) +
        `_${job.jobName}` +
        "_" +
        formatted_date +
        "_FP16.zip";
      return res.download(fpath, filename);
    } catch (err) {
      return res.err(err);
    }
  },

  async downloadFPStd(req, res) {
    const { jobId } = req.params;

    try {
      const job = await Job.findOne({
        id: jobId
      }).populate("project");
      if (!job) {
        return res.notFound();
      }
      const fpath = path.join(
        __dirname,
        `../../../../nnframework/tf/data/${job.id}_${job.jobName}/model`,
        "frozen_inference_graph.pb"
      );
      const formatted_date = dateFormat(new Date(), "yyyymmdd_hMMss");
      var filename =
        `${job.id}`.substr(`${job.id}`.length - 4) +
        `_${job.jobName}` +
        "_" +
        formatted_date +
        ".pb";
      return res.download(fpath, filename);
    } catch (err) {
      return res.err(err);
    }
  }
};
