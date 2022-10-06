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
import { Button, Modal, ModalHeader, ModalBody, Table, ModalFooter } from 'reactstrap';
import Select from 'react-select';

import PropTypes from 'prop-types';

class AssignModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      labels: [],
    };

    this.onLabelSelectChange = this.onLabelSelectChange.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.assignLabel = this.assignLabel.bind(this);
  }

  toggleModal() {
    const { toggle, onComplete } = this.props;
    this.setState(
      {
        labels: [],
      },
      () => {
        onComplete();
        toggle();
      },
    );
  }

  async assignLabel(labels, selectedFiles) {
    const { axios } = this.props;

    // [[promise]]
    await Promise.all(
      selectedFiles
        .map(selectedFile => {
          // get [promise]
          labels.map(
            label =>
              new Promise((res, rej) => {
                axios
                  .post('/api/labeldata', {
                    file: selectedFile.id,
                    label: label.value,
                  })
                  .then(() => {
                    res();
                  })
                  .catch(() => {
                    rej();
                  });
              }),
          );
        })
        .reduce((prev, cur) => prev.concat(cur), []),
    );

    this.toggleModal();
  }

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

  onLabelSelectChange(labels) {
    this.setState({
      labels,
    });
  }

  render() {
    const { labels } = this.state;
    const { modal, options, selectedFiles } = this.props;

    const closeBtn = (
      <Button size="sm" onClick={this.toggleModal}>
        <i className=" ni ni-fat-remove" />
      </Button>
    );

    return (
      <Modal isOpen={modal} toggle={this.toggleModal}>
        <ModalHeader toggle={this.toggleModal} close={closeBtn}>
          Assign label(s) for the selected {selectedFiles.length} image(s)
        </ModalHeader>
        <ModalBody>
          <Select
            options={this._filterLabelOptions(options)}
            isMulti={true}
            value={labels}
            onChange={this.onLabelSelectChange}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => {
              this.assignLabel(labels, selectedFiles);
            }}
          >
            Assign
          </Button>
          <Button color="secondary" onClick={this.toggleModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default AssignModal;
