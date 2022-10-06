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
  { value: 'ssd_mobilenet_v1_coco', label: 'SSD Mobilenet v1' },
  { value: 'ssd_mobilenet_v2_coco', label: 'SSD Mobilenet v2' },
  { value: 'ssd_inception_v2_coco', label: 'SSD Inception v2' },
  // { value: 'ssd_resnet50', label: 'SSD Resnet 50' },
  { value: 'faster_rcnn_inception_v2_coco', label: 'Faster RCNN Inception v2' },
  { value: 'faster_rcnn_resnet50_coco', label: 'Faster RCNN Resnet50' },
  { value: 'faster_rcnn_resnet101_coco', label: 'Faster RCNN Resnet101' },
  {
    value: 'faster_rcnn_inception_resnet_v2_atrous_coco',
    label: 'Faster RCNN Inception Resnet v2',
  },
  { value: 'faster_rcnn_nas_coco', label: 'Faster RCNN nas' },
  { value: 'yolo', label: 'YoloV3' },
];

class ObjectDetection extends React.Component {
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

export default connect(mapStateToProps)(ObjectDetection);
