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

import {
  ActionTypes,
  STATUS
} from 'constants/index';
import {
  handleActions
} from '../modules/helpers';

export const projectState = {
  status: STATUS.IDLE,
  id: null,
  name: null,
  err: null,
  datasets: null,
  labels: [],
  type: null,
  datasetSplit: null,
  datasetAugmentation: null,
  jobs: null,
  agents: null
};

export default {
  project: handleActions({
    [ActionTypes.PROJECT_SUBSCRIBE]: draft => {
      draft.status = STATUS.RUNNING;
    },
    [ActionTypes.PROJECT_SUBSCRIBE_SUCCESS]: (draft, {
      payload
    }) => {
      draft.status = STATUS.SUCCESS;
      draft.id = payload.id;
      draft.name = payload.name;
      draft.datasets = payload.datasets || {};
      draft.labels = payload.labels;
      draft.type = payload.type;
      draft.datasetSplit = payload.datasetSplit || {};
      draft.datasetAugmentation = payload.datasetAugmentation || {};
      draft.jobs = payload.jobs || {};
      draft.agents = payload.agents || {};
    },
    [ActionTypes.PROJECT_SUBSCRIBE_ADDEDTO]: (draft, {
      payload
    }) => {
      const attributePtr = draft[payload.attribute];
      if (attributePtr) {
        const index = attributePtr.indexOf(payload.addedId);

        if (index === -1) {
          draft[payload.attribute].push(payload.addedId);
        }
      }
    },
    [ActionTypes.PROJECT_SUBSCRIBE_REMOVEDFROM]: (draft, {
      payload
    }) => {
      const attributePtr = draft[payload.attribute];
      if (attributePtr) {
        const index = attributePtr.indexOf(payload.removedId);
        if (index !== -1) {
          draft[payload.attribute].splice(index, 1);
        }
      }
    },

    [ActionTypes.PROJECT_SUBSCRIBE_UPDATED]: (draft, {
      payload
    }) => {
      if (payload.projectId === draft.id) {
        Object.keys(payload.data).map(key => {
          draft[key] = payload.data[key];
        });
      }
    },

    [ActionTypes.PROJECT_UNSUBSCRIBE]: draft => {
      draft.status = STATUS.IDLE;
    },
    [ActionTypes.PROJECT_SUBSCRIBE_FAILURE]: (draft, {
      payload
    }) => {
      draft.status = STATUS.FAILURE;
      draft.err = payload.err;
    },
  },
    projectState,
  ),
};
