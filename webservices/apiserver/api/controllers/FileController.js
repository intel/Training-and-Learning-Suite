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
 * UploadedFileController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const path = require("path");
const sizeOf = require("image-size");
const FormData = require("form-data");
const fs = require("fs");
const { resolve, parse } = require("path");

const uploadPath = path.resolve(sails.config.appPath, "datasets");
const { cvat } = sails.config;

function delayTime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  async upload(req, res) {
    const { datasetId } = req.params;

    const datasetPtr = await Dataset.findOne({
      id: datasetId
    });

    if (!datasetPtr) {
      return res.notFound();
    }

    let labelIds = [];

    if (req.body.labelValues) {
      labelIds = req.body.labelValues.split(",");

      labelIds.map(async labelId => {
        const labelPtr = await Label.findOne({ id: labelId });
        if (labelPtr) {
          return true;
        }
        return false;
      });

      if (labelIds.indexOf(false) !== -1) {
        return res.notFound();
      }
    }

    return req.file("files").upload(
      {
        dirname: path.resolve(uploadPath, datasetId)
      },
      async function whenDone(err, uploadedFiles) {
        if (err) {
          return res.serverError(err);
        }

        if (uploadedFiles.length === 0) {
          return res.badRequest("No file was uploaded");
        }

        try {
          const records = await Promise.all(
            uploadedFiles.map(async uploadedFile => {
              const uid = path
                .basename(uploadedFile.fd)
                .split(".")
                .slice(0, -1)
                .join(".");

              const dimensions = sizeOf(uploadedFile.fd);
              const uploadFileRecord = await UploadedFile.create({
                name: uploadedFile.filename,
                path: uploadedFile.fd,
                uid,
                dataset: datasetId,
                width: dimensions.width,
                height: dimensions.height
              }).fetch();

              // Assign image to the label
              labelIds.map(async labelId => {
                await LabelData.create({
                  file: uploadFileRecord.id,
                  label: labelId
                });
              });

              return uploadFileRecord;
            })
          );

          return res.json({
            success: true,
            records
          });
        } catch (uploadErr) {
          return res.negotiate(uploadErr);
        }
      }
    );
  },

  stream(req, res) {
    const datasetId = req.param("datasetId");

    const fileIdArray = req.param("id").split(".");

    // if the filename consist of extension name, remove it
    if (fileIdArray.length > 1) {
      fileIdArray.pop();
    }
    const fileId = fileIdArray.reduce((prev, cur) => {
      return prev + cur;
    }, "");

    UploadedFile.findOne({
      id: fileId,
      dataset: datasetId
    }).exec((err, file) => {
      if (err) {
        return res.negotiate(err);
      }

      if (!file) {
        return res.notFound();
      }

      return res.sendFile(file.path);
    });
  },

  async getCVATTask(req, res) {
    async function _findCVATTask(datasetId, fileId, labels) {
      let results = await cvat.request("/tasks", {
        method: "GET",
        params: {
          page_size: 100
        }
      });

      let tasks = results.data.results;
      if (tasks.length > 0) {
        let selectedTask = null;
        for (index in tasks) {
          if (tasks[index].name == `${datasetId}_${fileId}`) {
            selectedTask = tasks[index];
            break;
          }
        }

        if (selectedTask == null)
          return null;

        // let olabels = labels
        //   .filter(label => label.type !== "wholeImg")
        //   .map(
        //     label => label.name.replace(`${datasetId}_`, "")
        //   );

        // let tlabels = selectedTask.labels.map(label => label.name);

        // if (olabels.length != tlabels.length) {
        //   let dataset = await Dataset.findOne({
        //     where: {
        //       id: datasetId
        //     }
        //   });

        //   let projectSaved = await cvat.request(`/projects/${dataset.projectid}`, {
        //     method: "PATCH",
        //     data: {
        //       labels: newlabels
        //     }
        //   });
        return selectedTask;
      }

      return null;
    }

    async function _createCVATTask(labels, datasetId, fileId, fileEntry, projectid) {
      const taskDescription = {
        name: `${datasetId}_${fileId}`,
        project_id: projectid,
      };

      await cvat.request("/tasks", {
        method: "POST",
        data: taskDescription,
        headers: {
          "Content-Type": "application/json"
        }
      }).then(async function(taskCreated) {
        const formData = new FormData();
        const imageFile = fs.readFileSync(fileEntry.path);
        formData.append("client_files[0]", imageFile, fileEntry.path);
        formData.append("image_quality", 70);

        const length = formData.getLengthSync();
        await cvat.request(`/tasks/${taskCreated.data.id}/data`, {
          method: "POST",
          headers: { "Content-Length": length, ...formData.getHeaders() },
          data: formData
        }).then(function(response) {
          return taskCreated;
        });

      });
    }

    const fileId = req.param("fileId");
    const fileEntry = await UploadedFile.findOne({
      id: fileId
    }).populate("dataset");

    if (!fileEntry) {
      return res.notFound();
    }

    let dataset = await Dataset.findOne({
      where: {
        id: fileEntry.dataset.id
      }
    });

    const labels = await Label.find({
      where: {
        dataset: fileEntry.dataset.id
      }
    });

    if (dataset.projectid == '') {
      const nonWholeImageLabel = labels
        .filter(label => label.type !== "wholeImg")
        .map(label => ({
          name: label.name.replace(`${dataset.id}_`, ""),
          attributes: []
        }));

      const project = await cvat.request("/projects", {
        method: "POST",
        data: {
          name: dataset.id,
          labels: nonWholeImageLabel
        }
      });
      dataset = await Dataset.updateOne({ id: dataset.id }).set({ projectid: project.data.id });
    }

    let task = await _findCVATTask(fileEntry.dataset.id, fileEntry.id, labels);
    try {
      if (task != null) {
        return res.json({ taskId: task.id, jobId: task.segments[0].jobs[0].id });
      }

      await _createCVATTask(
        labels,
        fileEntry.dataset.id,
        fileEntry.id,
        fileEntry,
        dataset.projectid
      );

      await delayTime(500);

      let result = await _findCVATTask(fileEntry.dataset.id, fileEntry.id, labels);
      return res.json({ taskId: result.id, jobId: result.segments[0].jobs[0].id });

    } catch (err) {
      if (task != null) {
        await cvat.request(`/tasks/${task.id}`, {
          method: "DELETE"
        });
      }
      return res.badRequest(err);
    }
  },


  async updateCVATLabels(req, res) {
    let datasetId = req.param('datasetId');

    let datasetLabels = await Dataset.findOne({
      id: datasetId
    }).populate("labels");

    let dataset = datasetLabels;
    let labels = datasetLabels.labels;

    let projectdetail = await cvat.request(`/projects/${dataset.projectid}`);
    let projectlabels = projectdetail.data.labels;
    let newlabels = [];

    //cvat labels more than project labels
    if(projectlabels.length > labels.length) {
      for(var idx in projectlabels) {
        let lblname = projectlabels[idx].name;
        let found = labels.find(labelPtr => {
          return labelPtr.name.replace(`${dataset.id}_`, "") == lblname;
        });
        if(found == undefined) {
          var todelete = projectlabels[idx];
          todelete['deleted'] = true;
          newlabels.push(todelete);
        } else {
          newlabels.push(projectlabels[idx]);
        }
      }
    } else {
      for(var idx in labels) {
        let lblname = labels[idx].name.replace(`${dataset.id}_`, "");
        let found = projectlabels.find(labelPtr => {
          return labelPtr.name === lblname;
        });
        if (found == undefined) {
          newlabels.push({ name: lblname, attributes: [] });
        } else {
          newlabels.push(found);
        }
      }
    }

    await cvat.request(`/projects/${dataset.projectid}`, {
      method: "PATCH",
      data: {
        labels: newlabels
      }
    });

    return res.json({message: "success"});
  },

  async labelSyncFromCVAT(req, res) {
    async function _updateCVATLabels(dataset, labels) {
      let projectdetail = await cvat.request(`/projects/${dataset.projectid}`);
      let projectlabels = projectdetail.data.labels;
      let newlabels = [];

      //cvat labels more than project labels
      if(projectlabels.length > labels.length) {
        for(var idx in projectlabels) {
          let lblname = projectlabels[idx].name;
          let found = labels.find(labelPtr => {
            return labelPtr.name.replace(`${dataset.id}_`, "") == lblname;
          });
          if(found == undefined) {
            var todelete = projectlabels[idx];
            todelete['deleted'] = true;
            newlabels.push(todelete);
          } else {
            newlabels.push(projectlabels[idx]);
          }
        }
      } else {
        for(var idx in labels) {
          let lblname = labels[idx].name.replace(`${dataset.id}_`, "");
          let found = projectlabels.find(labelPtr => {
            return labelPtr.name === lblname;
          });
          if (found == undefined) {
            newlabels.push({ name: lblname, attributes: [] });
          } else {
            newlabels.push(found);
          }
        }
      }

      await cvat.request(`/projects/${dataset.projectid}`, {
        method: "PATCH",
        data: {
          labels: newlabels
        }
      });
    }

    const datasetId = req.param("datasetId");

    const datasetFiles = await Dataset.findOne({
      id: datasetId
    }).populate("files");

    let datasetLabels = await Dataset.findOne({
      id: datasetId
    }).populate("labels");

    // await _updateCVATLabels(datasetFiles, datasetLabels.labels);
    
    // datasetLabels = await Dataset.findOne({
    //   id: datasetId
    // }).populate("labels");

    var projectId = datasetFiles.projectid;
    let projectAnnotations = await cvat.request.get(`/projects/${projectId}/annotations?action=download&format=COCO%201.0&location=local`);
    await delayTime(2500);
    projectAnnotations = await cvat.request.get(`/projects/${projectId}/annotations?action=download&format=COCO%201.0&location=local`);
    
    let payload = projectAnnotations.data.toString();
    
    if (payload == "") {
      return res.json({ message: "empty" });
    } else {
      var bcIndex = payload.indexOf(".json{");
      var ecIndex = payload.search("}PK");
      var slicedPayload = payload.slice(bcIndex+5, ecIndex + 1);
      var parsedPayload = JSON.parse(slicedPayload);

      for(var index in datasetFiles.files) {
        await LabelData.destroy({
          file: datasetFiles.files[index].id
        });
      }

      const {
          annotations: newAnnotations,
          categories,
          images
      } = parsedPayload;

      newAnnotations.map(async annotation=>{
        const labelName = categories.find(category => {
          return category.id === annotation.category_id;
        }).name;

        const label = datasetLabels.labels.find(labelPtr => {
          return labelPtr.name.replace(`${datasetLabels.id}_`, "") === labelName;
        });

        const imageId = path.parse(images.find(image => {
          return image.id === annotation.image_id;
        }).file_name).name;

        const fileId = datasetFiles.files.find(filePtr => {
          return filePtr.uid === imageId;
        }).id;

        await LabelData.create({
          file: fileId,
          label: label.id,
          bbox: annotation.bbox,
          segmentation: annotation.segmentation
        });

      });

      return res.json({
        message: "success"
      });
    }
  },

};
