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
    async function updateProjectLabels(datasetId, labels) {
      let results = await cvat.request("/projects", {
        method: "GET",
        params: {
          page_size: 100
        }
      });

      let projects = results.data.results;
      let selectedProject = null;
      if (projects.length > 0) {
        for (index in projects) {
          if (projects[index].name == `${datasetId}`) {
            selectedProject = projects[index];
            break;
          }
        }

        // let newlabels = labels
        //   .filter(label => label.type !== "wholeImg")
        //   .map(
        //     label =>
        //     ({
        //       name: label.name.replace(`${datasetId}_`, ""),
        //       attributes: []
        //     })
        //   );

        let clabeldict = Object.assign({}, ...selectedProject.labels.map((x) => ({ [x.name]: x.id })));
        console.log(clabeldict);

        // Get Existing Labels
        let clabels = selectedProject.labels.map(label => label.name);

        // Get New Labels
        let nlabels = labels
          .filter(label => label.type !== "wholeImg")
          .map(
            label => label.name.replace(`${datasetId}_`, "")
          );

        if (nlabels.length != clabels.length) {
          let diff = []
          let todelete = false
          if (nlabels.length > clabels.length)
            diff = nlabels.filter(x => !clabels.includes(x));
          else {
            diff = clabels.filter(x => !nlabels.includes(x));
            todelete = true
          }

          console.log(diff);
          let newlabels = [];

          if (todelete) {
            newlabels = diff
              .map(
                label =>
                ({
                  id: clabeldict[label],
                  name: label,
                  deleted: todelete
                })
              );
          } else {
            newlabels = diff
              .map(
                label =>
                ({
                  name: label,
                  attributes: []
                })
              );
          }

          let dataset = await Dataset.findOne({
            where: {
              id: datasetId
            }
          });

          let projectSaved = await cvat.request(`/projects/${dataset.projectid}`, {
            method: "PATCH",
            data: {
              labels: newlabels
            }
          });

          return projectSaved;
        }

        return selectedProject;
      }
    }

    async function findCVATTask(datasetId, fileId, labels) {
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


    async function createCVATTask(labels, datasetId, fileId, fileEntry, projectid) {
      const taskDescription = {
        name: `${datasetId}_${fileId}`,
        project_id: projectid,
      };

      const taskCreated = await cvat.request("/tasks", {
        method: "POST",
        data: taskDescription,
        headers: {
          "Content-Type": "application/json"
        }
      });

      const formData = new FormData();
      const imageFile = fs.readFileSync(fileEntry.path);
      formData.append("client_files[0]", imageFile, fileEntry.path);
      formData.append("image_quality", 70);
      const length = formData.getLengthSync();
      await cvat.request(`/tasks/${taskCreated.data.id}/data`, {
        method: "POST",
        headers: { "Content-Length": length, ...formData.getHeaders() },
        data: formData
      });

      return taskCreated;
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

    let task = await findCVATTask(fileEntry.dataset.id, fileEntry.id, labels);
    // console.log(task);

    try {
      if (task) {
        project = await updateProjectLabels(fileEntry.dataset.id, labels);

        return res.json({ taskId: task.id, jobId: task.segments[0].jobs[0].id });
      }

      task = await createCVATTask(
        labels,
        fileEntry.dataset.id,
        fileEntry.id,
        fileEntry,
        dataset.projectid
      );

      await delayTime(100);

      task = await findCVATTask(fileEntry.dataset.id, fileEntry.id, labels);

      return res.json({ taskId: task.id, jobId: task.segments[0].jobs[0].id });

    } catch (err) {
      if (task) {
        await cvat.request(`/tasks/${task.id}`, {
          method: "DELETE"
        });
      }
      return res.badRequest(err);
    }
  },

  async saveLabelFromCVAT(req, res) {
    const fileId = req.param("fileId");

    try {
      const uploadedFile = await UploadedFile.findOne({
        id: fileId
      });

      if (!uploadedFile) {
        return res.notFound();
      }

      const dataset = await Dataset.findOne({
        id: uploadedFile.dataset
      }).populate("labels");

      let results = await cvat.request("/tasks", {
        method: "GET",
        params: {
          page_size: 100
        }
      });

      let tasks = results.data.results;
      let cvatTask = null;
      if (tasks.length > 0) {
        for (index in tasks) {
          if (tasks[index].name == `${dataset.id}_${uploadedFile.id}`) {
            cvatTask = tasks[index];
            break;
          }
        }
      }

      let downloadedAnnotations = "";
      downloadedAnnotations = await cvat.request(`/tasks/${cvatTask.id}/annotations?action=download&filename=a.zip&format=COCO%201.0`, { method: "GET", responseType: 'arraybuffer' });
      var payload = downloadedAnnotations.data.toString();

      if (payload == "") {
        await delayTime(500);
        downloadedAnnotations = await cvat.request(`/tasks/${cvatTask.id}/annotations?action=download&filename=a.zip&format=COCO%201.0`, { method: "GET", responseType: 'arraybuffer' });
        payload = downloadedAnnotations.data.toString();
      }

      var bcIndex = payload.indexOf("{");
      var ecIndex = payload.search("}PK");

      var slicedPayload = payload.slice(bcIndex, ecIndex + 1);
      var annotations = JSON.parse(slicedPayload);

      const {
        annotations: newAnnotations,
        categories
      } = annotations;

      await LabelData.destroy({
        file: uploadedFile.id
      });

      newAnnotations.map(async annotation => {
        const labelName = categories.find(category => {
          return category.id === annotation.category_id;
        }).name;

        const label = dataset.labels.find(labelPtr => {
          return labelPtr.name.replace(`${dataset.id}_`, "") === labelName;
        });

        await LabelData.create({
          file: uploadedFile.id,
          label: label.id,
          bbox: annotation.bbox,
          segmentation: annotation.segmentation
        });
      });

      return res.json({
        message: "success"
      });

    } catch (e) {
      return res.badRequest(e);
    }
  },

  async saveAllLabelFromCVAT(req, res) {
    try {
      const datasetId = req.param("datasetId");

      const dataset = await Dataset.findOne({
        id: datasetId
      });

      const labels = await Label.find({
        dataset: datasetId
      });

      const uploadedFiles = await UploadedFile.find({
        dataset: datasetId
      });

      const formats = await cvat.cvatCore.server.formats();
      const format = formats.find(formatPtr => formatPtr.name === "COCO");
      const dumper = format.dumpers[0];

      Promise.all(
        uploadedFiles.map(async uploadedFile => {
          let cvatTasks = await cvat.cvatCore.tasks.get({
            name: `${dataset.id}_${uploadedFile.id}`
          });

          if (cvatTasks.length > 0) {
            cvatTask = cvatTasks[0];
            const job = cvatTask.jobs[0];

            // const downloadUrl = await job.annotations.dump(
            //   `${dataset.id}_${uploadedFile.id}`,
            //   dumper
            // );

            const downloadedAnnotations = await cvat.request(`/tasks/${cvatTask.id}/annotations?action=download&filename=a&format=COCO%201.0`)
            // const downloadedAnnotations = await cvat.request(
            //   downloadUrl.replace(sails.config.cvat.backendAPI, ""),
            //   {
            //     method: "get"
            //   }
            // );
            console.log(downloadedAnnotations);


            const {
              annotations: newAnnotations,
              categories
            } = downloadedAnnotations.data;

            if (newAnnotations) {
              await LabelData.destroy({
                file: uploadedFile.id
              });

              newAnnotations.map(async annotation => {
                const labelName = categories.find(category => {
                  return category.id === annotation.category_id;
                }).name;

                const label = labels.find(labelPtr => {
                  return labelPtr.name.replace(`${dataset.id}_`, "") === labelName;
                });

                await LabelData.create({
                  file: uploadedFile.id,
                  label: label.id,
                  bbox: annotation.bbox,
                  segmentation: annotation.segmentation
                });
              });
            }
          }
          return Promise.resolve();
        })).then(result => { return res.json(dataset); }).catch(error => { })
    } catch (e) {
      return res.badRequest(e);
    }
  },

};
