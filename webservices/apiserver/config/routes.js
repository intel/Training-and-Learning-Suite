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
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  "GET /api/csrfToken": { action: "security/grant-csrf-token" },
  "POST /api/login": { action: "Auth/login", csrf: false },
  "/api/file/:fileId/cvatsave": "FileController.saveLabelFromCVAT",
  "GET /api/filesync/:datasetId/save": "FileController.saveAllLabelFromCVAT",
  "/api/file/:fileId/cvat": "FileController.getCVATTask",
  "POST /api/dataset/:datasetId/upload": "FileController.upload",
  "/api/dataset/:datasetId/file/:id": {
    controller: "FileController",
    action: "stream",
    skipAssets: false
  },

  "/api/documentation/downloadPDF": "DocumentationController.downloadPDF",
  "/api/dataset/:datasetId": "DatasetController.retrieve",
  "/api/dataset/:datasetId/delete": "DatasetController.delete",

  "DELETE /api/job": "JobController.jobdelete",
  "/api/job/:jobId/training/op": "JobController.trainingop",
  "/api/job/:jobId/inferencing": "JobController.inferencing",
  "/api/job/:jobId/cm": "JobController.cm",
  "/api/job/:jobId/scalardata": "JobController.scalardata",
  "/api/job/:jobId/downloadFP32": "JobController.downloadFP32",
  "/api/job/:jobId/downloadFP16": "JobController.downloadFP16",
  "/api/job/:jobId/downloadFPStd": "JobController.downloadFPStd",
  "/api/systeminfo/retrieve": "SysteminfoController.retrieve",
  "/api/agent/:agentId/deploy": "AgentController.deploy",
  "/api/agent/:agentId/infer": "AgentController.infer"
};
