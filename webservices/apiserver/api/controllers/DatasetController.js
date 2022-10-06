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
 * DatasetController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

module.exports = {
  async retrieve(req, res) {
    const { datasetId } = req.params;

    const datasetPtr = await Dataset.findOne({
      id: datasetId,
    })
      .populate("files")
      .populate("labels");

    datasetPtr.files = await Promise.all(
      datasetPtr.files.map(async (file) => {
        const filePtr = await UploadedFile.findOne({
          id: file.id,
        }).populate("labels");

        // eslint-disable-next-line no-unused-expressions
        delete filePtr.file, filePtr.createdAt, filePtr.updatedAt;

        return filePtr;
      })
    );

    return res.json(datasetPtr);
  },

  async delete(req, res) {
    const { datasetId } = req.params;
    const datasetPtr = await Dataset.findOne({
      id: datasetId,
    })
      .populate("files")
      .populate("labels");

    const datasetPath = path.join(`./datasets/${datasetPtr.id}`);
    if (fs.existsSync(datasetPath)) {
      const files = datasetPtr.files;
      files.map(async (file) => {
        const destroyedFilesRecords = await UploadedFile.destroy({
          id: file.id,
        });
      });
      const labels = datasetPtr.labels;
      labels.map(async (label) => {
        const labelsData = await LabelData.find({
          label: label.id,
        })
          .populate("label")
          .populate("file");
        labelsData.map(async (labelinfo) => {
          const destroyedLabelsData = await LabelData.destroy({
            id: labelinfo.id,
          });
        });

        const destroyedLabelsRecords = await Label.destroy({ id: label.id });
      });

      const destroyedRecords = await Dataset.destroy({ id: datasetId }).fetch();
      fs.rmdir(datasetPath, function (err) {
        if (err) {
          throw err;
        }
      });
    } else {
      const destroyedRecords = await Dataset.destroy({ id: datasetId }).fetch();
    }

    res.json("success");
  },
  // TODO: form cvat task for the file
};
