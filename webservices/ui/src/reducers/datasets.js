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

import { ActionTypes, STATUS } from 'constants/index';
import { handleActions } from '../modules/helpers';

export const datasetsState = {
  status: STATUS.IDLE,
  list: [],
};

export default {
  datasets: handleActions(
    {
      [ActionTypes.DATASETS_SUBSCRIBE]: draft => {
        draft.status = STATUS.RUNNING;
      },
      [ActionTypes.DATASETS_SUBSCRIBE_SUCCESS]: (draft, { payload }) => {
        draft.status = STATUS.SUCCESS;

        draft.list = payload;
      },

      [ActionTypes.DATASETS_SUBSCRIBE_ADDEDTO]: (draft, { payload }) => {
        const entryPtr = draft.list.find(dataset => dataset.id === payload.id);

        if (!entryPtr) {
          return;
        }
        const entryIndex = draft.list.indexOf(entryPtr);

        const attributePtr = entryPtr[payload.attribute];
        if (attributePtr) {
          const index = attributePtr.findIndex(attribute => attribute.id === payload.addedId);

          if (index === -1) {
            entryPtr[payload.attribute].push(payload.instanceData);
          }
        }
        draft.list[entryIndex] = entryPtr;
      },
      [ActionTypes.DATASETS_SUBSCRIBE_REMOVEDFROM]: (draft, { payload }) => {
        const entryPtr = draft.list.find(dataset => dataset.id === payload.id);

        if (!entryPtr) {
          return;
        }
        const entryIndex = draft.list.indexOf(entryPtr);
        const attributePtr = entryPtr[payload.attribute];
        if (attributePtr) {
          const index = attributePtr.findIndex(attribute => attribute.id === payload.removedId);

          if (index !== -1) {
            entryPtr[payload.attribute].splice(index, 1);
          }
        }
        draft.list[entryIndex] = entryPtr;
      },
      [ActionTypes.DATASETS_UNSUBSCRIBE]: draft => {
        draft.status = STATUS.IDLE;
      },

      [ActionTypes.DATASETS_SUBSCRIBE_FAILURE]: (draft, { payload }) => {
        draft.status = STATUS.FAILURE;
        draft.err = payload.err;
      },
    },
    datasetsState,
  ),
};
