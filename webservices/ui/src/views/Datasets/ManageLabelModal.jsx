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
import { Button, Modal, ModalHeader, ModalBody, Table } from 'reactstrap';
import PropTypes from 'prop-types';

class ManageLabelModal extends React.Component {
  constructor(props) {
    super(props);

    this.deleteLabel = this.deleteLabel.bind(this);
  }

  static propTypes = {
    labels: PropTypes.array,
    modal: PropTypes.bool,
    toggle: PropTypes.func,
  };

  deleteLabel(id) {
    const { axios, onComplete } = this.props;

    axios.delete(`/api/label/${id}`).then(() => {
      onComplete();
    });
  }

  render() {
    const { modal, toggle, labels } = this.props;

    const closeBtn = (
      <Button size="sm" onClick={toggle}>
        <i className=" ni ni-fat-remove" />
      </Button>
    );

    return (
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle} close={closeBtn}>
          Manage Label(s)
        </ModalHeader>
        <ModalBody>
          <Table className="align-items-center table-flush" responsive>
            <thead className="thead-light">
              <tr>
                <th scope="col">Name</th>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {labels.map(label => (
                <tr key={label.id}>
                  <th>{label.name.replace(`${label.dataset}_`, '')}</th>

                  <td className="text-right">
                    <Button
                      color="warning"
                      onClick={() => {
                        this.deleteLabel(label.id);
                      }}
                    >
                      <i className=" ni ni-fat-remove" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ModalBody>
      </Modal>
    );
  }
}

export default ManageLabelModal;
