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

/* !

=========================================================
* Argon Dashboard React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
// reactstrap components
import { Container } from 'reactstrap';
// core components
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import treeChanges from 'tree-changes';
import Axios from '../ApiToken';
import { getCore, getAuthenticationToken } from '../modules/cvat';
import AdminNavbar from '../components/Navbars/AdminNavbar';
import AdminFooter from '../components/Footers/AdminFooter';
import Sidebar from '../components/Sidebar/Sidebar';

import routes from '../routes';
import { showAlert, datasetsSubscribe } from '../actions';
import WithIO from '../components/WithIO';
import { STATUS } from '../constants';
import Loader from '../components/Loader';

// const cvat = getCore();

class Admin extends React.Component {
  constructor(props) {
    super(props);
    this.mainContentRef = React.createRef();
    this.getBrandText = this.getBrandText.bind(this);
  }

  static propTypes = {
    datasetsErr: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
  };

  async componentDidMount() {
    const { dispatch, io } = this.props;
    try {
      // await cvat.server.login('admin', 'adminn');
      getAuthenticationToken();
    } catch (exception) {
      dispatch(showAlert('Failed to connect to annotation server', { variant: 'danger' }));
    }
    dispatch(datasetsSubscribe(io, Axios));
  }

  componentDidUpdate(prevProps) {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    if (this.mainContentRef.current) {
      this.mainContentRef.current.scrollTop = 0;
    }
  }

  getRoutes = (routeArray, io) =>
    routeArray.map((prop, key) => {
      if (prop.layout === '/admin') {
        const RouteComponent = prop.component;
        return (
          <Route
            path={prop.path}
            render={props => <RouteComponent {...props} io={io} />}
            key={key}
          />
        );
      }
      return null;
    });

  getBrandText = () => {
    const { location } = this.props;
    for (let i = 0; i < routes.length; i++) {
      if (location.pathname.indexOf(routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return 'Brand';
  };

  render() {
    const { io, datasetStatus } = this.props;

    // if (datasetStatus !== STATUS.SUCCESS) {
    //   return <Loader block />;
    // }

    return (
      <>
        <Sidebar
          {...this.props}
          routes={routes}
          logo={{
            innerLink: '/admin/index',
            imgSrc: require('../assets/img/brand/argon-react.png'),
            imgAlt: '...',
          }}
        />
        <div className="main-content" ref={this.mainContentRef}>
          <AdminNavbar {...this.props} brandText={this.getBrandText()} />
          <Switch>
            {this.getRoutes(routes, io)}
            <Redirect from="/" to="/dashboard" />
          </Switch>
          <Container fluid>
            <AdminFooter />
          </Container>
        </div>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    datasetsErr: state.datasets.err,
    // datasetStatus: state.datasets.status ? state.datasets.status : STATUS.SUCCESS,
  };
}

export default connect(mapStateToProps)(WithIO(Admin));
