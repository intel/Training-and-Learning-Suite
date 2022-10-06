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
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const passport = require("passport");
const jwt = require("jsonwebtoken");

const { User } = sails.models;
let failedcount = 0;

let countdowntimer = null;
let timeleft = null;

function secsToMins(seconds) {
  var time = parseFloat(seconds).toFixed(3);

  var minutes = String(Math.floor(time / 60) % 60)
    .toString()
    .padStart(2, "0");
  var leftofseconds = Math.floor(time - minutes * 60)
    .toString()
    .padStart(2, "0");

  return minutes + ":" + leftofseconds;
}

module.exports = {
  login: function(req, res) {
    passport.authenticate("local", function(err, user, info) {
      if (
        info.message == "Username not found" ||
        info.message == "Invalid Password"
      ) {
        if (countdowntimer != null) {
          var difftime = Math.abs(
            (new Date().getTime() - countdowntimer.getTime()) / 1000
          );
          if (difftime > 300) countdowntimer = null;
          return res.send({
            message:
              "Please retry in " + secsToMins(300 - difftime) + " minutes"
          });
        }

        failedcount += 1;
        if (failedcount > 4) countdowntimer = new Date();
        return res.send({
          message: info.message
        });
      } else {
        countdowntimer = null;
        req.logIn(user, err => {
          const token = jwt.sign(
            {
              id: user.username
            },
            sails.config.jwtConfig.key,
            {
              expiresIn: "3h"
            }
          );
          res.clearCookie("sessionid", { path: "/" });
          return res.status(200).send({
            message: info.message,
            token: token,
            auth: true
          });
        });
      }
    })(req, res);
  },

  logout: function(req, res) {
    req.logout();
    res.redirect("/login");
  }
};
