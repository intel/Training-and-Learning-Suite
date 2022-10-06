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
import Select from 'react-select';
import { connect } from 'react-redux';


class AgentModal extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            form: {
                name: '',
            },
            jobOptions: [],
            submitstatus: false
        };

        this.onChange = this.onChange.bind(this);
        this.onjobChange = this.onjobChange.bind(this);
        this.option = this.option.bind(this)
    }

    static propTypes = {
        modal: PropTypes.bool.isRequired,
        submit: PropTypes.func.isRequired,
        toggle: PropTypes.func.isRequired,
    };

    componentDidMount() {
        this.option()
    }

    onChange(e) {
        const { form } = this.state;

        form[e.target.name] = e.target.value;

        this.setState({
            form,
        });
    }

    onjobChange(type) {
        const { form } = this.state;
        form.job = type.value;

        this.setState({
            form,
        });
    }

    option() {
        const { project } = this.props
        const jobs = project.jobs
        const jobOptions = []
        jobs.map(job => {
            const options = {
                value: `${job.id}`,
                label: `${job.jobName} | ${job.jobModel}`
            }
            jobOptions.push(options)

        })
        this.setState({ jobOptions: jobOptions })
    }


    render() {
        const { modal, toggle, mode, submit } = this.props;
        const { form, jobOptions, submitstatus } = this.state;

        const modalTile = 'Add New Agent';

        let btnTitle = 'Create';

        if (mode === 'edit') {
            btnTitle = 'Save';
        }
        return (
            <Modal isOpen={modal} toggle={toggle}>
                <ModalHeader toggle={toggle}>{modalTile}</ModalHeader>
                <ModalBody>
                    <Form>
                        <div className="pl-lg-4">
                            <Row>
                                <Col lg="12">
                                    <FormGroup>
                                        <label className="form-control-label" htmlFor="name">
                                            Name
                    </label>
                                        <Input
                                            className="form-control-alternative"
                                            id="name"
                                            name="name"
                                            type="text"
                                            onChange={this.onChange}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col lg="12">
                                    <FormGroup>
                                        <label className="form-control-label" htmlFor="description">
                                            UUID
                    </label>
                                        <Input
                                            className="form-control-alternative"
                                            id="uuid"
                                            name="uuid"
                                            type="text"
                                            onChange={this.onChange}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col lg="12">
                                    <FormGroup>
                                        <label className="form-control-label" htmlFor="type">
                                            Jobs
                    </label>
                                        <Select options={jobOptions} onChange={this.onjobChange} />
                                    </FormGroup>
                                </Col>
                            </Row>

                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button className="mt-4" color={submitstatus ? "default" : "primary"} disabled={submitstatus} type="button" onClick={() => {
                        submit(form);
                        this.setState({ submitstatus: true })
                    }}>
                        <span className="btn-inner--icon">
                            <i className="fas fa-paper-plane fa-lg-fw"></i>
                        </span>
                        <span className="btn-inner--text">{mode == "edit" ? "Save" : "Submit"}</span>
                    </Button>


                    <Button className="mt-4" color="secondary" type="button" onClick={toggle}>
                        <span className="btn-inner--icon">
                            <i className="fas fa-window-close fa-lg-fw"></i>
                        </span>
                        <span className="btn-inner--text">Close</span>
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }
}

function mapStateToProps(state) {
    return {
        project: state.project,
    };
}

export default connect(mapStateToProps)(AgentModal);
