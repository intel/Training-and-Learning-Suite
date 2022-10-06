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

import { all, call, select, put, takeLatest } from 'redux-saga/effects';

import { ActionTypes } from 'constants/index';

export function* retrieveDataset({ payload }) {
  try {
    const datasetId = yield select(state => state.dataset.id);

    // don't retrieve again if the dataset id is the same
    if (datasetId === payload.datasetId) {
      yield put({
        type: ActionTypes.DATASET_RETRIEVE_SUCCESS,
        payload: {
          id: payload.datasetId,
        },
      });
      return;
    }

    const response = yield call(payload.client.get, `/api/dataset/${payload.datasetId}`);

    yield put({
      type: ActionTypes.DATASET_RETRIEVE_SUCCESS,
      payload: {
        files: response.data.files,
        labels: response.data.labels,
        id: payload.datasetId,
      },
    });
  } catch (err) {
    yield put({
      type: ActionTypes.DATASET_RETRIEVE_FAILED,
      payload: err,
    });
  }
}

export default function* root() {
  yield all([takeLatest(ActionTypes.DATASET_RETRIEVE, retrieveDataset)]);
}
