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
import {
  Row,
  Media,
  Badge,
  Progress,
  Button,
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  Card,
  CardHeader,
  ButtonGroup,
  ModalFooter,
} from 'reactstrap';
import { connect } from 'react-redux';

import Loader from '../../../components/Loader';
import { STATUS } from '../../../constants';
import AgentModal from './agentModal';
import Axios from '../../../ApiToken';
import { confirmAlert } from 'react-confirm-alert';
import { showAlert } from '../../../actions';

class Agent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modal: false,
      agents: [],
      modalResult: false,
      resultStatus: '',
      image: null,
      resultAgentId: null,
      result: null,
    };

    this.deleteagent = this.deleteagent.bind(this);
    this.toggleResultModal = this.toggleResultModal.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.submitJob = this.submitJob.bind(this);
    this.retrieveAgent = this.retrieveAgent.bind(this);
    this.retrieveProject = this.retrieveProject.bind(this);
    this.deploy = this.deploy.bind(this);
    this.infer = this.infer.bind(this);
    this.stop = this.stop.bind(this);
    this.resultAgent = this.resultAgent.bind(this);
  }

  componentDidMount() {
    this.retrieveProject();
    this.resultAgent();
    const upInterval = setInterval(() => {
      this.retrieveProject();
      this.resultAgent();
    }, 500);
    this.setState({ upInterval });
  }

  componentWillUnmount() {
    const { upInterval } = this.state;
    clearInterval(upInterval);
  }

  deleteagent(id) {
    const { dispatch } = this.props;
    const { projectId } = this.state;
    Axios.delete(`/api/agent/${id}`)
      .catch(err => {
        dispatch(showAlert(`Failed to remove an agent:${err}`, { variant: 'danger' }));
      })
      .then(this.retrieveAgent(projectId));
  }

  toggleResultModal() {
    const { modalResult } = this.state;
    if (!modalResult == false) {
      this.stop();
    }

    this.setState({
      modalResult: !modalResult,
    });
  }

  toggleModal() {
    const { modal } = this.state;
    this.setState({
      modal: !modal,
    });
  }

  submitJob(agent) {
    const { projectId } = this.state;
    Axios.post(`/api/agent`, {
      agentName: agent.name,
      agentStatus: 'NEW',
      agentUUID: agent.uuid,
      job: agent.job,
      project: projectId,
    }).then(() => {
      this.retrieveAgent(projectId);
    });
  }

  retrieveAgent(projectId) {
    this.setState({ projectId: projectId });
    Axios.get(`/api/project/${projectId}/`).then(res => {
      const agents = res.data.agents;
      this.setState({ agents: agents });
    });
  }

  retrieveProject() {
    const { project } = this.props;

    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }
    this.retrieveAgent(project.id);
  }

  deploy(agent) {
    const { dispatch } = this.props;
    Axios.patch(`/api/agent/${agent.id}`, {
      agentStatus: 'DEPLOY',
    }).then(
      Axios.post(`/api/agent/${agent.id}/deploy`).catch(error => {
        dispatch(showAlert(`Failed to deploy agent: ${error}`, { variant: 'danger' }));
      }),
    );
  }

  infer(agent) {
    const { dispatch } = this.props;
    Axios.patch(`/api/agent/${agent.id}`, {
      agentStatus: 'INFER',
    }).then(
      Axios.post(`/api/agent/${agent.id}/infer`, { op: 'INFERENCING' }).catch(error => {
        dispatch(showAlert(`Failed to Infer: ${error}`, { variant: 'danger' }));
      }),
    );
  }

  resultAgent() {
    const { resultAgentId } = this.state;
    if (resultAgentId !== null) {
      Axios.get(`/api/agent/${resultAgentId}`).then(res => {
        const result = res.data;
        const resultStatus = result.agentStatus;
        const resultImg = result.agentResult;
        this.setState({ resultStatus: resultStatus });
        this.setState({ resultImg: resultImg });
      });
    }
  }

  stop() {
    const { dispatch } = this.props;
    const { result } = this.state;
    if (result !== null) {
      Axios.patch(`/api/agent/${result.id}`, {
        agentStatus: 'DISCONNECTED',
      }).then(
        Axios.post(`/api/agent/${result.id}/infer`, { op: 'STOP' }).catch(error => {
          dispatch(showAlert(`Failed to Infer: ${error}`, { variant: 'danger' }));
        }),
      );
    }
  }

  progress(status) {
    if (status == 'NEW') {
      return (
        <Badge color="" className="badge-dot mr-4">
          <i className="bg-default" />
          <i className="text-uppercase text-default ls-1 mb-1">{status}</i>
        </Badge>
      );
    } else if (status == 'DEPLOY') {
      return (
        <div className="d-flex align-items-center">
          <Loader />
          <font style={{ color: '#212529' }} size="1">
            {' '}
            Deploying
          </font>
        </div>
      );
    } else if (status == 'SUCCESS') {
      return (
        <Badge color="" className="badge-dot mr-4">
          <i className="bg-success" />
          <i className="text-uppercase text-success ls-1 mb-1">{status}</i>
        </Badge>
      );
    } else if (status == 'PROGRESS' || status == 'INFER' || status == 'CONNECTING') {
      return (
        <Badge color="" className="badge-dot mr-4">
          <i className="bg-info" />
          <i className="text-uppercase text-info ls-1 mb-1">CONNECTING</i>
        </Badge>
      );
    } else if (status == 'DISCONNECTED') {
      return (
        <Badge color="" className="badge-dot mr-4">
          <i className="bg-danger" />
          <i className="text-uppercase text-danger ls-1 mb-1">{status}</i>
        </Badge>
      );
    }
  }

  display() {
    const { resultStatus, resultImg } = this.state;
    if (resultStatus !== null || resultImg !== null) {
      if (resultStatus == 'DISCONNECTED' || resultStatus == 'INFER' || resultImg == undefined) {
        return (
          <div className="text-center">
            <Loader />
          </div>
        );
      } else {
        const b64img = `data:image/jpeg;base64, ${resultImg}`;
        return (
          <div className="text-center">
            <img width="100%" height="auto" src={b64img} />
          </div>
        );
      }
    }
  }

  render() {
    const { project } = this.props;
    const { modal, agents, modalResult } = this.state;
    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }
    return (
      <>
        <Row>
          <div className="col">
            <Card className="shadow">
              <CardHeader className="border-0">
                <Button className="btn-primary btn-icon" color="primary" onClick={this.toggleModal}>
                  <span className="btn-inner--text">Add New Agent</span>
                </Button>
              </CardHeader>
              <Table className="align-items-center table-flush" responsive striped>
                <thead className="thead-light">
                  <tr>
                    <th scope="col">Agent</th>
                    <th scope="col">UUID</th>
                    <th scope="col">JOB SELECTED</th>
                    <th scope="col">ACTION</th>
                    <th scope="col">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(agent => {
                    return (
                      <tr key={agent.agentName}>
                        <th scope="row">
                          <Media className="align-items-center">
                            <Media>
                              <span className="mb-0 text-sm">{agent.agentName}</span>
                            </Media>
                          </Media>
                        </th>
                        <td>
                          <Badge color="" className="badge-dot mr-4">
                            <i className="bg-default" />
                            {agent.agentUUID}
                          </Badge>
                        </td>
                        <td>
                          <Badge color="" className="badge-dot mr-4">
                            <i className="bg-indigo" />
                            {agent.job}
                          </Badge>
                        </td>
                        <td>
                          <div className="avatar-group">
                            <Row>
                              <ButtonGroup>
                                {agent.agentStatus !== 'DEPLOY' ? (
                                  <Button
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                      this.deploy(agent);
                                    }}
                                  >
                                    <span color="primary" className="fas fa-share-square" />
                                    <font style={{ color: '#212529' }} size="1">
                                      {' '}
                                      DEPLOY
                                    </font>
                                  </Button>
                                ) : (
                                  <Button color="secondary" disabled>
                                    <span color="primary" className="fas fa-share-square" />
                                    <font style={{ color: '#212529' }} size="1">
                                      {' '}
                                      DEPLOY
                                    </font>
                                  </Button>
                                )}
                                <Button
                                  className="btn btn-outline-primary"
                                  onClick={() => {
                                    this.infer(agent);
                                    this.toggleResultModal();
                                    this.setState({ resultAgentId: agent.id });
                                    this.setState({ result: agent });
                                  }}
                                >
                                  <span color="primary" className="fas fa-external-link-alt" />
                                  <font style={{ color: '#212529' }} size="1">
                                    {' '}
                                    VIEW
                                  </font>
                                </Button>

                                <Button
                                  className="btn btn-outline-danger"
                                  onClick={() => {
                                    confirmAlert({
                                      title: 'Confirm to delete',
                                      message: 'Are you sure to delete this agent?',
                                      buttons: [
                                        {
                                          label: 'Yes',
                                          onClick: () => this.deleteagent(agent.id),
                                        },
                                        {
                                          label: 'No',
                                        },
                                      ],
                                    });
                                  }}
                                >
                                  <span style={{ color: '#f5365c' }} className="fas fa-trash-alt" />
                                  <font style={{ color: '#212529' }} size="1">
                                    {' '}
                                    DELETE
                                  </font>
                                </Button>
                              </ButtonGroup>
                            </Row>
                          </div>
                        </td>
                        <td>{this.progress(agent.agentStatus)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          </div>
        </Row>
        <AgentModal modal={modal} toggle={this.toggleModal} submit={this.submitJob} />
        <Modal isOpen={modalResult} toggle={this.toggleResultModal}>
          <ModalHeader toggle={this.toggleResultModal}>Result</ModalHeader>
          <ModalBody>{this.display()}</ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              onClick={() => {
                this.toggleResultModal();
              }}
            >
              Close
            </Button>
          </ModalFooter>
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

export default connect(mapStateToProps)(Agent);
