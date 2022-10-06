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

/* !

=========================================================
* Argon Dashboard React - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { Card, CardBody, CardSubtitle, Container, Row, Col, Button, CardFooter } from 'reactstrap';

import Axios from '../../ApiToken';

// core components
import PlainHeader from 'components/Headers/PlainHeader';
import DatasetModal from './DatasetModal';
import { datasetsSubscribe } from '../../actions';
import { STATUS } from '../../constants';
import Loader from '../../components/Loader';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import { showAlert } from '../../actions';

class Index extends React.Component {
  constructor(props) {
    super(props);

    this.toggleDatasetModal = this.toggleDatasetModal.bind(this);
    this.submitDataset = this.submitDataset.bind(this);
    this.deleteDataset = this.deleteDataset.bind(this);
    this.retrieveDataset = this.retrieveDataset.bind(this);

    this.state = {
      datasetModal: false,
      dataset: [],
    };
  }

  static propTypes = {
    datasets: PropTypes.array,
    dispatch: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.retrieveDataset();
    const upInterval = setInterval(() => {
      this.retrieveDataset();
    }, 1000);
    this.setState({ upInterval });
  }

  componentWillUnmount() {
    const { upInterval } = this.state;
    clearInterval(upInterval);
  }

  toggleDatasetModal() {
    const { datasetModal } = this.state;
    this.setState({
      datasetModal: !datasetModal,
    });
  }

  submitDataset(dataset) {
    const { dispatch, io } = this.props;

    Axios.post('/api/dataset', { name: dataset.name })
      .then(() => {
        this.toggleDatasetModal();
        this.retrieveDataset();
        dispatch(datasetsSubscribe(io));
      })
      .catch(error => {
        dispatch(showAlert('Failed to add dataset', { variant: 'warning' }));
      });
  }

  deleteDataset(datasetId) {
    const { dispatch, io } = this.props;
    Axios.post(`/api/dataset/${datasetId}/delete`)
      .then(() => {
        this.retrieveDataset();
      })
      .catch(error => {
        dispatch(showAlert('Failed to delete dataset', { variant: 'warning' }));
      });
  }

  retrieveDataset() {
    const { dispatch } = this.props;
    Axios.get('/api/dataset')
      .then(res => {
        this.setState({
          dataset: res.data,
        });
      })
      .catch(() => {
        dispatch(showAlert('Failed to retrieve dataset', { variant: 'warning' }));
      });
  }

  render() {
    const { datasetModal, dataset } = this.state;
    return (
      <>
        <PlainHeader />
        <Container className="mt--7" fluid>
          <Row>
            <Col lg="3" md="6">
              <button
                className=" btn-icon-clipboard"
                type="button"
                onClick={() => {
                  this.setState({
                    datasetModal: true,
                  });
                }}
              >
                <div>
                  <i className=" ni ni-fat-add" />
                  <span>Add New Dataset</span>
                </div>
              </button>
            </Col>
          </Row>
        </Container>
        <hr className="my-4" />
        <Container fluid>
          <Row xs="4">
            <Col>
              <h2 className="display-4 text-uppercase text-black ls-1 mb-1">Dataset</h2>
            </Col>
          </Row>
          <Row>
            {dataset.map(data => {
              return (
                <Col lg="3" key={data.id}>
                  <Card body outline color="primary">
                    <CardSubtitle>
                      <Button
                        close
                        style={{ color: '#f5365c' }}
                        onClick={() => {
                          confirmAlert({
                            title: 'Confirm to delete',
                            message: 'Are you sure to delete this project?',
                            buttons: [
                              {
                                label: 'Yes',
                                onClick: () => this.deleteDataset(data.id),
                              },
                              {
                                label: 'No',
                              },
                            ],
                          });
                        }}
                      >
                        <p style={{ color: '#f5365c' }} className="fas fa-trash-alt" />
                        <font size="1"> Delete</font>
                      </Button>
                    </CardSubtitle>
                    <CardBody>
                      <div className="text-center">
                        <h3>{data.name}</h3>
                        <div className="h5 font-weight-300">
                          <i className="ni location_pin mr-2" />
                          {data.id}
                        </div>
                      </div>
                    </CardBody>
                    <CardFooter>
                      <div className="text-center">
                        <Button
                          className="mr-4"
                          color="primary"
                          href={`/datasets/${data.id}`}
                          size="sm"
                        >
                          Gallery
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                  <hr className="my-4" />
                </Col>
              );
            })}
          </Row>
        </Container>
        {/* Modal */}
        <DatasetModal
          modal={datasetModal}
          toggle={this.toggleDatasetModal}
          submit={this.submitDataset}
        />
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    datasets: state.datasets.list,
    datasetsStatus: state.datasets.status,
  };
}

export default connect(mapStateToProps)(Index);
