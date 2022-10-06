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

module.exports = {
  friendlyName: "CVATRequest",

  description: "Send CVAT request",

  inputs: {
    url: {
      friendlyName: "url",
      type: "string"
    },

    data: {
      friendlyName: "data to be sent",
      type: "ref"
    }
  },

  exits: {
    success: {
      description: "All done."
    }
  },

  async fn(inputs, exits) {
    const { cvat } = sails.config;

    try {
      const response = await cvat.request({
        url: inputs.url,
        ...inputs.data
      });

      return exits.success(response.data);
    } catch (err) {
      if (err.response) {
        const message = `${err.message}. ${JSON.stringify(err.response.data) ||
          ""}.`;
        throw new ServerError(message, err.response.status);
      }

      // Server is unavailable (no any response)
      const message = `${err.message}.`; // usually is "Error Network"
      throw new ServerError(message, 0);
    }
  }
};
