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
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
} from 'reactstrap';
import PropTypes from 'prop-types';

class DatasetModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      form: {
        name: '',
      },
    };

    this.onChange = this.onChange.bind(this);
  }

  static propTypes = {
    modal: PropTypes.bool.isRequired,
    // mode: PropTypes.string.isRequired,
    submit: PropTypes.func.isRequired,
    toggle: PropTypes.func.isRequired,
  };

  onChange(e) {
    const { form } = this.state;

    form[e.target.name] = e.target.value;

    this.setState({
      form,
    });
  }

  render() {
    // const { modal, toggle, mode, submit } = this.props;
    const { modal, toggle, submit } = this.props;
    const { form } = this.state;

    const modalTile = 'Add New Dataset';

    let btnTitle = 'Create';

    // if (mode === 'edit') {
    //   btnTitle = 'Save';
    // }

    return (
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>{modalTile}</ModalHeader>
        <ModalBody>
          <Form>
            <div className="pl-lg-4">
              <Row>
                <Col lg="12">
                  <FormGroup>
                    <label className="form-control-label" htmlFor="datasetName">
                      Dataset Name
                    </label>
                    <Input
                      className="form-control-alternative"
                      id="datasetName"
                      name="name"
                      type="text"
                      onChange={this.onChange}
                    />
                  </FormGroup>
                </Col>
              </Row>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => {
              submit(form);
            }}
          >
            {btnTitle}
          </Button>
          <Button color="secondary" onClick={toggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

export default DatasetModal;
