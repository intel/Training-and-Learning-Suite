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

const url = require("url");
const cvatCore = {};

let backendAPI = process.env.CVAT_URL || "http://localhost:8080/api";
console.log(backendAPI);

const username = "admin";
const password = "password";
const axios = require("axios");
const instance = axios.create({
  baseURL: backendAPI,
});
instance.defaults.withCredentials = true;
instance.defaults.xsrfHeaderName = "X-CSRFTOKEN";
instance.defaults.xsrfCookieName = "csrftoken";
instance.defaults.headers.common.Authorization = "";

global.URLSearchParams = url.URLSearchParams;

async function getAuthenticationToken() {
  const authenticationData = [
    `${encodeURIComponent("username")}=${encodeURIComponent(username)}`,
    `${encodeURIComponent("password")}=${encodeURIComponent(password)}`,
  ]
    .join("&")
    .replace(/%20/g, "+");

  const authenticationResponse = await instance.post(
    "/auth/login",
    authenticationData
  );

  if (authenticationResponse.headers["set-cookie"]) {
    const cookies = authenticationResponse.headers["set-cookie"].join(";");
    instance.defaults.headers.common.Cookie = cookies;
  }

  const token = authenticationResponse.data.key;
  instance.defaults.headers.common.Authorization = `Token ${token}`;
}

// cvatCore.config.backendAPI = backendAPI;

module.exports.cvat = {
  request: instance,
  getAuthenticationToken,
  cvatCore,
  backendAPI,
};
