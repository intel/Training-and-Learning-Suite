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

import { keyMirror } from 'modules/helpers';

/**
 * @namespace Constants
 * @desc App constants
 */

/**
 * @constant {Object} ActionTypes
 * @memberof Constants
 */
export const ActionTypes = keyMirror({
  SWITCH_MENU: undefined,
  EXCEPTION: undefined,
  USER_LOGIN: undefined,
  USER_LOGIN_SUCCESS: undefined,
  USER_LOGIN_FAILURE: undefined,
  USER_LOGOUT: undefined,
  USER_LOGOUT_SUCCESS: undefined,
  USER_LOGOUT_FAILURE: undefined,
  GITHUB_GET_REPOS: undefined,
  GITHUB_GET_REPOS_SUCCESS: undefined,
  GITHUB_GET_REPOS_FAILURE: undefined,
  SHOW_ALERT: undefined,
  HIDE_ALERT: undefined,

  DATASET_RETRIEVE: undefined,
  DATASET_RETRIEVE_SUCCESS: undefined,
  DATASET_RETRIEVE_FAILED: undefined,

  PROJECT_SUBSCRIBE: undefined,
  PROJECT_UNSUBSCRIBE: undefined,
  PROJECT_SUBSCRIBE_SUCCESS: undefined,
  PROJECT_SUBSCRIBE_FAILURE: undefined,
  PROJECT_SUBSCRIBE_ADDEDTO: undefined,
  PROJECT_SUBSCRIBE_REMOVEDFROM: undefined,
  PROJECT_SUBSCRIBE_UPDATED: undefined,

  DATASETS_SUBSCRIBE: undefined,
  DATASETS_UNSUBSCRIBE: undefined,

  DATASETS_SUBSCRIBE_SUCCESS: undefined,
  DATASETS_SUBSCRIBE_FAILURE: undefined,
  DATASETS_SUBSCRIBE_ADDEDTO: undefined,
  DATASETS_SUBSCRIBE_REMOVEDFROM: undefined,
});

/**
 * @constant {Object} STATUS
 * @memberof Constants
 */
export const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  READY: 'ready',
  SUCCESS: 'success',
  ERROR: 'error',
};
