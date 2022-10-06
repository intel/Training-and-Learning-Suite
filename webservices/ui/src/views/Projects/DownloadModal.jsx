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
import Axios from '../../ApiToken';
import { Button, Row, Col, Label } from 'reactstrap';
import { showAlert } from '../../actions';

class DownloadModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.downloadFP32 = this.downloadFP32.bind(this);
    this.downloadFP16 = this.downloadFP16.bind(this);
    this.downloadFPStd = this.downloadFPStd.bind(this);
  }


  downloadFP32() {
    const { id } = this.props;
    const token = localStorage.getItem('jwttoken') || '';
    window.location.href = `/api/job/${id}/downloadFP32?au=${token}`;

  }

  downloadFP16() {
    const { id } = this.props;
    const token = localStorage.getItem('jwttoken') || '';
    window.location.href = `/api/job/${id}/downloadFP16?au=${token}`;
  }

  downloadFPStd() {
    const { id } = this.props;
    const token = localStorage.getItem('jwttoken') || '';
    window.location.href = `/api/job/${id}/downloadFPStd?au=${token}`;

  }

  render() {
    const { id } = this.props;
    return (
      <>
        <div>
          <Row>
            <Col>
              <Row>
                <Col>
                  <Label className="d-flex align-items-center justify-content-center">
                    OpenVINO FP32 Model
                  </Label>
                </Col>
              </Row>
              <Row>
                <Col className="d-flex align-items-center justify-content-center">
                  <Button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      this.downloadFP32();
                    }}
                  >
                    <i className="fa fa-download" size="lg" style={{ fontSize: '10em' }} />
                  </Button>
                </Col>
              </Row>
            </Col>
            <Col>
              <Row>
                <Col>
                  <Label className="d-flex align-items-center justify-content-center">
                    OpenVINO FP16 Model
                  </Label>
                </Col>
              </Row>
              <Row>
                <Col className="d-flex align-items-center justify-content-center">
                  <Button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      this.downloadFP16();
                    }}
                  >
                    <i className="fa fa-download" size="lg" style={{ fontSize: '10em' }} />
                  </Button>
                </Col>
              </Row>
            </Col>
            <Col>
              <Row>
                <Col className="d-flex align-items-center justify-content-center">
                  <Label> Standard Model </Label>
                </Col>
              </Row>
              <Row>
                <Col className="d-flex align-items-center justify-content-center">
                  <Button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      this.downloadFPStd();
                    }}
                  >
                    <i className="fa fa-download" size="lg" style={{ fontSize: '10em' }} />
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
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

export default connect(mapStateToProps)(DownloadModal);
