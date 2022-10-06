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
import Select from 'react-select';
import Axios from '../../../ApiToken';
import { Button } from 'reactstrap';
import { showAlert } from '../../../actions';

const options = [
  { value: 'xception', label: 'Xception' },
  { value: 'vgg16', label: 'VGG16' },
  { value: 'vgg19', label: 'VGG19' },
  { value: 'resnet', label: 'ResNet' },
  { value: 'inceptionv3', label: 'InceptionV3' },
  { value: 'inceptionresnetv2', label: 'Inception ResNetV2' },
  { value: 'mobilenet', label: 'MobileNet' },
  { value: 'mobilenetv2', label: 'MobileNetV2' },
  { value: 'densenet', label: 'DenseNet' },
  { value: 'nasnet', label: 'NASNet' },
  { value: 'lenet', label: 'Lenet 5' },
  { value: 'googlenet', label: 'GoogleNet' },
];

class Classification extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedOption: null,
      model: null,
      submit: false,
    };
    this.submit = this.submit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(selectedOption) {
    const model = selectedOption.value;
    this.setState({ model: model });
    this.setState({ selectedOption });
  }
  submit() {
    const { model } = this.state;
    const { dispatch, id } = this.props;
    Axios.patch(`/api/job/${id}`, {
      jobModel: model,
    })
      .then(this.setState({ submit: true }))
      .catch(err => {
        dispatch(showAlert(`Failed to select model:${err}`, { variant: 'danger' }));
      });
  }
  render() {
    const { selectedOption, submit } = this.state;
    const { mode } = this.props;
    return (
      <>
        <div className="text-center">
          <Select value={selectedOption} onChange={this.handleChange} options={options} />
        </div>
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
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(Classification);
