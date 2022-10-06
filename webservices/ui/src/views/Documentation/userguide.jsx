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

class UserGuide extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.downloadPDF = this.downloadPDF.bind(this);
    this.downloadFile = this.downloadFile.bind(this)

  }

  downloadFile(url, filename) {
    const { dispatch } = this.props;
    Axios.get(url, {
      responseType: 'blob',
    })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.setAttribute('download', filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
      })
      .catch(err => {
        dispatch(showAlert(`Failed to download :${err}`, { variant: 'danger' }));
      });
  }


  downloadPDF() {
    const url = `/api/documentation/downloadPDF`;
    const filename = 'TLS20_USERGUIDE.pdf'
    this.downloadFile(url, filename);

  }


  render() {
    return (
      <>
        <div className="header bg-info py-1 py-lg-4" />
        <div className="py-1 py-lg-3">
          <Row>
            <Col>
              <Row>
                <Col>
                  <Label className="d-flex align-items-center justify-content-center">
                    User Guide [pdf]
                  </Label>
                </Col>
              </Row>
              <Row>
                <Col className="d-flex align-items-center justify-content-center">
                  <Button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      this.downloadPDF();
                    }}
                  >
                    <i className="fa fa-download" size="lg" style={{ fontSize: '10em' }} />
                  </Button>
                </Col>
              </Row>
            </Col>
            {/* <Col>
              <Row>
                <Col className="d-flex align-items-center justify-content-center">
                  <Label>   User Guide [docs] </Label>
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
            </Col> */}
          </Row>
        </div>
      </>
    );
  }
}


export default UserGuide
