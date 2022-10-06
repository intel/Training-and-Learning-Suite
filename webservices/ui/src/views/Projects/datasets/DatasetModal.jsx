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
import { Table, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Axios from '../../../ApiToken';
import { showAlert } from '../../../actions';

class DatasetModal extends React.Component {
  constructor(props) {
    super(props);

    this.associateDatasetToProject = this.associateDatasetToProject.bind(this);
  }

  static propTypes = {
    addedDatasets: PropTypes.array,
    datasets: PropTypes.array,
    dispatch: PropTypes.func.isRequired,
    modal: PropTypes.bool.isRequired,
    projectId: PropTypes.string.isRequired,
    toggle: PropTypes.func.isRequired,
  };

  associateDatasetToProject(isRemove, datasetId) {
    const { dispatch, projectId } = this.props;

    if (isRemove) {
      Axios.delete(`/api/project/${projectId}/datasets/${datasetId}`).catch(() => {
        dispatch(showAlert('Failed to unassociate dataset to the project', { variant: 'danger' }));
      });

      return;
    }

    Axios.put(`/api/project/${projectId}/datasets/${datasetId}`).catch(() => {
      dispatch(showAlert('Failed to associate dataset to the project', { variant: 'danger' }));
    });
  }

  render() {
    const { datasets, modal, toggle, addedDatasets } = this.props;

    return (
      <Modal isOpen={modal} toggle={toggle} size="lg">
        <ModalHeader toggle={toggle}>Datasets</ModalHeader>
        <ModalBody>
          <Table className="align-items-center table-flush" responsive>
            <thead className="thead-light">
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Dataset</th>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {datasets.map(dataset => (
                <tr key={dataset.id}>
                  <th scope="row">{dataset.id}</th>
                  <td>{dataset.name}</td>
                  <td>
                    <Button
                      color={addedDatasets.indexOf(dataset.id) !== -1 ? 'danger' : 'secondary'}
                      onClick={() => {
                        this.associateDatasetToProject(
                          addedDatasets.indexOf(dataset.id) !== -1,
                          dataset.id,
                        );
                      }}
                    >
                      {addedDatasets.indexOf(dataset.id) !== -1 ? 'Remove' : 'Add'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => {
              toggle();
            }}
          >
            Done
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

function mapStateToProps(state) {
  return {
    datasets: state.datasets.list,
    projectId: state.project.id,
    addedDatasets: state.project.datasets,
  };
}

export default connect(mapStateToProps)(DatasetModal);
