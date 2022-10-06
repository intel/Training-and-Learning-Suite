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
 * Client
 * @module Client
 */

export class ServerError extends Error {
  response: Object;

  constructor(message?: string): Error {
    super(message);

    Error.captureStackTrace(this, ServerError);

    this.name = 'ServerError';

    return this;
  }
}

export function parseError(error: string): string {
  return error || 'Something went wrong';
}

/**
 * Fetch data
 *
 * @param {string} url
 * @param {Object} options
 * @param {string} [options.method] - Request method ( GET, POST, PUT, ... ).
 * @param {string} [options.payload] - Request body.
 * @param {Object} [options.headers]
 *
 * @returns {Promise}
 */
export function request(url: string, options: Object = {}): Promise<*> {
  const config = {
    method: 'GET',
    ...options,
  };
  const errors = [];

  if (!url) {
    errors.push('url');
  }

  if (!config.payload && (config.method !== 'GET' && config.method !== 'DELETE')) {
    errors.push('payload');
  }

  if (errors.length) {
    throw new Error(`Error! You must pass \`${errors.join('`, `')}\``);
  }

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...config.headers,
  };

  const params: Object = {
    headers,
    method: config.method,
  };

  if (params.method !== 'GET') {
    params.body = JSON.stringify(config.payload);
  }

  return fetch(url, params).then(async response => {
    const contentType = response.headers.get('content-type');

    if (response.status > 299) {
      const error: Object = new ServerError(response.statusText);
      error.status = response.status;

      if (contentType && contentType.includes('application/json')) {
        error.response = await response.json();
      } else {
        error.response = await response.text();
      }

      throw error;
    } else {
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      return response.text();
    }
  });
}
