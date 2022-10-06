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

import React from 'react';
import Loader from 'components/Loader';
import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import { connect } from 'react-redux';

export default function WithIO(WrappedComponent) {
  class ComponentWithIO extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        io: null,
      };

      this.createIO = this.createIO.bind(this);
    }

    componentDidMount() {
      this.createIO();
    }

    createIO() {
      const token = localStorage.getItem('jwttoken');
      const csrftoken = localStorage.getItem('csrf');

      let newIo = null;
      if (socketIOClient.sails) {
        newIo = socketIOClient;
      } else {
        newIo = sailsIOClient(socketIOClient);
      }

      const headers = {};
      if (token) {
        headers.Authorization = `JWT ${token}`;
      }

      if (csrftoken) {
        headers['x-csrf-token'] = csrftoken;
      }

      newIo.sails.useCORSRouteToGetCookie = false;
      newIo.sails.headers = headers;
      newIo.sails.initialConnectionHeaders = headers;

      this.setState({ io: newIo });
    }

    render() {
      const { io } = this.state;
      if (!io) {
        return <Loader block />;
      }
      return <WrappedComponent io={io} {...this.props} />;
    }
  }

  function mapStateToProps() {
    return {};
  }

  return connect(mapStateToProps)(ComponentWithIO);
}
