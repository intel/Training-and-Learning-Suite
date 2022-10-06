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
import { Card, CardHeader, Button, CardBody } from 'reactstrap';
import Classification from '../model/Classification';
import ObjectDetection from '../model/ObjectDetection.jsx';
import Segmentation from '../model/Segmentation';
import Autoencoder from '../model/Autoencoder';
import Axios from '../../../ApiToken';
import { STATUS } from '../../../constants';
import Loader from '../../../components/Loader';

class ModelSelection extends React.Component {
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
    const { pretrainedModel } = this.state;
    const { project, id, mode } = this.props;
    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }

    if (pretrainedModel == true) {
      switch (project.type) {
        case 'classification':
          return <Classification id={id} mode={mode} />;
        case 'object detection':
          return <ObjectDetection id={id} mode={mode} />;
        case 'segmentation':
          return <Segmentation id={id} mode={mode} />;
        case 'autoencoder':
          return <Autoencoder id={id} mode={mode} />;
      }
    }
  }

  render() {
    const { mode } = this.props;
    const { model } = this.state;
    return (
      <>
        <Card className="bg-secondary shadow border-0">
          <CardHeader className="bg-transparent pb-5">
            <div className="text-muted text-center mt-2 mb-4">
              <small>{mode == 'edit' ? null : 'Add model'}</small>
            </div>
            {mode == 'edit' || model !== null ? (
              <>
                <div className="text-center">
                  <h3>{model}</h3>
                  <div className="h5 mt-4">
                    <i className="ni business_briefcase-24 mr-2" />
                    have selected
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <Button
                  className="btn-neutral btn-icon mr-4"
                  color="default"
                  onClick={() => {
                    this.setState({ pretrainedModel: true });
                  }}
                >
                  <span className="btn-inner--text">Pretrained Model</span>
                </Button>
              </div>
            )}
          </CardHeader>
          <CardBody className="px-lg-5 py-lg-5">{this.renderComponent()}</CardBody>
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

export default connect(mapStateToProps)(ModelSelection);
