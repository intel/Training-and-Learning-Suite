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
import { connect } from 'react-redux';
import Header from './Header';
import { Badge, Card, CardHeader, Col, CardBody, Media, Table, Container, Row } from 'reactstrap';
import { showAlert } from '../../actions';
import Axios from '../../ApiToken';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      memory: null,
      disk: null,
      cpuInfo: null,
      graphics: null,
      os: null,
    };
    this.retrieveInfo = this.retrieveInfo.bind(this);
    this.retrieveProjects = this.retrieveProjects.bind(this);
    this.renderSysInfo = this.renderSysInfo.bind(this);
  }

  componentDidMount() {
    this.retrieveProjects();
    this.retrieveInfo();
  }

  retrieveProjects() {
    const { dispatch } = this.props;
    Axios.get('/api/project')
      .then(res => {
        this.setState({
          projects: res.data,
        });
      })
      .catch(error => {
        dispatch(showAlert('Failed to retrieve projects:'`${error}`, { variant: 'danger' }));
      });
  }

  retrieveInfo() {
    Axios.get(`/api/systeminfo/retrieve`).then(res => {
      const data = res.data;
      const memory = data['memory'];
      const disk = data['disk'];
      const cpuInfo = data['cpuModel'];
      const graphics = data['graphics'];
      const os = data['os'];
      this.setState({ memory: memory });
      this.setState({ disk: disk });
      this.setState({ cpuInfo: cpuInfo });
      this.setState({ graphics: graphics });
      this.setState({ os: os });
    });
  }

  renderSysInfo() {
    const { memory, disk, cpuInfo, graphics, os } = this.state;
    if (memory !== null && disk !== null && cpuInfo !== null && graphics !== null && os !== null) {
      return (
        <Card className="card-profile shadow">
          <CardBody>
            <Row className="justify-content-center">
              <div className="h5 mt-4">
                <i className="ni business_briefcase-24 mr-2" />
                Training and Learning Suite 2.0
              </div>
            </Row>
            <Row>
              <div className="col">
                <div className="card-profile-stats d-flex justify-content-center">
                  <div>
                    <span className="heading">{memory.sysMemSize} GB</span>
                    <span className="description">RAM</span>
                  </div>
                  <div>
                    <span className="heading">{disk.sysDiskSize} GB</span>
                    <span className="description">HDD</span>
                  </div>
                  <div>
                    <span className="heading">{cpuInfo.sysCPUCount}</span>
                    <span className="description">CORES</span>
                  </div>
                </div>
              </div>
            </Row>
            <div className="text-center">
              <div className="h5 font-weight-300">
                <i className="ni location_pin mr-2" />
                <h3>{cpuInfo.sysCPUModel}</h3>
                <span className="font-weight-light">Processor</span>
              </div>
              <div className="h5 mt-4">
                <span className="font-weight-light">Graphics: </span>
                <i className="ni business_briefcase-24 mr-2" />
                {graphics}
              </div>

              <div className="h5 mt-4">
                <span className="font-weight-light">OS: </span>
                <i className="ni business_briefcase-24 mr-2" />
                {os}
              </div>
              <hr className="my-4" />
              <p>
                Training and Learning Suite - User friendly and ease use tool for Deep Learning
                Training
              </p>
            </div>
          </CardBody>
        </Card>
      );
    }
  }

  render() {
    const { projects } = this.state;
    return (
      <>
        <Header />
        <Container className="mt--7" fluid>
          <Row>
            <Col className="order-xl-2 mb-5 mb-xl-0" xl="4">
              {this.renderSysInfo()}
            </Col>
            <Col className="order-xl-1" xl="8">
              <Card className="shadow">
                <CardHeader className="border-0">
                  <h3 className="mb-0">Project List</h3>
                </CardHeader>
                <Table className="align-items-center table-flush" responsive>
                  <thead className="thead-light">
                    <tr>
                      <th scope="col">Project</th>
                      <th scope="col">Type</th>
                      <th scope="col">Date Creation</th>
                      <th scope="col">Jobs Created</th>
                      <th scope="col">Dataset selected</th>
                    </tr>
                  </thead>
                  {projects.map(project => {
                    const signature = project.name[0];
                    const datasets = project.datasets;
                    const timeCreate = new Date(project.createdAt);
                    const jobs = project.jobs;
                    return (
                      <tbody key={project.id}>
                        <tr>
                          <th scope="row">
                            <Media className="align-items-center">
                              <a
                                className="avatar rounded-circle mr-3"
                                href={`/projects`}
                                onClick={e => e.preventDefault()}
                              >
                                <i className="text-uppercase">{signature}</i>
                              </a>
                              <Media>
                                <span className="mb-0 text-sm">{project.name}</span>
                              </Media>
                            </Media>
                          </th>
                          <td>
                            <Badge color="" className="badge-dot mr-4">
                              <i className="bg-default" />
                              {project.type}
                            </Badge>
                          </td>
                          <td>
                            <Badge color="" className="badge-dot mr-4">
                              <i className="bg-indigo" />
                              {timeCreate.toLocaleDateString()}
                            </Badge>
                          </td>
                          <td>
                            <Badge color="" className="badge-dot mr-4">
                              <i className="bg-primary" />
                              {jobs.length}
                            </Badge>
                          </td>
                          <td>
                            {datasets !== undefined ? (
                              <Badge color="" className="badge-dot mr-4">
                                <i className="bg-purple" />
                                {datasets.name}
                              </Badge>
                            ) : (
                              <Badge color="" className="badge-dot mr-4">
                                <i className="bg-danger" />
                                Please Select Dataset
                              </Badge>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    );
                  })}
                </Table>
              </Card>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(Dashboard);
