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
 * `tasks/register/buildProd.js`
 *
 * ---------------------------------------------------------------
 *
 * This Grunt tasklist will be executed instead of `build` if you
 * run `sails www` in a production environment, e.g.:
 * `NODE_ENV=production sails www`
 *
 * For more information see:
 *   https://sailsjs.com/anatomy/tasks/register/build-prod.js
 *
 */
module.exports = function(grunt) {
  grunt.registerTask('buildProd', [
    'polyfill:prod', //« Remove this to skip transpilation in production (not recommended)
    'compileAssets',
    'babel',         //« Remove this to skip transpilation in production (not recommended)
    'concat',
    'uglify',
    'cssmin',
    'hash',//« Cache-busting
    'copy:beforeLinkBuildProd',//« For prettier URLs after cache-busting
    'linkAssetsBuildProd',
    'clean:build',
    'copy:build',
    'clean:afterBuildProd'
  ]);
};

