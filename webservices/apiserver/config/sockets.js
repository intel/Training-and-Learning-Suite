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
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * Use the settings below to configure realtime functionality in your app.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For all available options, see:
 * https://sailsjs.com/config/sockets
 */

module.exports.sockets = {
  /** *************************************************************************
   *                                                                          *
   * `transports`                                                             *
   *                                                                          *
   * The protocols or "transports" that socket clients are permitted to       *
   * use when connecting and communicating with this Sails application.       *
   *                                                                          *
   * > Never change this here without also configuring `io.sails.transports`  *
   * > in your client-side code.  If the client and the server are not using  *
   * > the same array of transports, sockets will not work properly.          *
   * >                                                                        *
   * > For more info, see:                                                    *
   * > https://sailsjs.com/docs/reference/web-sockets/socket-client           *
   *                                                                          *
   ************************************************************************** */
  // transports: [ 'websocket' ],
  /** *************************************************************************
   *                                                                          *
   * `beforeConnect`                                                          *
   *                                                                          *
   * This custom beforeConnect function will be run each time BEFORE a new    *
   * socket is allowed to connect, when the initial socket.io handshake is    *
   * performed with the server.                                               *
   *                                                                          *
   * https://sailsjs.com/config/sockets#?beforeconnect                        *
   *                                                                          *
   ************************************************************************** */
   beforeConnect: function(handshake, proceed) {
  
     // `true` allows the socket to connect.
     // (`false` would reject the connection)
     return proceed(undefined, true);
  
   },
  /** *************************************************************************
   *                                                                          *
   * `afterDisconnect`                                                        *
   *                                                                          *
   * This custom afterDisconnect function will be run each time a socket      *
   * disconnects                                                              *
   *                                                                          *
   ************************************************************************** */
  // afterDisconnect: function(session, socket, done) {
  //
  //   // By default: do nothing.
  //   // (but always trigger the callback)
  //   return done();
  //
  // },
  /** *************************************************************************
   *                                                                          *
   * Whether to expose a 'GET /__getcookie' route that sets an HTTP-only      *
   * session cookie.                                                          *
   *                                                                          *
   ************************************************************************** */
  // grant3rdPartyCookie: true,
};
