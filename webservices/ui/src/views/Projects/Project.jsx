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
import { Container, Card, CardHeader, CardBody, CardSubtitle, Row, Col, Button, CardTitle } from 'reactstrap';
import PlainHeader from 'components/Headers/PlainHeader';
import { connect } from 'react-redux';
import Steps, { Step } from 'rc-steps';
import PropTypes from 'prop-types';
import { projectSubscribe } from '../../actions';
import { STATUS } from '../../constants';
import Loader from '../../components/Loader';

import 'rc-steps/assets/index.css';
import 'rc-steps/assets/iconfont.css';
import DatasetAug from './datasets/DatasetAug';
import ProjectJob from './ProjectJob';
import JobInfer from './infer/JobInfer';
import Agent from './remoteAgent/Agent'

class Project extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
    };

    this.renderComponent = this.renderComponent.bind(this);
  }

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    io: PropTypes.func.isRequired,
    match: PropTypes.object,
    project: PropTypes.object,
  };

  componentDidMount() {
    const { dispatch, io, match } = this.props;
    const projectId = match.params.id;

    dispatch(projectSubscribe(io, projectId));
  }

  renderComponent(currentStep) {
    switch (currentStep) {
      case 0:
        return <DatasetAug />;
      case 1:
        return <ProjectJob />;
      case 2:
        return <JobInfer />;
      case 3:
        return <Agent />;
    }
  }


  render() {
    const { currentStep } = this.state;
    const { match, project } = this.props;
    const projectId = match.params.id;

    if (project.status !== STATUS.SUCCESS || project.id !== projectId) {
      return <Loader block />;
    }

    return (
      <>
        <PlainHeader />
        <Container className="mt--9" fluid>
          <Card className=" shadow">
            <CardHeader className=" bg-transparent">
              <div className="text-left">
                <div className="h5 mt-4">
                  <i className="ni business_briefcase-24 mr-2" />
                  Project Name: {project.name}
                </div>
                <div className="h5 mt-4">
                  <i className="ni business_briefcase-24 mr-2" />
                  Project Id: {projectId}
                </div>
                <div className="h5 mt-4">
                  <i className="ni business_briefcase-24 mr-2" />
                  Project Type: {project.type}
                </div>
              </div>
              <CardTitle>
                <Steps current={currentStep} className="mt-4">
                  <Step
                    title="Augmentation"
                    icon={<i className="ni ni-folder-17" />}
                    className="stretched-link"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      this.setState({
                        currentStep: 0,
                      });
                    }}
                  />
                  <Step
                    title="Job"
                    style={{ cursor: 'pointer' }}
                    icon={<i className="ni ni-bullet-list-67 " />}
                    onClick={() => {
                      this.setState({
                        currentStep: 1,
                      });
                    }}
                  />
                  <Step
                    title="Test"
                    style={{ cursor: 'pointer' }}
                    icon={<i className="fas fa-vial" />}
                    onClick={() => {
                      this.setState({
                        currentStep: 2,
                      });
                    }}
                  />
                  <Step
                    title="Deploy"
                    style={{ cursor: 'pointer' }}
                    icon={<i className="ni ni-send" />}
                    onClick={() => {
                      this.setState({
                        currentStep: 3,
                      });
                    }}
                  />
                </Steps>
              </CardTitle>
            </CardHeader>
            <CardBody>{this.renderComponent(currentStep)}</CardBody>
          </Card>
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

export default connect(mapStateToProps)(Project);
