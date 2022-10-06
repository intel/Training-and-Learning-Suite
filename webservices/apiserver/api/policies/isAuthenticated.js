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

// module.exports = async function(req, res, next) {
//   sails.helpers.jwt.verify.with({ req: req, res: res }).switch({
//     error: err => {
//       return res.serverError(err);
//     },
//     invalid: err => {
// if (req.wantsJSON) {
//   return res.sendStatus(401);
// }
//       return res.redirect("/login");
//     },
//     success: function() {
//       return next();
//     }
//   });
// };

var passport = require("passport");

module.exports = function(req, res, next) {
  passport.authenticate("jwt", function(error, user, info) {
    if (error) return res.serverError(error);

    if (req.wantsJSON && user == false) {
      return res.sendStatus(401);
    }

    if (!user) return res.redirect("/login");
    req.user = user;

    next();
  })(req, res);
};
