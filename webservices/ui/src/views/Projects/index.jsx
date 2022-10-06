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
import { connect } from 'react-redux';

import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Container,
  Row,
  Col,
  Button,
  Badge,
} from 'reactstrap';

import Axios from '../../ApiToken';

import PropTypes from 'prop-types';

// core components
import PlainHeader from 'components/Headers/PlainHeader';
import { confirmAlert } from 'react-confirm-alert'; // Import
import { showAlert } from '../../actions';
import ProjectModal from './ProjectModal';

import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css

class Index extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      projectModal: false,
      projects: [],
    };

    this.toggleProjectModal = this.toggleProjectModal.bind(this);
    this.submitProject = this.submitProject.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.retrieveProjects = this.retrieveProjects.bind(this);
  }

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.retrieveProjects();
  }

  componentWillUnmount() {
    this.retrieveProjects();
  }

  toggleProjectModal() {
    const { projectModal } = this.state;

    this.setState({
      projectModal: !projectModal,
    });
  }

  submitProject(project) {
    const self = this;
    const { dispatch } = this.props;

    Axios.post('/api/project', {
      name: project.name,
      type: project.type,
      description: project.description,
    })
      .then(() => {
        self.toggleProjectModal();
        self.retrieveProjects();
      })
      .catch(error => {
        dispatch(showAlert('Failed to delete project', { variant: 'danger' }));
      });
  }

  deleteProject(projectId) {
    Axios.delete(`/api/project/${projectId}`).then(() => {
      this.retrieveProjects();
    });
  }

  retrieveProjects() {
    const { dispatch } = this.props;
    Axios.get('/api/project')
      .then(res => {
        this.setState({
          projects: res.data,
        });
      })
      .catch(() => {
        dispatch(showAlert('Failed to retrieve projects', { variant: 'danger' }));
      });
  }

  render() {
    const { projectModal, projects } = this.state;

    return (
      <>
        <PlainHeader />
        <Container className="mt--7" fluid>
          <Row>
            <Col lg="4" md="6">
              <button
                className=" btn-icon-clipboard"
                type="button"
                onClick={() => {
                  this.setState({
                    projectModal: !projectModal,
                  });
                }}
              >
                <div>
                  <i className=" ni ni-fat-add" />
                  <span>Add New Project</span>
                </div>
              </button>
            </Col>
          </Row>
        </Container>
        <hr className="my-4" />
        <Container fluid>
          <Row xs="4">
            <Col>
              <h2 className="display-4 text-uppercase text-black ls-1 mb-1">Project list</h2>
            </Col>
          </Row>
          <Row>
            {projects.map(project => {
              const dataset = project.datasets;
              const job = project.jobs;
              const jobNo = job.length;
              return (
                <Col xs="6" key={project.id}>
                  <Card body outline color="primary">
                    <CardHeader>
                      <div className="d-flex justify-content-between">
                        <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                          ID: {project.id}
                        </CardTitle>
                        <Button
                          close
                          style={{ color: '#f5365c' }}
                          onClick={() => {
                            confirmAlert({
                              title: 'Confirm to delete',
                              message: 'Are you sure to delete this project?',
                              buttons: [
                                {
                                  label: 'Yes',
                                  onClick: () => this.deleteProject(project.id),
                                },
                                {
                                  label: 'No',
                                },
                              ],
                            });
                          }}
                        >
                          <p style={{ color: '#f5365c' }} className="fas fa-trash-alt" />
                          <font size="1"> Delete</font>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="text-center">
                        <h3>Name: {project.name}</h3>
                        <div className="h5 mt-4">
                          <i className="ni business_briefcase-24 mr-2" />
                          Type: {project.type}
                        </div>
                        <div>
                          <i className="ni education_hat mr-2" />
                          Description: {project.description}
                        </div>
                        <hr className="my-4" />
                      </div>
                      <Row>
                        <div className="col">
                          <div className="card-profile-stats d-flex justify-content-center">
                            <div>
                              <span className="heading">
                                <Badge color="" className="badge-dot">
                                  <i className="bg-primary" />
                                  {jobNo}
                                </Badge>
                              </span>
                              <span className="description">
                                <font size="1" style={{ color: '#5e72e4' }}>
                                  {' '}
                                  Jobs Created
                                </font>
                              </span>
                            </div>
                            <div>
                              {dataset == undefined ? (
                                <span className="heading">
                                  <Button close href={`/projects/${project.id}/dataSelection`}>
                                    <p style={{ color: '#f5365c' }} className="fas fa-list" />
                                    <font size="1" style={{ color: '#f5365c' }}>
                                      {' '}
                                      Select dataset
                                    </font>
                                  </Button>
                                </span>
                              ) : (
                                <>
                                  <span className="heading">
                                    <Badge color="" className="badge-dot">
                                      <i className="bg-primary" />
                                      {dataset.name}
                                    </Badge>
                                  </span>
                                  <span className="description">
                                    <font size="1" style={{ color: '#5e72e4' }}>
                                      Dataset Selected
                                    </font>
                                  </span>
                                </>
                              )}
                            </div>
                            <div>
                              <span className="heading">
                                <Button close href={`/projects/${project.id}`}>
                                  <p style={{ color: '#212529' }} className="fas fa-edit" />
                                  <font size="1" style={{ color: '#212529' }}>
                                    {' '}
                                    Edit
                                  </font>
                                </Button>
                              </span>
                            </div>
                          </div>
                        </div>
                      </Row>
                    </CardBody>
                  </Card>
                  <hr />
                </Col>
              );
            })}
          </Row>
        </Container>
        <ProjectModal
          modal={projectModal}
          toggle={this.toggleProjectModal}
          submit={this.submitProject}
        />
      </>
    );
  }
}

function mapStateToProps() {
  return {};
}

export default connect(mapStateToProps)(Index);
