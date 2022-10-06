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
  all,
  call,
  put,
  take,
  takeLatest,
  fork,
  cancel
} from 'redux-saga/effects';
import {
  eventChannel
} from 'redux-saga';

import {
  ActionTypes
} from 'constants/index';
import {
  datasetsSubscribeAddedto,
  datasetsUnsubscribe,
  datasetsSubscribeRemovedfrom,
} from '../actions';

function connect(io) {
  return new Promise((res, rej) => {
    io.socket.get('/api/dataset', (msg, jwres) => {
      if (jwres.error) {
        return rej(jwres.error);
      }
      return res(msg);

    });
  });
}

function subscribe(socket, axios) {
  function stoperror() {
    return true;
  }
  return eventChannel(emit => {
    socket.on('dataset', msg => {
      switch (msg.verb) {
        case 'addedTo': {
          try {
            axios.get(`/api/dataset/${msg.id}/${msg.attribute}`).then(res => {
              emit(
                datasetsSubscribeAddedto(
                  msg.attribute,
                  msg.id,
                  msg.addedId,
                  res.data.find(data => data.id === msg.addedId),
                ),
              );
            })
          } catch (error) {
            window.onerror = stoperror;

          }


          break;
        }
        case 'removedFrom': {
          emit(datasetsSubscribeRemovedfrom(msg.attribute, msg.id, msg.removedId));
          break;
        }
        default: {
          break;
        }
      }
    });

    return () => { };
  });
}

function* read(socket, axios) {
  const channel = yield call(subscribe, socket, axios);
  while (true) {
    const action = yield take(channel);
    yield put(action);
  }
}

function* handleIO(socket, axios) {
  yield fork(read, socket, axios);
}

export function* subscribeDatasets(props) {
  try {
    const {
      io,
      axios
    } = props.payload;

    const datasets = yield call(connect, io);

    yield put({
      type: ActionTypes.DATASETS_SUBSCRIBE_SUCCESS,
      payload: datasets,
    });

    const task = yield fork(handleIO, io.socket, axios);

    yield take(`${datasetsUnsubscribe}`);

    yield cancel(task);
  } catch (err) {
    yield put({
      type: ActionTypes.DATASETS_SUBSCRIBE_FAILURE,
      payload: {
        err
      },
    });
  }
}

export default function* root() {
  yield all([takeLatest(ActionTypes.DATASETS_SUBSCRIBE, subscribeDatasets)]);
}
