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

// reactstrap components
import { Card, CardBody, CardTitle, Container, Row, Col } from 'reactstrap';

import Axios from '../../ApiToken';
import { connect } from 'react-redux';
import Loader from '../../components/Loader';

class Header extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      memory: null,
      disk: null,
      netinfo: null,
      cpuUsage: null,
    };

    this.retrieveInfo = this.retrieveInfo.bind(this);
    this.renderMemory = this.renderMemory.bind(this);
    this.renderNet = this.renderNet.bind(this);
    this.renderCPUsage = this.renderCPUsage.bind(this);
    this.renderDisk = this.renderDisk.bind(this);
  }

  componentDidMount() {
    this.retrieveInfo();
    const upInterval = setInterval(() => {
      this.retrieveInfo();
    }, 1000);
    this.setState({ upInterval });
  }

  componentWillUnmount() {
    const { upInterval } = this.state;
    clearInterval(upInterval);
  }

  retrieveInfo() {
    Axios.get(`/api/systeminfo/retrieve`).then(res => {
      const data = res.data;
      const memory = data['memory'];
      const disk = data['disk'];
      const netinfo = data['netinfo'];
      const cpu = data['cpu'];
      this.setState({ memory: memory });
      this.setState({ disk: disk });
      this.setState({ netinfo: netinfo });
      this.setState({ cpuUsage: cpu });
    });
  }

  renderMemory() {
    const { memory } = this.state;
    if (memory !== null) {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  Memory Usage
                </CardTitle>
                <span className="h2 font-weight-bold mb-0">{memory.sysMemUsage} GB</span>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-info text-white rounded-circle shadow">
                  <i className="fas fa-memory" />
                </div>
              </Col>
            </Row>
            <p className="mt-3 mb-0 text-muted text-sm">
              {memory.percentageMem > '50.00' ? (
                <span className="text-danger mr-2">
                  <i className="fas fa-battery-half" /> {memory.percentageMem}%
                </span>
              ) : (
                <span className="text-success mr-2">
                  <i className="fas fa-battery-full" /> {memory.percentageMem}%
                </span>
              )}
              <span className="text-nowrap">Total: {memory.sysMemSize} GB</span>
            </p>
          </CardBody>
        </Card>
      );
    } else {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  Loading Memory Usage
                </CardTitle>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-info text-white rounded-circle shadow">
                  <Loader />
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      );
    }
  }

  renderDisk() {
    const { disk } = this.state;
    if (disk !== null) {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  Disk Usage
                </CardTitle>
                <span className="h2 font-weight-bold mb-0">{disk.sysDiskUsage} GB</span>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-yellow text-white rounded-circle shadow">
                  <i className="fas fa-compact-disc" />
                </div>
              </Col>
            </Row>
            <p className="mt-3 mb-0 text-muted text-sm">
              {disk.percentageDisk > '50.00' ? (
                <span className="text-danger mr-2">
                  <i className="fas fa-battery-half" /> {disk.percentageDisk}%
                </span>
              ) : (
                <span className="text-success mr-2">
                  <i className="fas fa-battery-full" /> {disk.percentageDisk}%
                </span>
              )}
              <span className="text-nowrap">Total: {disk.sysDiskSize} GB</span>
            </p>
          </CardBody>
        </Card>
      );
    } else {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  Loading Disk Usage
                </CardTitle>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-yellow text-white rounded-circle shadow">
                  <Loader />
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      );
    }
  }

  renderNet() {
    const { netinfo } = this.state;
    if (netinfo !== null) {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  Network Bandwidth
                </CardTitle>
                <span className="h2 font-weight-bold mb-0">{netinfo} Kbps</span>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-warning text-white rounded-circle shadow">
                  <i className="fas fa-wifi" />
                </div>
              </Col>
            </Row>
            <p className="mt-3 mb-0 text-muted text-sm">
              <span className="text-danger mr-2">
                <i></i>
              </span>{' '}
              <span className="text-nowrap"> </span>
            </p>
          </CardBody>
        </Card>
      );
    } else {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  Loading Network Bandwidth
                </CardTitle>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-warning text-white rounded-circle shadow">
                  <Loader />
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      );
    }
  }

  renderCPUsage() {
    const { cpuUsage } = this.state;
    if (cpuUsage !== null) {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  CPU Usage
                </CardTitle>
                <span className="h2 font-weight-bold mb-0">{cpuUsage} %</span>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-danger text-white rounded-circle shadow">
                  <i className="fas fa-desktop" />
                </div>
              </Col>
            </Row>
            <p className="mt-3 mb-0 text-muted text-sm">
              <span className="text-success mr-2">
                <i> </i>
              </span>{' '}
              <span className="text-nowrap"> </span>
            </p>
          </CardBody>
        </Card>
      );
    } else {
      return (
        <Card className="card-stats mb-4 mb-xl-0">
          <CardBody>
            <Row>
              <div className="col">
                <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                  Loading CPU Usage
                </CardTitle>
              </div>
              <Col className="col-auto">
                <div className="icon icon-shape bg-danger text-white rounded-circle shadow">
                  <Loader />
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      );
    }
  }

  render() {
    const { project } = this.props;
    return (
      <>
        <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
          <Container fluid>
            <div className="header-body">
              {/* Card stats */}
              <Row>
                <Col lg="6" xl="3">
                  {this.renderCPUsage()}
                </Col>
                <Col lg="6" xl="3">
                  {this.renderNet()}
                </Col>
                <Col lg="6" xl="3">
                  {this.renderDisk()}
                </Col>
                <Col lg="6" xl="3">
                  {this.renderMemory()}
                </Col>
              </Row>
            </div>
          </Container>
        </div>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(Header);
