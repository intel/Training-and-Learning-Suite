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
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Table,
  Form,
  FormGroup,
  Progress,
  CardTitle,
} from 'reactstrap';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import HorizontalScroller from 'react-horizontal-scroll-container';
import Axios from '../../../ApiToken';
import { Range } from 'rc-slider';
import PropTypes from 'prop-types';
import { showAlert, projectSubscribe } from '../../../actions';

import 'rc-slider/assets/index.css';
import Loader from '../../../components/Loader';
import { STATUS } from '../../../constants';

class DatasetSelection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDatasetID: null,
      status: 'pending',
    };

    this.associateDatasetToProject = this.associateDatasetToProject.bind(this);
    this.associateLabelToProject = this.associateLabelToProject.bind(this);
    this.renderLabelTable = this.renderLabelTable.bind(this);
    this.renderDatasetCard = this.renderDatasetCard.bind(this);
    this.onSplitingValueChange = this.onSplitingValueChange.bind(this);
    this.saveButton = this.saveButton.bind(this);
  }

  static propTypes = {
    addedLabels: PropTypes.array.isRequired,
    datasets: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    project: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const { dispatch, io, match } = this.props;
    const projectId = match.params.id;

    dispatch(projectSubscribe(io, projectId));
  }

  associateDatasetToProject(id) {
    const { dispatch, project, datasets } = this.props;
    this.setState({ selectedDatasetID: id });
    datasets.map(dataset => {
      const datasetId = dataset.id;
      if (datasetId == id) {
        const data = {
          name: dataset.name,
          id: datasetId,
        };
        Axios.patch(`/api/project/${project.id}/`, { datasets: data })
          .catch(() => {
            dispatch(
              showAlert('Failed to associate dataset to the project', { variant: 'danger' }),
            );
          })
          .then(this.setState({ status: 'done dataset' }));
        const filteredLabels = dataset.labels;
        filteredLabels.map(label => {
          Axios.put(`/api/project/${project.id}/labels/${label.id}`).catch(() => {
            dispatch(showAlert('Failed to associate label to the project', { variant: 'danger' }));
          });
        });
      }
    });
  }

  associateLabelToProject(isRemove, selectedlabelId, datasetId) {
    const { dispatch, project } = this.props;
    const { selectedDatasetID } = this.state;
    if (datasetId == selectedDatasetID) {
      if (isRemove == true) {
        Axios.delete(`/api/project/${project.id}/labels/${selectedlabelId}`)
          .then(() => {
            this.setState({ status: 'editing' });
            dispatch(
              showAlert(
                'The label is unassociate to the project and will not be include in training',
                { variant: 'warning' },
              ),
            );
          })
          .catch(() => {
            dispatch(
              showAlert('Failed to unassociate label to the project', { variant: 'danger' }),
            );
          });
      } else {
        Axios.patch(`/api/project/${project.id}/labels/${selectedlabelId}`).catch(() => {
          dispatch(showAlert('Failed to associate label to the project', { variant: 'danger' }));
        });
      }
    }
  }

  renderLabelTable(datasetId, labels) {
    const { addedLabels } = this.props;

    return (
      <Table className="align-items-center table-flush" responsive>
        <thead className="thead-light">
          <tr>
            <th scope="col">Label Name</th>
            <th scope="col">Enable/Disable</th>
          </tr>
        </thead>
        <tbody>
          {labels.map(label => (
            <tr key={label.id}>
              <th scope="row">{label.name.replace(`${datasetId}_`, '')}</th>
              <td>
                <Button
                  color={addedLabels.indexOf(label.id) !== -1 ? 'danger' : 'secondary'}
                  onClick={() => {
                    this.associateLabelToProject(
                      addedLabels.indexOf(label.id) !== -1,
                      label.id,
                      datasetId,
                    );
                  }}
                >
                  {addedLabels.indexOf(label.id) !== -1 ? 'Disable' : 'Enable'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  renderDatasetCard(datasetPtr) {
    const { project } = this.props;

    let filteredLabels = datasetPtr.labels;

    if (project.type === 'classification') {
      filteredLabels = datasetPtr.labels.filter(label => label.type === 'wholeImg');
    } else if (project.type === 'autoencoder') {
      filteredLabels = datasetPtr.labels.filter(label => {
        if (label.type === 'wholeImg') {
          if (datasetPtr.labels.length == 1) {
            return true;
          }
        }
      });
    } else {
      filteredLabels = datasetPtr.labels.filter(label => label.type !== 'wholeImg');
    }

    return (
      <Col md="6" key={datasetPtr.id}>
        <Card body outline color="primary" className="card-stats mb-4 mb-xl-0">
          <CardHeader>
            <CardTitle>
              <Button
                className="float-right"
                color="default"
                onClick={() => {
                  this.associateDatasetToProject(datasetPtr.id);
                  this.setState({ status: 'completed' });
                }}
                size="sm"
              >
                Select
              </Button>
            </CardTitle>
            <div className="text-center">
              <h3>
                <Link to={`/datasets/${datasetPtr.id}`}> {datasetPtr.name}</Link>
              </h3>
              <div className="h5 font-weight-300">
                <i className="ni location_pin mr-2" />
                {datasetPtr.id}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {filteredLabels.length === 0 ? (
              <Badge color="" className="badge-dot">
                <i className="bg-danger" />
                This dataset is not suitable for the current project type
              </Badge>
            ) : (
                this.renderLabelTable(datasetPtr.id, filteredLabels)
              )}
          </CardBody>
        </Card>
      </Col>
    );
  }

  onSplitingValueChange(newSplit) {
    const { dispatch, project } = this.props;
    if (newSplit[0] === 0) {
      dispatch(showAlert('Training data cannot be 0%', { variant: 'warning' }));
      return;
    }
    Axios.patch(`/api/project/${project.id}`, {
      datasetSplit: {
        trainRatio: newSplit[0],
        validateRatio: newSplit[1] - newSplit[0],
        testRatio: 100 - newSplit[1],
      },
    }).catch(err => {
      dispatch(
        showAlert(`Failed to select dataset/adjust dataset split ratio:${err}`, {
          variant: 'danger',
        }),
      );
    });
  }

  saveButton() {
    const { status } = this.state;
    if (status == 'pending') {
      return (
        <Button disabled outline color="danger">
          <span className="text-danger mr-2">
            <i className="fas fa-pause-circle" />
          </span>
          <span className="text-danger">Please select dataset</span>
        </Button>
      );
    } else if (status == 'completed') {
      return (
        <Button outline color="success" href={`/projects`}>
          <span className="text-success mr-2">
            <i className="fas fa-save" />
          </span>{' '}
          <span className="text-success">save</span>
        </Button>
      );
    } else if (status == 'editing') {
      return (
        <Button outline color="success" href={`/projects`}>
          <span className="text-warning mr-2">
            <i className="fas fa-edit" /> 75 %
          </span>{' '}
          <span className="text-warning">
            Some labels are unassociated, please proceed to dataset splitting
          </span>
        </Button>
      );
    }
  }

  render() {
    const { datasets, project } = this.props;
    if (project.status !== STATUS.SUCCESS && datasets.status !== STATUS.SUCCESS) {
      return <Loader />;
    }

    const { trainRatio, validateRatio, testRatio } = project.datasetSplit;
    return (
      <>
        <div className="header bg-gradient-info pb-5 pt-5 pt-md-3"></div>
        <Row>
          <Col className="mb-5" sm="12">
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <div className="col">
                    <h5 className="text-uppercase text-muted ls-1 mb-1">Dataset Selection</h5>
                  </div>
                  <Col>
                    <Col>
                      <div className="float-right">{this.saveButton()}</div>
                    </Col>
                  </Col>
                </Row>
              </CardHeader>
              <CardTitle>
                <div className="text-center">
                  <p>
                    <Badge color="" className="badge-dot">
                      <i className="bg-danger" />
                      Must select only one dataset
                    </Badge>
                  </p>
                  <p>
                    <Badge color="" className="badge-dot">
                      <i className="bg-info" />
                      The default dataset splitting is 70:20:10
                    </Badge>
                  </p>
                  <p>
                    <Badge color="" className="badge-dot">
                      <i className="bg-success" />
                      All the labels will be included once the dataset is selected, unless you have
                      selected to disable
                    </Badge>
                  </p>
                </div>
              </CardTitle>
              <CardBody>
                <HorizontalScroller>
                  {datasets.map(datasetPtr => this.renderDatasetCard(datasetPtr))}
                </HorizontalScroller>
              </CardBody>
            </Card>
          </Col>
          <Col sm="12">
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <div className="col">
                    <h5 className="text-uppercase text-muted ls-1 mb-1">Dataset Configuration</h5>
                  </div>
                </Row>
              </CardHeader>
              <CardBody>
                <Form>
                  <h6 className="heading-small text-muted mb-4">Dataset Splitting</h6>
                  <Row>
                    <Col xs="12">
                      <FormGroup>
                        <label className="form-control-label" htmlFor="dataSplit">
                          Autospliting
                        </label>
                        <Progress multi style={{ height: '25px' }}>
                          <Progress bar color="primary" value={trainRatio}>
                            Training {trainRatio}%
                          </Progress>
                          <Progress bar color="warning" value={validateRatio}>
                            Validation {validateRatio}%
                          </Progress>
                          <Progress bar color="danger" value={testRatio}>
                            Testing {testRatio}%
                          </Progress>
                        </Progress>

                        <Range
                          count={4}
                          name="dataSplit"
                          min={0}
                          max={100}
                          onChange={this.onSplitingValueChange}
                          value={[trainRatio, trainRatio + validateRatio]}
                          defaultValue={[trainRatio, trainRatio + validateRatio]}
                          pushable
                          trackStyle={[{ backgroundColor: '#fb6340' }]}
                          handleStyle={[
                            { backgroundColor: '#5e72e4' },
                            { backgroundColor: '#fb6340' },
                            { backgroundColor: '#5e72e4' },
                          ]}
                        />
                      </FormGroup>
                    </Col>
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

export default connect(mapStateToProps)(DatasetSelection);
