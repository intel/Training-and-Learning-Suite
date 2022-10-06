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
import PropTypes from 'prop-types';

import { Button, Modal, ModalHeader, ModalBody, Label, Row, Col, Badge } from 'reactstrap';
import Select from 'react-select';

const Uppy = require('@uppy/core');
const { DashboardModal } = require('@uppy/react');
const XHRUpload = require('@uppy/xhr-upload');

require('@uppy/core/dist/style.css');
require('@uppy/dashboard/dist/style.css');

class UploaderModal extends React.Component {
  constructor(props) {
    super(props);

    const uppy = Uppy({
      restrictions: {
        allowedFileTypes: ['image/*'],
      },
    });

    const { datasetId, onComplete } = props;

    this.onModalClosed = this.onModalClosed.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
    this.onLabelSelectChange = this.onLabelSelectChange.bind(this);

    uppy.on('complete', res => {
      if (res.failed.length === 0) {
        onComplete();
      }
    });

    uppy.on('file-added', this.onFileChange);

    this.state = {
      labels: [],
      files: [],
      uppy: uppy,
    };

    this.setUploadDatasetId(datasetId);
  }

  static propTypes = {
    datasetId: PropTypes.string.isRequired,
    modal: PropTypes.bool.isRequired,
    onComplete: PropTypes.func.isRequired,
    options: PropTypes.array.isRequired,
    toggle: PropTypes.func.isRequired,
    toggleLabelModal: PropTypes.func.isRequired,
  };

  componentDidUpdate(prevProps) {
    const { datasetId } = this.props;

    if (datasetId !== prevProps.datasetId) {
      this.setUploadDatasetId(datasetId);
    }
  }

  setUploadDatasetId(datasetId) {
    const { uppy } = this.state;
    const plugin = uppy.getPlugin('XHRUpload');
    if (plugin) uppy.removePlugin(plugin);

    uppy.use(XHRUpload, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('jwttoken')}`,
        'X-CSRF-TOKEN': `${localStorage.getItem('csrf')}`,
      },
      bundle: false,
      endpoint: `/api/dataset/${datasetId}/upload`,
      fieldName: 'files',
    });
  }

  onModalClosed() {
    const { uppy } = this.state;
    uppy.reset();
    this.setState({
      labels: [],
      files: [],
    });
  }

  onFileChange = file => {
    const { uppy, labels, files } = this.state;
    const labelValues = labels.map(label => label.value);
    files.push(file.id);
    this.setState(
      {
        files,
      },
      () => {
        uppy.setFileMeta(file.id, {
          labelValues,
        });
      },
    );
  };

  _filterLabelOptions = labels => {
    const wholePictureLabelOptions = labels.find(label => label.label === 'Whole Picture');
    const options = wholePictureLabelOptions.options.filter(
      option => option.value !== 'unassigned',
    );

    return [
      {
        label: 'Whole Picture',
        options,
      },
    ];
  };

  onLabelSelectChange = labels => {
    this.setState({ labels });
  };

  render() {
    const { uppy, labels } = this.state;
    const { modal, toggle, options, toggleLabelModal } = this.props;
    const closeBtn = (
      <Button size="sm" onClick={toggle}>
        <i className=" ni ni-fat-remove" />
      </Button>
    );

    return (
      <Modal size="lg" isOpen={modal} toggle={toggle} onClosed={this.onModalClosed}>
        <ModalBody>
          <ModalHeader toggle={toggle} close={closeBtn}>
            <div>
              <Badge color="" className="badge-dot">
                <i className="bg-danger" />
                Please select the label before upload the images [excl. box/segmentation]
              </Badge>
            </div>
          </ModalHeader>

          <Label>Select label(s) for uploaded images</Label>
          <Row>
            <Col md="9">
              <Select
                options={this._filterLabelOptions(options)}
                isMulti={true}
                value={labels}
                onChange={this.onLabelSelectChange}
              />
            </Col>
            <Col md="3">
              <Button
                color="primary"
                onClick={() => {
                  toggleLabelModal(false);
                }}
              >
                Add Label
              </Button>
            </Col>
          </Row>
        </ModalBody>

        <ModalBody>
          <DashboardModal inline={true} uppy={uppy} open={modal} onRequestClose={toggle} />
        </ModalBody>
      </Modal>
    );
  }
}

export default UploaderModal;
