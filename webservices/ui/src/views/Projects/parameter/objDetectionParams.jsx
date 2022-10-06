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
import { Card, CardBody, Row, Form, FormGroup, Input, Col, Button, Label, Badge } from 'reactstrap';

import { showAlert } from '../../../actions';

const trainingParams = [
  {
    name: 'train_steps',
    displayName: 'Train Steps',
    default: 1000,
  },
  {
    name: 'learning_rate',
    displayName: 'Learning Rate',
    default: 0.001,
  },
  {
    name: 'batch_size',
    displayName: 'Batch Size',
    default: 1,
  },
  {
    name: 'momentum_optimizer_value',
    displayName: 'Momentum Optimizer Value',
    default: 0.9,
  },
];

class ObjectDetectionParams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      training: {
        train_steps: 1000,
        learning_rate: 0.001,
        batch_size: 1,
        momentum_optimizer_value: 0.9,
      },
      minDin: 150,
      maxDin: 300,
      submit: false,
    };
    this.retrieveJobParameter = this.retrieveJobParameter.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    this.retrieveJobParameter();
  }

  retrieveJobParameter() {
    const { id, mode } = this.props;
    if (mode == 'edit') {
      Axios.get(`/api/job/${id}`).then((res) => {
        if (res.data.jobConfiguration !== null) {
          const parameter = res.data.jobConfiguration;
          const min_dimension = res.data.minDin;
          const max_dimension = res.data.maxDin;
          this.setState({ training: parameter });
          this.setState({ minDin: min_dimension });
          this.setState({ maxDin: max_dimension });
        }
      });
    }
  }

  handleChange(e) {
    const { training } = this.state;
    if (e.target.name === 'min_dimension') {
      this.setState({ minDin: e.target.value });
    } else if (e.target.name == 'max_dimension') {
      this.setState({ maxDin: e.target.value });
    } else {
      this.setState({ training: { ...training, [e.target.name]: e.target.value } });
    }
  }

  submit() {
    const { dispatch, id } = this.props;
    const { training, minDin, maxDin } = this.state;
    Axios.patch(`/api/job/${id}`, {
      jobConfiguration: training,
      minDin: minDin,
      maxDin: maxDin,
    })
      .then(this.setState({ submit: true }))
      .catch((err) => {
        dispatch(showAlert(`Failed to configure training parameter ${err}`, { variant: 'danger' }));
      });
  }

  render() {
    const { training, submit, minDin, maxDin } = this.state;
    const { mode } = this.props;
    return (
      <>
        <Card>
          <CardBody>
            <Form>
              <div className="text-muted text-center mt-2 mb-4">
                <small>
                  {mode == 'edit'
                    ? 'Edit  Object Detection Training Parameter'
                    : 'Add  Object Detection Training Parameter'}
                </small>
              </div>
              <div className="pl-lg-4">
                {trainingParams.map((option) => (
                  <Row key={option.name}>
                    <Col md="12">
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
                    </Col>
                  </Row>
                ))}
              </div>
            </Form>
            <hr />

            <div className="text-muted text-center mt-2 mb-4">
              <small> Custom Images Input Shape </small>
            </div>
            <div className="text-left mt-2 mb-4">
              <div>
                <Badge color="" className="badge-dot mr-4">
                  <div>
                    <i className="bg-primary" />
                    <small> fixed_shape_resizer [SSD detector] </small>
                  </div>
                </Badge>
              </div>
              <i className="text-left">
                <small> Stretches input image to the specific height and width </small>
              </i>
              <div>
                <Badge color="" className="badge-dot mr-4">
                  <div>
                    <i className="bg-primary" />
                    <small> keep_aspect_ratio_resizer [FRCNN detector] </small>
                  </div>
                </Badge>
              </div>
              <i className="text-left">
                <small>
                  {' '}
                  Resizes the input image keeping aspect ratio to satisfy the minimum and maximum
                  size constraints{' '}
                </small>
              </i>
              <div>
                <Badge color="" className="badge-dot mr-4">
                  <div>
                    <i className="bg-primary" />
                    <small> Excluded for faster_rcnn_nas_coco neural network </small>
                  </div>
                </Badge>
              </div>
              <i className="text-left">
                <small>
                  {' '}
                  Only default (300x300) setting is currently supported for NASNet
                  featurization.{' '}
                </small>
              </i>
            </div>
            <div className="text-left mt-2 mb-4">
              <div>
                <Badge color="" className="badge-dot mr-4">
                  <div>
                    <i className="bg-danger" />
                    <small>
                      {' '}
                      Increase/Decrease of the ratio resizer depending on the available memory.{' '}
                    </small>
                  </div>
                </Badge>
              </div>
              <i className="text-left">
                <small> (Higher values require more memory and vice-versa) </small>
              </i>
            </div>
            <FormGroup>
              <Label for="exampleEmail">
                min dimension [FRCNN Detector]/ height [SSD Detector]
              </Label>
              <Input
                type="email"
                name="min_dimension"
                placeholder="150"
                value={minDin}
                onChange={this.handleChange}
              />
            </FormGroup>
            <FormGroup>
              <Label for="exampleEmail">max dimension [FRCNN Detector]/ width [SSD Detector]</Label>
              <Input
                type="email"
                name="max_dimension"
                placeholder="300"
                value={maxDin}
                onChange={this.handleChange}
              />
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

export default connect(mapStateToProps)(ObjectDetectionParams);
