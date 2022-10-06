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

const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy,
  JwtStrategy = require("passport-jwt").Strategy,
  ExtractJWT = require("passport-jwt").ExtractJwt;
const sails = require("sails");
const { jwtConfig } = require("./jwtConfig");
const pbkdf2 = require("pbkdf2-sha256");
const fs = require("fs");
const bcrypt = require("bcrypt");

tls_user_file =
  process.env.TLS_USER_FILE ||
  "../../thirdparty/security/TLS_apiui_username.txt";
tls_pwd_file =
  process.env.TLS_PWD_FILE || "../../thirdparty/security/TLS_apiui_pass.txt";

mqtt_user_file = process.env.MQTT_USER_FILE ||
  "../../thirdparty/security/TLS_mqtt_username.txt";
mqtt_pass_file = process.env.MQTT_PWD_FILE ||
  "../../thirdparty/security/TLS_mqtt_pass.txt";
tls_user = fs.readFileSync(tls_user_file).toString().trim();
tls_pass = fs.readFileSync(tls_pwd_file).toString().trim();

mqtt_user = fs.readFileSync(mqtt_user_file).toString().trim();
mqtt_pass = fs.readFileSync(mqtt_pass_file).toString().trim();

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  User.findOne({ id }, function (err, users) {
    cb(err, users);
  });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    function (username, password, cb) {
      const hash = pbkdf2(password, password, 10000, 32).toString("base64");
      try {
        if (username === mqtt_user) {
          if (password === mqtt_pass) {
            let userDetails = {
              username: username,
              password: password,
            };

            return cb(null, userDetails, { message: "Login Succesful" });
          } else {
            return cb(null, false, { message: "Invalid Password" });
          }
        } else if (username === tls_user) {
          if (hash === tls_pass) {
            let userDetails = {
              username: username,
              password: password,
            };

            return cb(null, userDetails, { message: "Login Succesful" });
          } else {
            return cb(null, false, { message: "Invalid Password" });
          }
        } else if (username !== mqtt_user || username !== tls_user) {
          return cb(null, false, { message: "Username not found" });
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

const opts = {
  jwtFromRequest: ExtractJWT.fromExtractors([
    ExtractJWT.fromUrlQueryParameter("au"),
    ExtractJWT.fromAuthHeaderWithScheme("JWT"),
  ]),
  secretOrKey: jwtConfig.key,
};

passport.use(
  "jwt",
  new JwtStrategy(opts, (payload, cb) => {
    try {
      if (payload.id == tls_user) cb(null, true);
      else if (payload.id == mqtt_user) cb(null, true);
      else cb(null, false);
    } catch (err) {
      cb(err, false);
    }
  })
);
