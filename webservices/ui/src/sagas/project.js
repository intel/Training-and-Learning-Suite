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

import { all, call, put, take, takeLatest, fork, cancel } from 'redux-saga/effects';

// import { eventChannel } from 'redux-saga';
import { eventChannel } from 'redux-saga';

import { ActionTypes } from 'constants/index';
import {
  projectSubscribeAddedto,
  projectUnsubscribe,
  projectSubscribeRemovedfrom,
  projectSubscribeUpdated,
} from '../actions';

function connect(io, projectId) {
  return new Promise((res, rej) => {
    io.socket.get(`/api/project/${projectId}`, (msg, jwres) => {
      if (jwres.error) {
        return rej(jwres.error);
      }
      return res(msg);
    });
  });
}

function subscribe(socket) {
  return eventChannel(emit => {
    socket.on('project', msg => {
      switch (msg.verb) {
        case 'addedTo': {
          emit(projectSubscribeAddedto(msg.attribute, msg.addedId));

          break;
        }
        case 'removedFrom': {
          emit(projectSubscribeRemovedfrom(msg.attribute, msg.removedId));
          break;
        }
        case 'updated': {
          emit(projectSubscribeUpdated(msg.id, msg.data));
          break;
        }
        default: {
          break;
        }
      }
    });

    return () => {};
  });
}

function* read(socket) {
  const channel = yield call(subscribe, socket);
  while (true) {
    const action = yield take(channel);
    yield put(action);
  }
}

function* handleIO(socket) {
  yield fork(read, socket);
}

export function* subscribeProject(props) {
  try {
    const { io, projectId } = props.payload;

    const project = yield call(connect, io, projectId);

    yield put({
      type: ActionTypes.PROJECT_SUBSCRIBE_SUCCESS,
      payload: {
        ...project,
      },
    });

    const task = yield fork(handleIO, io.socket);

    yield take(`${projectUnsubscribe}`);

    yield cancel(task);
  } catch (err) {
    yield put({
      type: ActionTypes.PROJECT_SUBSCRIBE_FAILURE,
      payload: {
        err,
      },
    });
  }
}

export default function* root() {
  yield all([takeLatest(ActionTypes.PROJECT_SUBSCRIBE, subscribeProject)]);
}
