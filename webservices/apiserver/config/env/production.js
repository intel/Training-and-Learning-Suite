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
 * Production environment settings
 * (sails.config.*)
 *
 * What you see below is a quick outline of the built-in settings you need
 * to configure your Sails app for production.  The configuration in this file
 * is only used in your production environment, i.e. when you lift your app using:
 *
 * ```
 * NODE_ENV=production node app
 * ```
 *
 * > If you're using git as a version control solution for your Sails app,
 * > this file WILL BE COMMITTED to your repository by default, unless you add
 * > it to your .gitignore file.  If your repository will be publicly viewable,
 * > don't add private/sensitive data (like API secrets / db passwords) to this file!
 *
 * For more best practices and tips, see:
 * https://sailsjs.com/docs/concepts/deployment
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

try {
  tls_ca = fs.readFileSync("/run/secrets/ca_tls")
  tls_server_cert = fs.readFileSync("/run/secrets/tlsserver_cert")
  tls_server_key = fs.readFileSync("/run/secrets/tlsserver_key")
} catch (err) {
  tls_ca = fs.readFileSync("../../thirdparty/security/ca/ca_certificate.pem");
  tls_server_cert = fs.readFileSync("../../thirdparty/security/TLS_server_cert.crt");
  tls_server_key = fs.readFileSync("../../thirdparty/security/TLS_server_key.pem");
}


module.exports = {
  datastores: {
    default: {
      adapter: "sails-mongo",
      url: `mongodb://${mongodb_user}:${mongodb_pass}@${mongodb_host}:27017/tls20`,
      sslValidate: false,
      tls: true,
      tlsCAFile: mongodb_ca_tls,
      tlsCertificateKeyFile: mongodb_key_file
    }
  },

  models: {
    migrate: "safe"
  },

  blueprints: {
    shortcuts: false
  },

  security: {
    cors: {}
  },

  session: {
    cookie: {
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },

  sockets: {},

  log: {
    level: "debug"
  },

  http: {
    cache: 365.25 * 24 * 60 * 60 * 1000
  },

  custom: {
    baseUrl: "https://example.com",
    internalEmailAddress: "support@example.com"
  },

  ssl: {
    ca: tls_ca,
    key: tls_server_key,
    cert: tls_server_cert
  }
};
