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
import ObjectDetectionParams from '../parameter/objDetectionParams';
import SegmentationParams from '../parameter/segmentationParams';
import ClassificationParams from '../parameter/classficationParams';
import YoloParams from '../parameter/yoloParams';
import AutoParams from '../parameter/autoencoderParams';
import Axios from '../../../ApiToken';
import Loader from '../../../components/Loader';
import { STATUS } from '../../../constants';
class ParameterConfigure extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pretrainedModel: false,
      customeModel: false,
      model: null,
    };
    this.renderComponent = this.renderComponent.bind(this);
  }

  componentDidMount() {
    const { id } = this.props;
    Axios.get(`/api/job/${id}`).then(res => {
      const data = res.data;
      const model = data.jobModel;
      this.setState({ model: model });
    });
  }

  renderComponent() {
    const { id, project, mode } = this.props;
    const { model } = this.state;
    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }

    switch (project.type) {
      case 'object detection':
        if (model == 'yolo') {
          return <YoloParams id={id} mode={mode} />;
        } else {
          return <ObjectDetectionParams id={id} mode={mode} />;
        }
      case 'segmentation':
        return <SegmentationParams id={id} mode={mode} />;
      case 'classification':
        return <ClassificationParams id={id} mode={mode} />;
      case 'autoencoder':
        return <AutoParams id={id} mode={mode} />;
    }
  }

  render() {
    return <>{this.renderComponent()}</>;
  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(ParameterConfigure);
