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
 * Datastores
 * (sails.config.datastores)
 *
 * A set of datastore configurations which tell Sails where to fetch or save
 * data when you execute built-in model methods like `.find()` and `.create()`.
 *
 *  > This file is mainly useful for configuring your development database,
 *  > as well as any additional one-off databases used by individual models.
 *  > Ready to go live?  Head towards `config/env/production.js`.
 *
 * For more information on configuring datastores, check out:
 * https://sailsjs.com/config/datastores
 */

fs = require("fs");
mongodb_host = process.env.MONGO_HOST || "localhost";
mongodb_user_file =
  process.env.MONGO_USER_FILE ||
  "../../thirdparty/security/TLS_mongodb_username.txt";
mongodb_pwd_file =
  process.env.MONGO_PWD_FILE ||
  "../../thirdparty/security/TLS_mongodb_pass.txt";
mongodb_ca_tls =
  process.env.CA_CERT || "../../thirdparty/security/ca/ca_certificate.pem";
mongodb_key_file =
  process.env.MONGO_KEY_FILE || "../../thirdparty/security/TLS_mongodb.pem";

mongodb_user = fs
  .readFileSync(mongodb_user_file)
  .toString()
  .trim();
mongodb_pass = fs
  .readFileSync(mongodb_pwd_file)
  .toString()
  .trim();

module.exports = {
  datastores: {
  /*
    default: {
      adapter: "sails-mongo",
      url: `mongodb://${mongodb_user}:${mongodb_pass}@${mongodb_host}:27017/tls20`,
      ssl: true,
      sslCA: mongodb_ca_tls,
      sslKey: fs.readFileSync(mongodb_key_file, "utf-8"),
      sslCert: fs.readFileSync(mongodb_key_file, "utf-8")
    }
  */ 
    default: {
      adapter: "sails-mongo",
      url: `mongodb://${mongodb_user}:${mongodb_pass}@${mongodb_host}:27017/tls20`,
      sslValidate: false,
      tls: true,
      tlsCAFile: mongodb_ca_tls,
      tlsCertificateKeyFile: mongodb_key_file
    }
  }
};
