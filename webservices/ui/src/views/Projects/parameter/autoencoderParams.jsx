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
import Axios from '../../../ApiToken';
import { Card, CardBody, Row, Form, FormGroup, Input, Col, Button, CardTitle } from 'reactstrap';
import { showAlert } from '../../../actions';

const trainingParams = [
  {
    name: 'epoch',
    displayName: 'Epoch',
    default: 1000,
    explanation:
      'Integer. Number of epochs to train the model. An epoch is an iteration over the entire data provided',
  },
  {
    name: 'training_batch_size',
    displayName: 'Train Batch Size',
    default: 32,
    explanation: 'Integer. Number of samples processed before the model is updated.',
  },
  {
    name: 'validation_batch_size',
    displayName: 'Validation Batch Size',
    default: 32,
    explanation: 'Integer. Number of samples processed before the model is updated.',
  },
  {
    name: 'initial_epoch',
    displayName: 'initial epoch',
    default: 5,
    explanation:
      ' Integer. Epoch at which to start training (useful for resuming a previous training run)',
  },
  {
    name: 'period',
    displayName: 'Period',
    default: 5,
    explanation: 'Interval (number of epochs) between checkpoints.',
  },
];

class AutoParams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      training: {
        epoch: 1000,
        training_batch_size: 32,
        validation_batch_size: 32,
        initial_epoch: 5,
        period: 5,
      },
      earlyStoppingParams: {
        min_delta: 0.0001,
        patience: 5,
      },
      reduceLRonPlateauParams: {
        factor: 0.2,
        patience: 5,
        min_delta: 0.0001,
        cooldown: 0,
        min_lr: 0.001,
      },
      submit: false,
    };

    this.retrieveJobParameter = this.retrieveJobParameter.bind(this);
    this.renderEarlystoppingParams = this.renderEarlystoppingParams.bind(this);
    this.renderReduceLROnPlateauParams = this.renderReduceLROnPlateauParams.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleEarlyStoppingParams = this.handleEarlyStoppingParams.bind(this);
    this.handlereduceLRParams = this.handlereduceLRParams.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    this.retrieveJobParameter();
  }

  retrieveJobParameter() {
    const { id, mode } = this.props;

    if (mode == 'edit') {
      Axios.get(`/api/job/${id}`).then(res => {
        const parameter = res.data.jobConfiguration;
        if (res.data.jobConfiguration !== null) {
          const params = parameter.params;
          const earlyStopping = parameter.earlyStopping;
          const reduceLR = parameter.reduceLR;
          this.setState({ training: params });
          this.setState({ earlyStoppingParams: earlyStopping });
          this.setState({ reduceLRonPlateauParams: reduceLR });
        }
      });
    }
  }

  renderEarlystoppingParams() {
    const { earlyStoppingParams } = this.state;
    const Params = [
      {
        name: 'min_delta',
        displayName: 'min delta',
        default: 0.0001,
        explanation:
          'minimum change in the monitored quantity to qualify as an improvement, i.e. an absolute change of less than min_delta, will count as no improvement.',
      },
      {
        name: 'patience',
        displayName: 'patience',
        default: 5,
        explanation:
          'number of epochs that produced the monitored quantity with no improvement after which training will be stopped.',
      },
    ];
    return Params.map(option => {
      return (
        <Col md="12" key={option.name}>
          <FormGroup>
            <div>
              <label className="form-control-label" htmlFor={option.name}>
                {option.displayName}
              </label>
              <Input
                className="form-control-alternative"
                type="number"
                name={option.name}
                value={earlyStoppingParams[option.name]}
                placeholder={option.default}
                onChange={this.handleEarlyStoppingParams}
              />
            </div>

            <div className="h5 font-weight-300">
              <i className="ni location_pin mr-2" />* {option.explanation}
            </div>
          </FormGroup>
        </Col>
      );
    });
  }

  renderReduceLROnPlateauParams() {
    const { reduceLRonPlateauParams } = this.state;
    const Params = [
      {
        name: 'factor',
        displayName: 'factor',
        default: 0.1,
        explanation: 'factor by which the learning rate will be reduced. new_lr = lr * factor',
      },
      {
        name: 'patience',
        displayName: 'patience',
        default: 5,
        explanation:
          'number of epochs that produced the monitored quantity with no improvement after which training will be stopped.',
      },
      {
        name: 'min_delta',
        displayName: 'min delta',
        default: 0.0001,
        explanation:
          'threshold for measuring the new optimum, to only focus on significant changes.',
      },
      {
        name: 'cooldown',
        displayName: 'cooldown',
        default: 0,
        explanation:
          'number of epochs to wait before resuming normal operation after lr has been reduced.',
      },
      {
        name: 'min_lr',
        displayName: 'min lr',
        default: 0.001,
        explanation: 'lower bound on the learning rate.',
      },
    ];
    return Params.map(option => {
      return (
        <Col md="12" key={option.name}>
          <FormGroup>
            <div>
              <label className="form-control-label" htmlFor={option.name}>
                {option.displayName}
              </label>
              <Input
                className="form-control-alternative"
                type="number"
                name={option.name}
                value={reduceLRonPlateauParams[option.name]}
                placeholder={option.default}
                onChange={this.handlereduceLRParams}
              />
              <div className="h5 font-weight-300">
                <i className="ni location_pin mr-2" />* {option.explanation}
              </div>
            </div>
          </FormGroup>
        </Col>
      );
    });
  }

  handleChange(e) {
    const { training } = this.state;
    this.setState({ training: { ...training, [e.target.name]: e.target.value } });
  }

  handleEarlyStoppingParams(e) {
    const { earlyStoppingParams } = this.state;
    this.setState({
      earlyStoppingParams: { ...earlyStoppingParams, [e.target.name]: e.target.value },
    });
  }

  handlereduceLRParams(e) {
    const { reduceLRonPlateauParams } = this.state;
    this.setState({
      reduceLRonPlateauParams: { ...reduceLRonPlateauParams, [e.target.name]: e.target.value },
    });
  }

  submit() {
    const { dispatch, id } = this.props;
    const { training, earlyStoppingParams, reduceLRonPlateauParams } = this.state;
    Axios.patch(`/api/job/${id}`, {
      jobConfiguration: {
        params: training,
        earlyStopping: earlyStoppingParams,
        reduceLR: reduceLRonPlateauParams,
      },
    })
      .then(this.setState({ submit: true }))
      .catch(err => {
        dispatch(showAlert(`Failed to configure training parameter ${err}`, { variant: 'danger' }));
      });
  }

  render() {
    const { training, submit } = this.state;
    const { mode } = this.props;
    return (
      <>
        <Card>
          <div className="text-muted text-center mt-2 mb-4">
            <small>
              {mode == 'edit' ? 'Edit  Yolo Training Parameter' : 'Add Yolo Training Parameter'}
            </small>
          </div>

          <CardBody>
            <CardTitle>
              <Row className="align-items-center">
                <div className="col">
                  <h3 className="mb-0">
                    EarlyStopping <span className="font-weight-light"> [Callbacks]</span>
                  </h3>
                  <small>* Stop training when validation loss has stopped improving.</small>
                </div>
              </Row>
            </CardTitle>
            <Row>{this.renderEarlystoppingParams()}</Row>
          </CardBody>
          <CardBody>
            <CardTitle>
              <Row className="align-items-center">
                <div className="col">
                  <h3 className="mb-0">
                    ReduceLROnPlateau <span className="font-weight-light"> [Callbacks]</span>
                  </h3>
                  <small>* Reduce learning rate when a metric has stopped improving.</small>
                </div>
              </Row>
            </CardTitle>
            <Row>{this.renderReduceLROnPlateauParams()}</Row>
          </CardBody>
          <CardBody>
            <CardTitle>
              <Row className="align-items-center">
                <div className="col">
                  <h3 className="mb-0">General Parameter</h3>
                </div>
              </Row>
            </CardTitle>
            <Form>
              <div>
                {trainingParams.map(option => (
                  <Row key={option.name}>
                    <Col md="12" key={option.name}>
                      <FormGroup>
                        <label className="form-control-label" htmlFor={option.name}>
                          {option.displayName}
                        </label>
                        <Input
                          className="form-control-alternative"
                          type="number"
                          name={option.name}
                          value={training[option.name]}
                          placeholder={option.default}
                          onChange={this.handleChange}
                        />
                      </FormGroup>
                      <div className="h5 font-weight-300">
                        <i className="ni location_pin mr-2" />* {option.explanation}
                      </div>
                    </Col>
                  </Row>
                ))}
              </div>
            </Form>
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
                <span className="btn-inner--text"> {mode == 'edit' ? 'Save' : 'Submit'}</span>
              </Button>
            </div>
          </CardBody>
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

export default connect(mapStateToProps)(AutoParams);
