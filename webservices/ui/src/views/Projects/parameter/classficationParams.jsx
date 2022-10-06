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
import {
  Card,
  CardBody,
  Row,
  Form,
  FormGroup,
  Input,
  Col,
  Button,
  Label,
  Toast,
  ToastBody,
  ToastHeader,
  CardTitle,
  CardText,
  CardSubtitle,
} from 'reactstrap';
import Select from 'react-select';
import { showAlert } from '../../../actions';

const lossesoptions = [
  { value: 'mean_squared_error', label: 'Mean Squared Error' },
  { value: 'mean_absolute_error', label: 'Mean Absolute Error' },
  { value: 'mean_squared_logarithmic_error', label: 'Mean Squared Logarithmic Error' },
  { value: 'squared_hinge', label: 'Squared Hinge' },
  { value: 'hinge', label: 'Hinge' },
  { value: 'categorical_hinge', label: 'Categorical hinge' },
  { value: 'categorical_crossentropy', label: 'Categorical Crossentropy' },
];

const lossExplanation = [
  {
    value: 'Mean Squared Error',
    explanation: 'Computes the mean of squares of errors between labels and predictions',
  },
  {
    value: 'Mean Absolute Error',
    explanation: 'Computes the mean of absolute difference between labels and predictions',
  },
  {
    value: 'Mean Squared Logarithmic Error',
    explanation: 'Computes the mean squared logarithmic error between `y_true` and `y_pred`.',
  },
  {
    value: 'Squared Hinge',
    explanation: 'Computes the squared hinge loss between `y_true` and `y_pred`.',
  },
  { value: 'Hinge', explanation: 'Computes the hinge loss between `y_true` and `y_pred`.' },
  {
    value: 'Categorical hinge',
    explanation: 'Computes the categorical hinge loss between `y_true` and `y_pred`.',
  },
  {
    value: 'Categorical Crossentropy',
    explanation: 'Computes the crossentropy loss between the labels and predictions.',
  },
];

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
    explanation:
      'Integer. Number of samples processed before the model is updated. Minimum required is 32 and above.',
  },
  {
    name: 'validation_batch_size',
    displayName: 'Validation Batch Size',
    default: 32,
    explanation:
      'Integer. Number of samples processed before the model is updated. Minimum required is 32 and above.',
  },
  {
    name: 'period',
    displayName: 'Period',
    default: 5,
    explanation: 'Interval (number of epochs) between checkpoints.',
  },
];

class classificationParams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lossesSelectedOption: null,
      training: {
        epoch: 1000,
        training_batch_size: 32,
        validation_batch_size: 32,
        period: 5,
      },
      sgdoptimizerParams: {
        learning_rate: 0.001,
        momentum: 0.0,
        nesterov: false,
      },
      adamoptimizerParams: {
        learning_rate: 0.001,
        beta_1: 0.9,
        beta_2: 0.999,
        amsgrad: false,
      },
      RMSoptimizerParams: {
        learning_rate: 0.001,
        rho: 0.9,
      },
      earlyStoppingParams: {
        min_delta: 0.0001,
        patience: 1000,
      },
      reduceLRonPlateauParams: {
        factor: 0.2,
        patience: 1000,
        min_delta: 0.0001,
        cooldown: 0,
        min_lr: 0.001,
      },
      lossFunc: 'categorical_crossentropy',
      optimizer: 'SGD',
      optimizerSGDChecked: false,
      optimizerAdamChecked: false,
      optimizerRMSpropChecked: false,
      submit: false,
      showToast: false,
    };
    this.retrieveJobParameter = this.retrieveJobParameter.bind(this);
    this.renderOptimizerArgu = this.renderOptimizerArgu.bind(this);
    this.renderEarlystoppingParams = this.renderEarlystoppingParams.bind(this);
    this.renderReduceLROnPlateauParams = this.renderReduceLROnPlateauParams.bind(this);
    this.lossesHandleChange = this.lossesHandleChange.bind(this);
    this.optimizerHandleChange = this.optimizerHandleChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleOptimizerParams = this.handleOptimizerParams.bind(this);
    this.handleEarlyStoppingParams = this.handleEarlyStoppingParams.bind(this);
    this.handlereduceLRParams = this.handlereduceLRParams.bind(this);
    this.submit = this.submit.bind(this);
    this.toggleToast = this.toggleToast.bind(this);
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
          const optimizer = parameter.optimizer;
          const optimizerArgu = parameter.optimizerArgu;
          const earlyStopping = parameter.earlyStopping;
          const reduceLR = parameter.reduceLR;

          this.setState({ lossesSelectedOption: parameter.losses });
          this.setState({ training: params });
          this.setState({ earlyStoppingParams: earlyStopping });
          this.setState({ reduceLRonPlateauParams: reduceLR });
          if (optimizer == 'SGD') {
            this.setState({ optimizerSGDChecked: true });
            this.setState({ sgdoptimizerParams: optimizerArgu });
          } else if (optimizer == 'Adam') {
            this.setState({ optimizerAdamChecked: true });
            this.setState({ optimizerAdamChecked: optimizerArgu });
          } else if (optimizer == ' RMSprop') {
            this.setState({ optimizerRMSpropChecked: true });
            this.setState({ optimizerRMSpropChecked: optimizerArgu });
          }
        }
      });
    }
  }
  renderOptimizerArgu() {
    const { sgdoptimizerParams, optimizer, adamoptimizerParams, RMSoptimizerParams } = this.state;

    const sgdParams = [
      {
        name: 'learning_rate',
        displayName: 'Learning Rate',
        default: 0.01,
        explanation:
          'parameter that controls how much users are adjusting the weights of the network with respect the loss gradient',
      },
      {
        name: 'momentum',
        displayName: 'Momentum',
        default: 0.0,
        explanation:
          'parameter that accelerates SGD in the relevant direction and dampens oscillations.',
      },
      {
        name: 'nesterov',
        displayName: 'Nesterov',
        boolen: false,
        explanation: 'Whether to apply Nesterov momentum.',
      },
    ];

    const adamParams = [
      {
        name: 'learning_rate',
        displayName: 'Learning Rate',
        default: 0.001,
        explanation:
          'parameter that controls how much users are adjusting the weights of the network with respect the loss gradient',
      },
      {
        name: 'beta_1',
        displayName: 'Beta_1',
        default: 0.9,
        explanation: '0 < beta < 1. Generally close to 1.',
      },
      {
        name: 'beta_2',
        displayName: 'Beta_2',
        default: 0.9999,
        explanation: '0 < beta < 1. Generally close to 1.',
      },
      {
        name: 'amsgrad',
        displayName: 'AMSgrad',
        boolen: false,
        explanation:
          'Whether to apply the AMSGrad variant of this algorithm from the paper On the Convergence of Adam and Beyond',
      },
    ];

    const rmspropParams = [
      {
        name: 'learning_rate',
        displayName: 'Learning Rate',
        default: 0.001,
        explanation:
          'parameter that controls how much users are adjusting the weights of the network with respect the loss gradient',
      },
      {
        name: 'rho',
        displayName: 'Rho',
        default: 0.9,
        explanation: '-',
      },
    ];

    if (optimizer == 'SGD') {
      return sgdParams.map(option => {
        return (
          <Col md="12" key={option.name}>
            {option.default !== undefined ? (
              <FormGroup>
                <div>
                  <label className="form-control-label" htmlFor={option.name}>
                    {option.displayName}
                  </label>
                  <Input
                    className="form-control-alternative"
                    type="number"
                    name={option.name}
                    value={sgdoptimizerParams[option.name]}
                    placeholder={option.default}
                    onChange={this.handleOptimizerParams}
                  />
                </div>

                <div className="h5 font-weight-300">
                  <i className="ni location_pin mr-2" />* {option.explanation}
                </div>
              </FormGroup>
            ) : (
                <FormGroup>
                  <label className="form-control-label" htmlFor={option.name}>
                    <Row>
                      <Col>{option.displayName}</Col>
                      <Col>
                        <Input
                          type="checkbox"
                          name={option.name}
                          value="True"
                          onChange={this.handleOptimizerParams}
                        />
                      </Col>
                    </Row>
                  </label>
                  <div className="h5 font-weight-300">
                    <i className="ni location_pin mr-2" />* {option.explanation}
                  </div>
                </FormGroup>
              )}
          </Col>
        );
      });
    } else if (optimizer == 'Adam') {
      return adamParams.map(option => {
        return (
          <Col md="12" key={option.name}>
            {option.default !== undefined ? (
              <FormGroup>
                <div>
                  <label className="form-control-label" htmlFor={option.name}>
                    {option.displayName}
                  </label>
                  <Input
                    className="form-control-alternative"
                    type="number"
                    name={option.name}
                    value={adamoptimizerParams[option.name]}
                    placeholder={option.default}
                    onChange={this.handleOptimizerParams}
                  />
                </div>

                <div className="h5 font-weight-300">
                  <i className="ni location_pin mr-2" />* {option.explanation}
                </div>
              </FormGroup>
            ) : (
                <FormGroup>
                  <label className="form-control-label" htmlFor={option.name}>
                    <Row>
                      <Col>{option.displayName}</Col>
                      <Col>
                        <Input
                          type="checkbox"
                          name={option.name}
                          value="True"
                          onChange={this.handleOptimizerParams}
                        />
                      </Col>
                    </Row>
                  </label>
                  <div className="h5 font-weight-300">
                    <i className="ni location_pin mr-2" />* {option.explanation}
                  </div>
                </FormGroup>
              )}
          </Col>
        );
      });
    } else if (optimizer == 'RMSprop') {
      return rmspropParams.map(option => {
        return (
          <Col md="12" key={option.name}>
            {option.default !== undefined ? (
              <FormGroup>
                <div>
                  <label className="form-control-label" htmlFor={option.name}>
                    {option.displayName}
                  </label>
                  <Input
                    className="form-control-alternative"
                    type="number"
                    name={option.name}
                    value={RMSoptimizerParams[option.name]}
                    placeholder={option.default}
                    onChange={this.handleOptimizerParams}
                  />
                </div>

                <div className="h5 font-weight-300">
                  <i className="ni location_pin mr-2" />* {option.explanation}
                </div>
              </FormGroup>
            ) : (
                <FormGroup>
                  <label className="form-control-label" htmlFor={option.name}>
                    <Row>
                      <Col>{option.displayName}</Col>
                      <Col>
                        <Input
                          type="checkbox"
                          name={option.name}
                          value="True"
                          onChange={this.handleOptimizerParams}
                        />
                      </Col>
                    </Row>
                  </label>
                  <div className="h5 font-weight-300">
                    <i className="ni location_pin mr-2" />* {option.explanation}
                  </div>
                </FormGroup>
              )}
          </Col>
        );
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

  lossesHandleChange(lossesSelectedOption) {
    const lossFun = lossesSelectedOption.value;
    this.setState({ lossFunc: lossFun });
    this.setState({ lossesSelectedOption: lossFun });
  }

  optimizerHandleChange(e) {
    this.setState({ optimizer: e.target.name });
    const optimizer = e.target.name;
    if (optimizer == 'SGD') {
      this.setState({ optimizerSGDChecked: true });
      this.setState({ optimizerAdamChecked: false });
      this.setState({ optimizerRMSpropChecked: false });
    } else if (optimizer == 'Adam') {
      this.setState({ optimizerSGDChecked: false });
      this.setState({ optimizerAdamChecked: true });
      this.setState({ optimizerRMSpropChecked: false });
    } else if (optimizer == 'RMSprop') {
      this.setState({ optimizerRMSpropChecked: true });
      this.setState({ optimizerAdamChecked: false });
      this.setState({ optimizerSGDChecked: false });
    }
  }

  handleChange(e) {
    const { training } = this.state;
    this.setState({ training: { ...training, [e.target.name]: e.target.value } });
  }

  handleOptimizerParams(e) {
    const { sgdoptimizerParams, optimizer, adamoptimizerParams, RMSoptimizerParams } = this.state;
    if (optimizer == 'SGD') {
      this.setState({
        sgdoptimizerParams: { ...sgdoptimizerParams, [e.target.name]: e.target.value },
      });
    } else if (optimizer == 'Adam') {
      this.setState({
        adamoptimizerParams: { ...adamoptimizerParams, [e.target.name]: e.target.value },
      });
    } else if (optimizer == 'RMSprop') {
      this.setState({
        RMSoptimizerParams: { ...RMSoptimizerParams, [e.target.name]: e.target.value },
      });
    }
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

  toggleToast() {
    const { showToast } = this.state;
    this.setState({ showToast: !showToast });
  }

  submit() {
    const { dispatch, id } = this.props;
    const {
      training,
      lossFunc,
      sgdoptimizerParams,
      optimizer,
      adamoptimizerParams,
      RMSoptimizerParams,
      earlyStoppingParams,
      reduceLRonPlateauParams,
    } = this.state;
    if (training.training_batch_size < 1 || training.validation_batch_size < 1) {
      window.alert(`Minimun required value for batch size is 1`);
    } else {
      if (optimizer == 'SGD') {
        Axios.patch(`/api/job/${id}`, {
          jobConfiguration: {
            params: training,
            losses: lossFunc,
            optimizer: optimizer,
            optimizerArgu: sgdoptimizerParams,
            earlyStopping: earlyStoppingParams,
            reduceLR: reduceLRonPlateauParams,
          },
        })
          .then(this.setState({ submit: true }))
          .catch(err => {
            dispatch(
              showAlert(`Failed to configure training parameter ${err}`, { variant: 'danger' }),
            );
          });
      } else if (optimizer == 'Adam') {
        Axios.patch(`/api/job/${id}`, {
          jobConfiguration: {
            params: training,
            losses: lossFunc,
            optimizer: optimizer,
            optimizerArgu: adamoptimizerParams,
            earlyStopping: earlyStoppingParams,
            reduceLR: reduceLRonPlateauParams,
          },
        })
          .then(this.setState({ submit: true }))
          .catch(err => {
            dispatch(
              showAlert(`Failed to configure training parameter ${err}`, { variant: 'danger' }),
            );
          });
      } else if (optimizer == 'RMSprop') {
        Axios.patch(`/api/job/${id}`, {
          jobConfiguration: {
            params: training,
            losses: lossFunc,
            optimizer: optimizer,
            optimizerArgu: RMSoptimizerParams,
            earlyStopping: earlyStoppingParams,
            reduceLR: reduceLRonPlateauParams,
          },
        })
          .then(this.setState({ submit: true }))
          .catch(err => {
            dispatch(
              showAlert(`Failed to configure training parameter ${err}`, { variant: 'danger' }),
            );
          });
      }
    }
  }

  render() {
    const {
      training,
      submit,
      lossesSelectedOption,
      showToast,
      optimizerSGDChecked,
      optimizerAdamChecked,
      optimizerRMSpropChecked,
    } = this.state;
    const { mode } = this.props;
    return (
      <>
        <Card>
          <div className="text-muted text-center mt-2 mb-4">
            <small>
              {mode == 'edit'
                ? 'Edit  Classification Training Parameter'
                : 'Add  Classification Training Parameter'}
            </small>
          </div>
          <CardBody>
            <CardTitle>
              <Row className="align-items-center">
                <div className="col">
                  <h3 className="mb-0">Loss Functions</h3>
                </div>
              </Row>
              <Row>
                <div className="col text-right">
                  <Button color="primary" onClick={this.toggleToast} size="sm">
                    Explanation
                  </Button>
                  <br />
                  <br />
                  <Toast isOpen={showToast}>
                    <ToastHeader toggle={this.toggleToast}>
                      <div className="text-center mb-4">Usage of loss functions</div>
                    </ToastHeader>
                    {lossExplanation.map(option => {
                      return (
                        <ToastBody className="text-left mb-4">
                          <div>{option.value}</div>
                          <small> {option.explanation}</small>
                        </ToastBody>
                      );
                    })}
                  </Toast>
                </div>
              </Row>
            </CardTitle>
            <div className="text-center">
              <Select
                value={lossesoptions.filter(option => option.value === lossesSelectedOption)}
                onChange={this.lossesHandleChange}
                options={lossesoptions}
              />
            </div>
          </CardBody>
          <CardBody>
            <CardTitle>
              <Row className="align-items-center">
                <div className="col">
                  <h3 className="mb-0">Optimizers</h3>
                </div>
              </Row>
            </CardTitle>
            <CardSubtitle>
              <div>
                <Row>
                  <Col>
                    <FormGroup check>
                      <Input
                        type="checkbox"
                        name="SGD"
                        onChange={this.optimizerHandleChange}
                        checked={optimizerSGDChecked}
                      />
                      <Label for="SGD" check>
                        SGD
                      </Label>
                    </FormGroup>
                  </Col>
                  <Col>
                    <FormGroup check>
                      <Input
                        type="checkbox"
                        name="Adam"
                        onChange={this.optimizerHandleChange}
                        checked={optimizerAdamChecked}
                      />
                      <Label for="Adam" check>
                        Adam
                      </Label>
                    </FormGroup>
                  </Col>
                  <Col>
                    <FormGroup check>
                      <Input
                        type="checkbox"
                        name="RMSprop"
                        onChange={this.optimizerHandleChange}
                        checked={optimizerRMSpropChecked}
                      />
                      <Label for="RMSprop" check>
                        RMSprop
                      </Label>
                    </FormGroup>
                  </Col>
                </Row>
              </div>
            </CardSubtitle>
            <CardText>
              <div>
                <Row>
                  {optimizerSGDChecked == true ||
                    optimizerAdamChecked == true ||
                    optimizerRMSpropChecked == true
                    ? this.renderOptimizerArgu()
                    : null}
                </Row>
              </div>
            </CardText>
          </CardBody>
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

export default connect(mapStateToProps)(classificationParams);
