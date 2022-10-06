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
 * `tasks/config/hash`
 *
 * ---------------------------------------------------------------
 *
 * Implement cache-busting for minified CSS and JavaScript files.
 *
 * For more information, see:
 *   https://sailsjs.com/anatomy/tasks/config/hash.js
 *
 */
module.exports = function(grunt) {

  grunt.config.set('hash', {
    options: {
      mapping: '',
      srcBasePath: '',
      destBasePath: '',
      flatten: false,
      hashLength: 8,
      hashFunction: function(source, encoding){
        if (!source || !encoding) {
          throw new Error('Consistency violation: Cannot compute unique hash for production .css/.js cache-busting suffix, because `source` and/or `encoding` are falsey-- but they should be truthy strings!  Here they are, respectively:\nsource: '+require('util').inspect(source, {depth:null})+'\nencoding: '+require('util').inspect(encoding, {depth:null}));
        }
        return require('crypto').createHash('sha1').update(source, encoding).digest('hex');
      }
    },
    js: {
      src: '.tmp/public/min/*.js',
      dest: '.tmp/public/hash/'
    },
    css: {
      src: '.tmp/public/min/*.css',
      dest: '.tmp/public/hash/'
    }
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // This Grunt plugin is part of the default asset pipeline in Sails,
  // so it's already been automatically loaded for you at this point.
  //
  // Of course, you can always remove this Grunt plugin altogether by
  // deleting this file.  But check this out: you can also use your
  // _own_ custom version of this Grunt plugin.
  //
  // Here's how:
  //
  // 1. Install it as a local dependency of your Sails app:
  //    ```
  //    $ npm install grunt-hash --save-dev --save-exact
  //    ```
  //
  //
  // 2. Then uncomment the following code:
  //
  // ```
  // // Load Grunt plugin from the node_modules/ folder.
  // grunt.loadNpmTasks('grunt-hash');
  // ```
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

};
