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

import { hot } from 'react-hot-loader/root';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Router, Switch, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ThemeProvider } from 'styled-components';
import treeChanges from 'tree-changes';

import history from 'modules/history';
import theme from 'modules/theme';
import config from 'config';
import { showAlert } from 'actions';
import SystemAlerts from 'components/SystemAlerts';
import RoutePrivate from './components/RoutePrivate';
import AdminLayout from './layouts/Admin';
import Login from './login';
import axios from 'axios';

export class App extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { user: { isAuthenticated: false } };
  }

  componentDidMount() {
    axios.get(`/api/csrfToken`).then(res => {
      const token = res.data._csrf;
      localStorage.setItem('csrf', token);
    });
  }

  componentDidUpdate(prevProps) {
    const { dispatch } = this.props;
    const { changedTo } = treeChanges(prevProps, this.props);

    if (changedTo('user.isAuthenticated', true)) {
      this.setState({ user: this.props.user });
      dispatch(showAlert('Hello! And welcome!', { variant: 'success', icon: 'bell' }));
      history.push('/dashboard');
    }
  }

  render() {
    const { user } = this.props;

    return (
      <Router history={history}>
        <ThemeProvider theme={theme}>
          <Helmet
            defer={false}
            htmlAttributes={{ lang: 'en-us' }}
            encodeSpecialCharacters={true}
            defaultTitle={config.name}
            titleTemplate={`%s | ${config.name}`}
            titleAttributes={{ itemprop: 'name', lang: 'en-us' }}
          />

          <Switch>
            <Route path="/login" exact component={Login} />
            <RoutePrivate isAuthenticated={user.isAuthenticated} path="/" component={AdminLayout} />
          </Switch>

          <SystemAlerts />
        </ThemeProvider>
      </Router>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user,
  };
}

export default hot(connect(mapStateToProps)(App));
