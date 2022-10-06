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

import {
  Jumbotron,
  Card,
  CardBody,
  CardImg,
  Button,
  Container,
  CardTitle,
  CardFooter,
  Table,
  Badge,
  CardText,
} from 'reactstrap';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';
import Loader from '../../../components/Loader';
import { STATUS } from '../../../constants';
import Axios from '../../../ApiToken';
import { showAlert } from '../../../actions';
import Slider from 'rc-slider';

class DropZone extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inferencingStatus: null,
      inferencingImage: null,
      result: null,
      inferencingData: null,
      type: null,
      confident: 0.5,
    };
    this.onDrop = this.onDrop.bind(this);
    this.renderDropzone = this.renderDropzone.bind(this);
    this.confidentLevel = this.confidentLevel.bind(this);
    this.renderPreview = this.renderPreview.bind(this);
    this.infer = this.infer.bind(this);
    this.renderResultTable = this.renderResultTable.bind(this);
    this.renderResultImg = this.renderResultImg.bind(this);
    this.renderResult = this.renderResult.bind(this);
    this.renderComponent = this.renderComponent.bind(this);
  }

  onDrop(acceptedFiles) {
    this.setState({ inferencingImage: acceptedFiles });
    this.setState({ inferencingStatus: 'preview' });
    var reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);
    reader.onloadend = () => {
      this.setState({
        inferencingData: reader.result,
      });
    };
  }

  renderDropzone() {
    return (
      <div className="text-center mt-5 ">
        <Dropzone onDrop={this.onDrop} accept="image/*" maxFiles={1}>
          {({ getRootProps, getInputProps, isDragActive, isDragReject }) => (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <p>Drag 'n' drop a image here, or click to select image</p>
              {isDragActive && !isDragReject && (
                <>
                  <div className="block-example border border-success">
                    <span style={{ color: '#2dce89', fontSize: '200%' }}>
                      <i className="fa fa-check-circle"></i>
                    </span>
                  </div>
                </>
              )}
              {isDragReject && (
                <>
                  <div className="block-example border border-danger">
                    <span style={{ color: '#f5365c', fontSize: '200%' }}>
                      <i className="fa fa-times-circle"></i>
                    </span>
                    <font size="2" className="text-danger mb-0">
                      {' '}
                      File type not accepted, please upload again!
                    </font>
                  </div>
                </>
              )}
            </div>
          )}
        </Dropzone>
      </div>
    );
  }

  confidentLevel(confident) {
    this.setState({ confident: confident });
  }

  renderPreview() {
    const { inferencingImage, confident } = this.state;
    const { project } = this.props;
    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }
    const urlPreview = URL.createObjectURL(inferencingImage[0]);
    const name = inferencingImage[0]['name'];
    if (project.type == 'object detection' || project.type == 'segmentation') {
      return (
        <Card body outline color="default">
          <CardText className="text-center">
            <img width="50%" height="auto" src={urlPreview} />
          </CardText>
          {/* <CardImg top width="100%" src={urlPreview} /> */}
          <CardBody>
            <div className="text-center">
              <h6 className="heading-small text-muted mb-4">{name}</h6>
              CONFIDENT LEVEL
              <hr />
              <div>
                <Slider
                  name="confident"
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={this.confidentLevel}
                  defaultValue={0.5}
                  value={confident}
                />

                <Badge color="" className="badge-dot">
                  <i className="bg-info" />
                  {confident}
                </Badge>
              </div>
            </div>
          </CardBody>
          <CardFooter>
            <Button
              style={{ color: '#5e72e4' }}
              onClick={() => {
                this.infer();
                this.setState({ inferencingStatus: 'waiting' });
              }}
            >
              Infer
              <span>
                <i> </i>
                <i className="fas fa-camera"></i>
              </span>
            </Button>
          </CardFooter>
        </Card>
      );
    } else {
      return (
        <Card>
          <CardText className="text-center">
            <img width="50%" height="auto" src={urlPreview} />
          </CardText>

          <CardBody>
            <div className="text-center">
              <h6 className="heading-small text-muted mb-4">{name}</h6>
            </div>
          </CardBody>
          <CardFooter>
            <Button
              style={{ color: '#5e72e4' }}
              onClick={() => {
                this.infer();
                this.setState({ inferencingStatus: 'waiting' });
              }}
            >
              Infer
              <span>
                <i> </i>
                <i className="fas fa-camera"></i>
              </span>
            </Button>
          </CardFooter>
        </Card>
      );
    }
  }

  infer() {
    const { id, dispatch } = this.props;
    const { inferencingData, confident } = this.state;
    Axios.post(`/api/job/${id}/inferencing/`, { op: { 'image': inferencingData, 'confident': confident } }).catch(err => {
      dispatch(showAlert(`Failed to start/stop:${err}`, { variant: 'danger' }));
    }).then((res) => {
      this.setState({ result: res.data });
      this.setState({ inferencingStatus: 'display result' });
    });
  }

  renderResultTable() {
    const { result, inferencingImage } = this.state;
    if (result == 'model is not ready yet') {
      return (
        <Card>
          <CardBody className="text-center">
            <Loader />
            <CardTitle>
              <div className="h5 mt-4">
                <i className="ni business_briefcase-24 mr-2" />
                Model is not ready yet
              </div>
            </CardTitle>
          </CardBody>
        </Card>
      );
    } else {
      const urlPreview = URL.createObjectURL(inferencingImage[0]);
      const probabilty = result[2] * 100;
      const inferTime = result[0].toFixed(3);
      return (
        <Card>
          <CardText className="text-center">
            <img width="50%" height="auto" src={urlPreview} />
          </CardText>

          <CardBody>
            <CardTitle>
              <div className="h5 mt-4">
                <i className="ni business_briefcase-24 mr-2" />
                Output
              </div>
            </CardTitle>
            <Table bordered className="text-center">
              <thead>
                <tr>
                  <th>Result</th>
                  <th>Probability (%)</th>
                  <th>Inferencing Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{result[1]}</td>
                  <td>{probabilty}</td>
                  <td>{inferTime} ms</td>
                </tr>
              </tbody>
            </Table>
          </CardBody>
          <CardFooter>
            <Button
              style={{ color: 'indigo' }}
              onClick={() => {
                this.setState({ inferencingStatus: null });
              }}
            >
              Reset
              <span>
                <i> </i>
                <i className="fas fa-undo"></i>
              </span>
            </Button>
          </CardFooter>
        </Card>
      );
    }
  }

  renderResultImg() {
    const { result } = this.state;
    if (result == 'model is not ready yet') {
      return (
        <Card>
          <CardBody className="text-center">
            <Loader />
            <CardTitle>
              <div className="h5 mt-4">
                <i className="ni business_briefcase-24 mr-2" />
                Model is not ready yet
              </div>
            </CardTitle>
          </CardBody>
        </Card>
      );
    } else {
      const b64img = `data:image/jpeg;base64, ${result}`;
      return (
        <Card>
          <CardText className="text-center">
            <img width="50%" height="auto" src={b64img} />
          </CardText>
          <CardTitle className="text-center">
            <div className="h5 mt-4">
              <i className="ni business_briefcase-24 mr-2" />
              Output
            </div>
          </CardTitle>
          <CardFooter>
            <Button
              style={{ color: 'indigo' }}
              onClick={() => {
                this.setState({ inferencingStatus: null });
              }}
            >
              Reset
              <span>
                <i> </i>
                <i className="fas fa-undo"></i>
              </span>
            </Button>
          </CardFooter>
        </Card>
      );
    }
  }

  renderResult() {
    const { project } = this.props;
    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }

    if (
      project.type == 'segmentation' ||
      project.type == 'object detection' ||
      project.type == 'autoencoder'
    ) {
      return <>{this.renderResultImg()}</>;
    } else {
      return <>{this.renderResultTable()}</>;
    }
  }

  renderComponent() {
    const { inferencingStatus } = this.state;
    if (inferencingStatus == null) {
      return <>{this.renderDropzone()}</>;
    } else if (inferencingStatus == 'preview') {
      return <>{this.renderPreview()}</>;
    } else if (inferencingStatus == 'waiting') {
      return <Loader />;
    } else if (inferencingStatus == 'display result') {
      return <>{this.renderResult()}</>;
    }
  }

  render() {
    const { id } = this.props;
    if (id == undefined) {
      return <Loader />;
    }
    return (
      <>
        <div className="rounded mb-0 block-example border border-primary">
          <Jumbotron fluid>
            <Container fluid>{this.renderComponent()}</Container>
          </Jumbotron>
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

export default connect(mapStateToProps)(DropZone);
