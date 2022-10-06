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

/**
 * Security Settings
 * (sails.config.security)
 *
 * These settings affect aspects of your app's security, such
 * as how it deals with cross-origin requests (CORS) and which
 * routes require a CSRF token to be included with the request.
 *
 * For an overview of how Sails handles security, see:
 * https://sailsjs.com/documentation/concepts/security
 *
 * For additional options and more information, see:
 * https://sailsjs.com/config/security
 */

module.exports.security = {
  /***************************************************************************
   *                                                                          *
   * CORS is like a more modern version of JSONP-- it allows your application *
   * to circumvent browsers' same-origin policy, so that the responses from   *
   * your Sails app hosted on one domain (e.g. example.com) can be received   *
   * in the client-side JavaScript code from a page you trust hosted on _some *
   * other_ domain (e.g. trustedsite.net).                                    *
   *                                                                          *
   * For additional options and more information, see:                        *
   * https://sailsjs.com/docs/concepts/security/cors                          *
   *                                                                          *
   ***************************************************************************/

  // cors: {
  //   allRoutes: false,
  //   allowOrigins: '*',
  //   allowCredentials: false,
  // },

  /****************************************************************************
   *                                                                           *
   * By default, Sails' built-in CSRF protection is disabled to facilitate     *
   * rapid development.  But be warned!  If your Sails app will be accessed by *
   * web browsers, you should _always_ enable CSRF protection before deploying *
   * to production.                                                            *
   *                                                                           *
   * To enable CSRF protection, set this to `true`.                            *
   *                                                                           *
   * For more information, see:                                                *
   * https://sailsjs.com/docs/concepts/security/csrf                           *
   *                                                                           *
   ****************************************************************************/

  csrf: true,

  bcrypt: {
    saltRounds: 10
  }
};
