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
import PropTypes from 'prop-types';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Col,
  Row,
  ModalBody,
  Modal,
  ModalHeader,
  ModalFooter,
} from 'reactstrap';

import Loader from '../../components/Loader';
import { STATUS } from '../../constants';
import ConfigurePage from './configure/ConfigurePage';
import { Progress } from 'react-sweet-progress';
import 'react-sweet-progress/lib/style.css';
import Axios from '../../ApiToken';
import { showAlert } from '../../actions';
import { confirmAlert } from 'react-confirm-alert';
import DownloadModal from './DownloadModal';
class ProjectJob extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      configureModal: false,
      downloadTrainedModelModal: false,
      selectedModel: 'model',
      mode: 'create',
      jobId: null,
      jobName: '',
      jobModel: '',
      percentage: 0,
      displayBar: false,
      runningjob: {},
      jobs: [],
    };
    this.deleteJob = this.deleteJob.bind(this);
    this.triggerJobTraining = this.triggerJobTraining.bind(this);
    this.stopJobTraining = this.stopJobTraining.bind(this);
    this.retrieveJobs = this.retrieveJobs.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.toggleDownloadModal = this.toggleDownloadModal.bind(this);
    this.retrieveStatus = this.retrieveStatus.bind(this);
    this.renderPlayButton = this.renderPlayButton.bind(this);
    this.renderProjectCard = this.renderProjectCard.bind(this);
  }

  static propTypes = {
    project: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.retrieveJobs();
    const upInterval = setInterval(() => {
      this.retrieveJobs();
    }, 1000);
    this.setState({ upInterval });
  }

  componentWillUnmount() {
    const { upInterval } = this.state;
    clearInterval(upInterval);
  }

  deleteJob(jobId) {
    const { dispatch } = this.props;
    Axios.delete(`/api/job/`, { data: { id: `${jobId}` } }).catch(err => {
      dispatch(showAlert(`Failed to delete the job:${err}`, { variant: 'danger' }));
    });
  }

  triggerJobTraining(jobId) {
    const { dispatch } = this.props;
    Axios.post(`/api/job/${jobId}/training/op`, { op: 'TRAINING' }).catch(err => {
      dispatch(showAlert(`Failed to start/stop:${err}`, { variant: 'danger' }));
    });
  }

  stopJobTraining(jobId) {
    const { dispatch } = this.props;
    Axios.post(`/api/job/${jobId}/training/op`, {
      op: 'STOP',
    }).catch(err => {
      dispatch(showAlert(`Failed to start/stop:${err}`, { variant: 'danger' }));
    });
  }

  retrieveJobs() {
    const { dispatch, project } = this.props;
    Axios.get(`/api/job?status=PROGRESS`).then(res => {
      const jobs = res.data;

      let runningjob = '';
      if (jobs.length > 0) runningjob = true;
      this.setState({ runningjob: runningjob });
    });

    Axios.get(`/api/project/${project.id}`)
      .then(res => {
        const jobs = res.data.jobs;
        this.setState({ jobs: jobs });
      })
      .catch(err => {
        dispatch(showAlert(`Failed to retrieve jobs ${err}`, { variant: 'danger' }));
      });
  }

  toggleModal(mode, id) {
    const { configureModal } = this.state;
    this.setState({
      configureModal: !configureModal,
    });

    if (mode === 'edit' && id !== undefined) {
      this.setState({ mode: mode });
      this.setState({ jobId: id });
    } else {
      this.setState({ mode: null });
    }
  }

  toggleDownloadModal(job) {
    const { downloadTrainedModelModal } = this.state;
    this.setState({
      downloadTrainedModelModal: !downloadTrainedModelModal,
    });
    console.log(job);
    this.setState({
      jobId: job.id,
      jobName: job.jobName,
      jobModel: job.jobModel,
    });
  }

  retrieveStatus(job) {
    status = job.jobStatus.status;
    if (status == 'SUCCESS' || status == 'COMPLETE') {
      return (
        <>
          <i className="text-uppercase text-success ls-1 mb-1">SUCCESS</i>
          <div className="text-center text-muted mb-4">
            <small>Training is completed successfully</small>
          </div>
        </>
      );
    } else if (status == 'READY') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">{status}</i>
          <div className="text-center text-muted mb-4">
            <small>Getting ready for Training</small>
          </div>
        </>
      );
    } else if (status == 'PENDING' || status == 'PROCESS') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">{status}</i>
          <div className="text-center text-muted mb-4">
            <small>Getting ready for Training</small>
          </div>
        </>
      );
    } else if (status == 'STOP' || status == 'REVOKED' || status == 'UNDEFINED') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">{status}</i>
          <div className="text-center text-muted mb-4">
            <small>Job has been stopped. Click Play to restart</small>
          </div>
        </>
      );
    } else if (status == 'RUNNING') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">{status}</i>
          <div className="text-center text-muted mb-4">
            <small>Getting task to run</small>
          </div>
        </>
      );
    } else if (status == 'MODELCONVERSION') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">IR CONVERSION</i>
          <div className="text-center text-muted mb-4">
            <small>converting to openvino model</small>
          </div>
        </>
      );
    } else if (status == 'DOWNLOADMODEL') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">DOWNLOADING PRETRAINED MODEL</i>
          <div className="text-center text-muted mb-4">
            <small>Getting keras model</small>
          </div>
        </>
      );
    } else if (status == 'PREPAREDATASET') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">PREPARING DATASET</i>
          <div className="text-center text-muted mb-4">
            <small>Augmenting the data</small>
          </div>
        </>
      );
    } else if (status == 'PREPAREMETRICS') {
      return (
        <>
          <i className="text-uppercase text-default ls-1 mb-1">GENERATING METRICS</i>
          <div className="text-center text-muted mb-4">
            <small>extracting scalars and metrics</small>
          </div>
        </>
      );
    } else if (status == 'PROGRESS') {
      const remaining = Number(job.jobStatus.done);
      const total = Number(job.jobStatus.total);
      const percentage = Number((remaining / total) * 100).toFixed(2);
      return (
        <>
          <div>
            <h3 className="mb-0">Training in Progress</h3>
            <Progress percent={percentage} />
          </div>
          <div className="text-center text-muted mb-4">
            <small></small>
          </div>
        </>
      );
    } else {
      return (
        <>
          <i className="text-uppercase text-danger ls-1 mb-1">{status}</i>
          <div className="text-center text-muted mb-4">
            <small>Training Error. Please Check with Administrator</small>
          </div>
        </>
      );
    }
  }

  renderPlayButton(job) {
    const { runningjob } = this.state;
    status = job.jobStatus.status;
    if (
      status == 'SUCCESS' ||
      status == 'READY' ||
      status == 'STOP' ||
      status == 'PROCESS' ||
      status == 'COMPLETE' ||
      status == 'REVOKED' ||
      status == 'ERROR'
    ) {
      if (runningjob != '') {
        return (
          <>
            <span className="heading">
              <Button className="btn btn-outline-primary" disabled>
                <span style={{ color: '#5e72e4' }}>
                  <i className="ni ni-button-play"></i>
                </span>
              </Button>
            </span>
            <span className="description">
              <font size="2" className="text-default mb-0">
                {' '}
                Play
              </font>
            </span>
          </>
        );
      } else {
        return (
          <>
            <span className="heading">
              <Button
                className="btn btn-outline-primary"
                onClick={() => {
                  this.triggerJobTraining(job.id);
                }}
              >
                <span style={{ color: '#5e72e4' }}>
                  <i className="ni ni-button-play"></i>
                </span>
              </Button>
            </span>
            <span className="description">
              <font size="2" className="text-default mb-0">
                {' '}
                Play
              </font>
            </span>
          </>
        );
      }
    } else {
      return (
        <>
          <span className="heading">
            <Button
              className="btn btn-outline-primary"
              onClick={() => {
                this.stopJobTraining(job.id);
              }}
            >
              <span style={{ color: '#5e72e4' }}>
                <i className="ni ni-button-pause"></i>
              </span>
            </Button>
          </span>
          <span className="description">
            <font size="2" className="text-default mb-0">
              {' '}
              Stop
            </font>
          </span>
        </>
      );
    }
  }

  renderProjectCard() {
    const { configureModal, jobs } = this.state;
    return (
      <div>
        <Row>
          {jobs.map(job => {
            var timeUpdate = new Date(job.updatedAt);
            var timeCreate = new Date(job.createdAt);
            return (
              <Col xs="6" key={job.id}>
                <Row>
                  <Col>
                    <Card body outline color="primary">
                      <CardHeader>
                        <div className="text-center">{this.retrieveStatus(job)}</div>
                      </CardHeader>
                      <CardBody>
                        <div className="text=left">
                          <div className="h5 font-weight-300">
                            <i className="ni location_pin mr-2" />
                            created | {timeCreate.toLocaleTimeString()} on{' '}
                            {timeCreate.toLocaleDateString()}
                          </div>
                          <div className="h5 font-weight-300">
                            <i className="ni location_pin mr-2" />
                            updated | {timeUpdate.toLocaleTimeString()} on{' '}
                            {timeUpdate.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-center">
                          <h3>{job.jobName}</h3>
                          <div className="h5 font-weight-300">
                            <i className="ni location_pin mr-2" />
                            {job.jobModel}
                          </div>
                        </div>
                        <Row>
                          <div className="col">
                            <div className="card-profile-stats d-flex justify-content-center">
                              <div>{this.renderPlayButton(job)}</div>
                              <div>
                                <span className="heading">
                                  <Button
                                    className="btn btn-outline-info"
                                    href={`/job/${job.id}/visualizer`}
                                  >
                                    <span>
                                      <i className=" ni ni-chart-bar-32"></i>
                                    </span>
                                  </Button>
                                </span>
                                <span className="description">
                                  <font size="2" className="text-default mb-0">
                                    {' '}
                                    Visualizer
                                  </font>
                                </span>
                              </div>
                              <div>
                                <span className="heading">
                                  <Button
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                      this.toggleModal('edit', job.id);
                                      this.setState({ configureModal: !configureModal });
                                    }}
                                  >
                                    <span>
                                      <i className="fas fa-edit"></i>
                                    </span>
                                  </Button>
                                </span>
                                <span className="description">
                                  <font size="2" className="text-default mb-0">
                                    {' '}
                                    Edit
                                  </font>
                                </span>
                              </div>
                              <div>
                                <span className="heading">
                                  <Button
                                    className="btn btn-outline-info"
                                    onClick={() => {
                                      this.toggleDownloadModal(job);
                                    }}
                                  >
                                    <span>
                                      <i className=" ni ni-cloud-download-95"></i>
                                    </span>
                                  </Button>
                                </span>
                                <span className="description">
                                  <font size="2" className="text-default mb-0">
                                    {' '}
                                    Download
                                  </font>
                                </span>
                              </div>
                              <div>
                                <span className="heading">
                                  <Button
                                    className="btn btn-outline-danger"
                                    onClick={() => {
                                      confirmAlert({
                                        title: 'Confirm to delete',
                                        message: 'Are you sure to delete this job?',
                                        buttons: [
                                          {
                                            label: 'Yes',
                                            onClick: () => this.deleteJob(job.id),
                                          },
                                        ],
                                      });
                                    }}
                                  >
                                    <span>
                                      <i className="fas fa-trash-alt"></i>
                                    </span>
                                  </Button>
                                </span>
                                <span className="description">
                                  <font size="2" className="text-default mb-0">
                                    {' '}
                                    Delete
                                  </font>
                                </span>
                              </div>
                            </div>
                          </div>
                        </Row>
                      </CardBody>
                    </Card>
                    <hr />
                  </Col>
                </Row>
              </Col>
            );
          })}
        </Row>
        <br />
      </div>
    );
  }

  render() {
    const { project } = this.props;
    const {
      configureModal,
      mode,
      jobId,
      jobName,
      jobModel,
      downloadTrainedModelModal,
    } = this.state;
    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }
    return (
      <>
        <div className="text-right">
          <Button className="btn-primary btn-icon" color="primary" onClick={this.toggleModal}>
            Create Job
          </Button>
        </div>
        <hr />

        <Modal size="lg" isOpen={configureModal} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal} />
          <ModalBody>
            <ConfigurePage mode={mode} id={jobId} />
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.toggleModal}>
              Close
            </Button>{' '}
          </ModalFooter>
        </Modal>
        <Row>
          <div className="col">{this.renderProjectCard()}</div>
        </Row>
        <Modal size="lg" isOpen={downloadTrainedModelModal} toggle={this.toggleDownloadModal}>
          <ModalHeader toggle={this.toggleDownloadModal}>
            <div className="h5 font-weight-300">
              <i className="ni location_pin mr-2" />
              <h3>Conversion of a TensorFlow Model</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <DownloadModal id={jobId} jobName={jobName} jobModel={jobModel} />
          </ModalBody>
        </Modal>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(ProjectJob);
