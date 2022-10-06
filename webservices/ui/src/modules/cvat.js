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

// import _cvat from 'cvat-core.js/src/api';

// const cvat = _cvat;

// // const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
// // const host = 'localhost';
// // const port = process.env.NODE_ENV === 'development' ? '3000' : '443';

// // cvat.config.backendAPI = `${protocol}://${host}:${port}/api/v1`;
// cvat.config.backendAPI = '/cvatapi/api';
// // cvat.config.backendAPI = 'http://localhost:8080/api/v1';

// export default function getCvat() {
//   return cvat;
// }

const url = require("url");
const store = require('store');

let backendAPI = process.env.CVAT_URL || "/api/v1";

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

export async function getAuthenticationToken() {
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
  store.set('token', token);
  instance.defaults.headers.common.Authorization = `Token ${token}`;
}

export default function getCvat() {
  return instance;
}
