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
import { Row, Col, Card, CardHeader, CardBody, Input, Form, FormGroup } from 'reactstrap';
import { connect } from 'react-redux';
import Axios from '../../../ApiToken';
import PropTypes from 'prop-types';
import { showAlert } from '../../../actions';

import 'rc-slider/assets/index.css';

let classificationAugmentationOptions = [
  {
    name: 'rotation_range',
    displayName: 'Rotation (range)',
    default: 20,
  },
  {
    name: 'zoom_range',
    displayName: 'Zoom (range)',
    default: 0.15,
  },
  {
    name: 'width_shift_range',
    displayName: 'Width Shift (range)',
    default: 0.2,
  },
  {
    name: 'height_shift_range',
    displayName: 'Height Shift (range)',
    default: 0.2,
  },
  {
    name: 'shear_range',
    displayName: 'Shear (range)',
    default: 0.15,
  },
  {
    name: 'horizontal_flip',
    displayName: 'Horizontal Flip',
  },
  {
    name: 'vertical_flip',
    displayName: 'Vertical Flip',
  },
  {
    name: 'duplicate_factor',
    displayName: 'Duplicate Factor',
    default: 1,
  },
];

let objectAugmentationOptions = [
  {
    name: 'duplicate_factor',
    displayName: 'Duplicate Factor',
    default: 1,
  },
];

class DatasetAug extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      datasetModal: false,
      datasetSize: 0,
      estimatedDatasetSize: 0
    };

    this.onAugmentEnable = this.onAugmentEnable.bind(this);
    this.onAugmentValueChange = this.onAugmentValueChange.bind(this);

    this.allRefs = {};
    classificationAugmentationOptions.map(option => {
      if (option.default) {
        this.allRefs[option.name] = React.createRef();
      }
      return null;
    });
  }

  static propTypes = {
    addedLabels: PropTypes.array.isRequired,
    datasets: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    project: PropTypes.object.isRequired,
  };

  componentDidMount() {
    let self = this;
    let { datasetSize } = this.state;
    const { project, dispatch } = this.props;

    Axios.get(`/api/dataset/${project.datasets.id}`)
      .then(res => {
        datasetSize = res.data.files.length;
        let duplicate_factor = project.datasetAugmentation.duplicate_factor || 1;
        let estimatedDatasetSize = datasetSize * parseInt(duplicate_factor);
        self.setState({ datasetSize: datasetSize, estimatedDatasetSize: estimatedDatasetSize });
      })
      .catch(err => {
        dispatch(showAlert(`Failed to retrieve jobs ${err}`, { variant: 'danger' }));
      });
  }

  onAugmentValueChange(e) {
    let { datasetSize, estimatedDatasetSize } = this.state;
    const { project, dispatch } = this.props;
    const { datasetAugmentation } = project;
    const { name, value } = e.target;

    const updatedAugmentation = { ...datasetAugmentation };
    updatedAugmentation[name] = value;

    if (name == "duplicate_factor") {
      estimatedDatasetSize = datasetSize * parseInt(value);
      this.setState({ estimatedDatasetSize });
    }

    Axios.patch(`/api/project/${project.id}`, {
      datasetAugmentation: updatedAugmentation,
    }).catch(err => {
      dispatch(showAlert(`Failed to adjust dataset augmentation:${err}`, { variant: 'danger' }));
    });
  }

  onAugmentEnable(e) {
    const { datasetSize } = this.state;
    const { project, dispatch } = this.props;
    const { datasetAugmentation } = project;
    const { name, checked } = e.target;
    const updatedAugmentation = { ...datasetAugmentation };
    if (checked) {
      const ref = this.allRefs[name];
      let value = true;
      if (ref) {
        value = ref.current.props.placeholder;
      }
      updatedAugmentation[name] = value;
    } else {
      if (name == "duplicate_factor") {
        this.setState({ estimatedDatasetSize: datasetSize });
      }
      delete updatedAugmentation[name];
    }
    Axios.patch(`/api/project/${project.id}`, {
      datasetAugmentation: updatedAugmentation,
    }).catch(err => {
      dispatch(showAlert(`Failed to adjust dataset augmentation:${err}`, { variant: 'danger' }));
    });
  }

  render() {
    const { estimatedDatasetSize } = this.state;
    const { project } = this.props;
    const { datasetAugmentation } = project;
    return (
      <>
        <Row>
          <Col sm="12">
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center"></Row>
              </CardHeader>
              <CardBody>
                <Form>
                  <h6 className="heading-small text-muted mb-4">Data Augmentation [ Total Sample Size: {estimatedDatasetSize} ]</h6>
                  <Row>
                    {project.type === 'classification' ? (
                      classificationAugmentationOptions.map(option => (
                        <Col xs="3" key={option.name}>
                          <FormGroup>
                            <label className="form-control-label" htmlFor={option.name}>
                              <Input
                                type="checkbox"
                                name={option.name}
                                onChange={this.onAugmentEnable}
                                checked={Object.prototype.hasOwnProperty.call(
                                  datasetAugmentation,
                                  option.name,
                                )}
                              />
                              {option.displayName}
                            </label>
                            {option.default && (
                              <Input
                                className="form-control-alternative"
                                name={option.name}
                                placeholder={option.default}
                                value={datasetAugmentation[option.name]}
                                type="text"
                                ref={this.allRefs[option.name]}
                                disabled={
                                  !Object.prototype.hasOwnProperty.call(
                                    datasetAugmentation,
                                    option.name,
                                  )
                                }
                                onChange={this.onAugmentValueChange}
                              />
                            )}
                          </FormGroup>
                        </Col>
                      ))
                    ) : project.type === 'object detection' ? (
                      objectAugmentationOptions.map(option => (
                        <Col xs="3" key={option.name}>
                          <FormGroup>
                            <label className="form-control-label" htmlFor={option.name}>
                              <Input
                                type="checkbox"
                                name={option.name}
                                onChange={this.onAugmentEnable}
                                checked={Object.prototype.hasOwnProperty.call(
                                  datasetAugmentation,
                                  option.name,
                                )}
                              />
                              {option.displayName}
                            </label>
                            {option.default && (
                              <Input
                                className="form-control-alternative"
                                name={option.name}
                                placeholder={option.default}
                                value={datasetAugmentation[option.name]}
                                type="text"
                                ref={this.allRefs[option.name]}
                                disabled={
                                  !Object.prototype.hasOwnProperty.call(
                                    datasetAugmentation,
                                    option.name,
                                  )
                                }
                                onChange={this.onAugmentValueChange}
                              />
                            )}
                          </FormGroup>
                        </Col>
                      ))
                    ) : (
                          <div className="text-uppercase h3 font-weight-300">
                            <i className="ni location_pin mr-2" />
                        NO AUGMENTATION AVAILABLE FOR {project.type}
                          </div>
                        )}
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    addedLabels: state.project.labels,
    datasets: state.datasets.list,
    project: state.project,
  };
}

export default connect(mapStateToProps)(DatasetAug);
