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
 * `tasks/register/polyfill.js`
 *
 * ---------------------------------------------------------------
 *
 * For more information see:
 *   https://sailsjs.com/anatomy/tasks/register/polyfill.js
 *
 */
module.exports = function(grunt) {
  grunt.registerTask('polyfill:prod', 'Add the polyfill file to the top of the list of files to concatenate', ()=>{
    grunt.config.set('concat.js.src', [require('sails-hook-grunt/accessible/babel-polyfill')].concat(grunt.config.get('concat.js.src')));
  });
  grunt.registerTask('polyfill:dev', 'Add the polyfill file to the top of the list of files to copy and link', ()=>{
    grunt.config.set('copy.dev.files', grunt.config.get('copy.dev.files').concat({
      expand: true,
      cwd: require('path').dirname(require('sails-hook-grunt/accessible/babel-polyfill')),
      src: require('path').basename(require('sails-hook-grunt/accessible/babel-polyfill')),
      dest: '.tmp/public/polyfill'
    }));
    var devLinkFiles = grunt.config.get('sails-linker.devJs.files');
    grunt.config.set('sails-linker.devJs.files', Object.keys(devLinkFiles).reduce((linkerConfigSoFar, glob)=>{
      linkerConfigSoFar[glob] = ['.tmp/public/polyfill/polyfill.min.js'].concat(devLinkFiles[glob]);
      return linkerConfigSoFar;
    }, {}));
  });
};

