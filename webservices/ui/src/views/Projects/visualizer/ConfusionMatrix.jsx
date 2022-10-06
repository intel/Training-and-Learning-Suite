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
import { Container, CardImg, Card, CardBody, Row } from 'reactstrap';
import { showAlert } from '../../../actions';

class ConfusionMatrix extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cm: null,
    };
    this.retrieveCM = this.retrieveCM.bind(this);
  }

  componentDidMount() {
    this.retrieveCM();
  }

  retrieveCM() {
    const { id, dispatch } = this.props;
    Axios.get(`/api/job/${id}/cm/`)
      .then(res => {
        this.setState({ cm: res.data });
      })
      .catch(err => {
        dispatch(
          showAlert(`Failed to retrive confusion matrix diagram: ${err}`, { variant: 'danger' }),
        );
      });
  }
  render() {
    const { cm } = this.state;
    return (
      <>
        <div>
          <Container fluid>
            <div>
              {cm == null ? (
                <Card>
                  <div className="text-center">
                    <CardBody>
                      <Row className="justify-content-center">
                        <div className="h5 mt-4">
                          <i className="ni business_briefcase-24 mr-2" />
                          NO CONFUSION MATRIX IS AVAILABLE
                        </div>
                      </Row>
                    </CardBody>
                  </div>
                </Card>
              ) : (
                <Card>
                  <CardImg top width="100" src={cm} />
                </Card>
              )}
            </div>
          </Container>
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

export default connect(mapStateToProps)(ConfusionMatrix);
