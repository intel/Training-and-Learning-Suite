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

// @flow
/**
 * Helper functions
 * @module Helpers
 */
import produce from 'immer';
import { format } from 'date-fns';

/**
 * Convert data attributes to Object
 * @param {Element} elem
 * @returns {{}}
 */
export function datasetToObject(elem: Element): Object {
  const data = {};
  [].forEach.call(elem.attributes, attr => {
    /* istanbul ignore else */
    if (/^data-/.test(attr.name)) {
      const camelCaseName = attr.name.substr(5).replace(/-(.)/g, ($0, $1) => $1.toUpperCase());
      data[camelCaseName] = attr.value;
    }
  });
  return data;
}

export function handleActions(actionsMap: Object, defaultState: Object): Function {
  return (state = defaultState, { type, ...rest }: Object = {}): Function =>
    produce(state, (draft): Object => {
      const action = actionsMap[type];
      let newState;
      if (action) {
        newState = action(draft, rest);
      }
      if (newState) {
        return newState;
      }
      return draft;
    });
}

export function keyMirror(obj: Object): Object {
  const output = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(output, key)) {
      output[key] = key;
    }
  }

  return output;
}

/**
 * Log grouped messages to the console
 * @param {string} type
 * @param {string} title
 * @param {*} data
 * @param {Object} [options]
 */
export function logger(type: string, title: string, data: any, options: Object = {}) {
  /* istanbul ignore else */
  if (process.env.NODE_ENV === 'development') {
    /* eslint-disable no-console */
    const { collapsed = true, hideTimestamp = false, typeColor = 'gray' } = options;
    const groupMethod = collapsed ? console.groupCollapsed : console.group;
    const parts = [`%c ${type}`];
    const styles = [`color: ${typeColor}; font-weight: lighter;`, 'color: inherit;'];

    if (!hideTimestamp) {
      styles.push('color: gray; font-weight: lighter;');
    }

    const time = format(new Date(), 'HH:mm:ss');

    parts.push(`%c${title}`);

    if (!hideTimestamp) {
      parts.push(`%c@ ${time}`);
    }

    /* istanbul ignore else */
    if (!window.SKIP_LOGGER) {
      groupMethod(parts.join(' '), ...styles);
      console.log(data);
      console.groupEnd();
    }
    /* eslint-enable */
  }
}

// $FlowFixMe
export const spread = produce(Object.assign);
