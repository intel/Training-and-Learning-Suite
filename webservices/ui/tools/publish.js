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

/*eslint-disable no-console */
const chalk = require('chalk');
const Rsync = require('rsync');

const paths = require('../config/paths');

function publish() {
  console.log(chalk.blue('Publishing...'));
  const rsync = new Rsync()
    .shell('ssh')
    .exclude('.DS_Store')
    .flags('az')
    .source(`${paths.appBuild}/`)
    .destination(
      'reactboilerplate@react-boilerplate.com:/home/reactboilerplate/public_html/redux-saga',
    );

  rsync.execute((error, code, cmd) => {
    if (error) {
      console.log(chalk.red('Something went wrong...', error, code, cmd));
      process.exit(1);
    }

    console.log(chalk.green('Published'));
  });
}

module.exports = publish;
