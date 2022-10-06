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

import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Form,
  FormGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Input,
  CardFooter,
} from 'reactstrap';
import Steps, { Step } from 'rc-steps';
import ModelSelection from './ModelSelection';
import ParameterConfigure from './ParameterConfigure';
import Axios from '../../../ApiToken';
import { showAlert } from '../../../actions';
class ConfigurePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStep: 0,
      jobName: '',
      submit: false,
      id: null,
    };

    this.renderComponent = this.renderComponent.bind(this);
    this.handle = this.handle.bind(this);
    this.submit = this.submit.bind(this);
    this.retrieveJobs = this.retrieveJobs.bind(this);
  }

  handle(e) {
    e => e.preventDefault();
    const value = e.target.value;
    this.setState({ jobName: value });
  }
  componentWillMount() {
    this.retrieveJobs();
  }

  retrieveJobs() {
    const { mode, id } = this.props;
    if (mode == 'edit' && id !== undefined) {
      Axios.get(`/api/job/${id}`).then(res => {
        const data = res.data;
        this.setState({ jobName: data.jobName });
        this.setState({ id: data.id });
      });
    }
  }

  submit() {
    const { jobName } = this.state;
    const { project, dispatch, mode, id } = this.props;
    if (mode == 'edit' && id !== undefined) {
      Axios.patch(`/api/job/${id}`, {
        jobName: jobName,
        jobStatus: { status: 'READY' },
      })
        .then(this.setState({ submit: true }))
        .catch(err => {
          dispatch(showAlert(`Failed to edit the name:${err}`, { variant: 'danger' }));
        });
    } else {
      Axios.post(`/api/job/`, {
        jobName: jobName,
        jobStatus: { status: 'READY' },
        project: project.id,
      })
        .then(this.setState({ submit: true }))
        .then(res => {
          const data = res.data;
          const jobId = data.id;
          this.setState({ id: jobId });
        })
        .catch(err => {
          dispatch(showAlert(`Failed to create job:${err}`, { variant: 'danger' }));
        });
    }
  }
  renderComponent(currentStep) {
    const { jobName, submit, id } = this.state;
    const { mode } = this.props;
    switch (currentStep) {
      case 0:
        return (
          <Card className="bg-secondary shadow border-0">
            <CardBody className="px-lg-5 py-lg-5">
              <div className="text-muted text-center mt-2 mb-4">
                <small>{mode == 'edit' ? 'Edit Job' : 'Add Job'}</small>
              </div>
              <Form role="form">
                <FormGroup>
                  <InputGroup className="input-group-alternative mb-3">
                    <InputGroupAddon addonType="prepend">
                      <InputGroupText>
                        <i className="ni ni-hat-3" />
                      </InputGroupText>
                    </InputGroupAddon>
                    <Input
                      placeholder="Name"
                      type="text"
                      name="jobName"
                      value={jobName}
                      onChange={this.handle}
                    />
                  </InputGroup>
                </FormGroup>
                <div className="text-center">
                  <Button
                    className="mt-4"
                    color={submit ? 'default' : 'primary'}
                    disabled={submit}
                    type="button"
                    onClick={this.submit}
                  >
                    <span className="btn-inner--icon">
                      <i className="fas fa-paper-plane fa-lg-fw"></i>
                    </span>
                    <span className="btn-inner--text">{mode == 'edit' ? 'Save' : 'Submit'}</span>
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        );
      case 1:
        return <ModelSelection id={id} mode={mode} />;
      case 2:
        return <ParameterConfigure id={id} mode={mode} />;
    }
  }
  render() {
    const { currentStep } = this.state;
    return (
      <>
        <Card>
          <CardHeader>
            <Steps current={currentStep} className="mt-4">
              <Step
                title="Name"
                icon={<i className="fas fa-id-card-alt" />}
                className="stretched-link"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  this.setState({
                    currentStep: 0,
                  });
                }}
              />
              <Step
                title="Model"
                icon={<i className="fas fa-project-diagram" />}
                className="stretched-link"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  this.setState({
                    currentStep: 1,
                  });
                }}
              />
              <Step
                title="Parameter"
                style={{ cursor: 'pointer' }}
                icon={<i className="fas fa-list" />}
                onClick={() => {
                  this.setState({
                    currentStep: 2,
                  });
                }}
              />
            </Steps>
            <CardBody>
              <CardBody>{this.renderComponent(currentStep)}</CardBody>
            </CardBody>
          </CardHeader>
        </Card>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(ConfigurePage);
