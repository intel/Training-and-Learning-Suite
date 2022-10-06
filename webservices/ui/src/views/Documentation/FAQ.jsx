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

import React, { useState } from 'react';
import { TabContent, TabPane, Nav, NavItem, NavLink, Card, CardTitle, CardText, Row, Col, Badge, Media, Jumbotron, Container, CardBody } from 'reactstrap';
import classnames from 'classnames';

const FAQ = (props) => {
    const [activeTab, setActiveTab] = useState('1');

    const toggle = tab => {
        if (activeTab !== tab) setActiveTab(tab);
    }

    return (
        <div>
            <div className="header bg-info py-1 py-lg-4" />
            <div className="py-1 py-lg-3">
                <container fluid>
                    <div className="py-1 py-lg-3">
                        <Nav tabs>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: activeTab === '1' })}
                                    onClick={() => { toggle('1'); }}
                                >
                                    DOCKER DOCUMENTATION
          </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={classnames({ active: activeTab === '2' })}
                                    onClick={() => { toggle('2'); }}
                                >
                                    FREQUENTLY ASKED QUESTION
          </NavLink>
                            </NavItem>
                        </Nav>
                        <TabContent activeTab={activeTab}>
                            <TabPane tabId="1">
                                <Row>
                                    <Col sm="12">
                                        <Card body>
                                            <CardTitle>
                                                Use the Docker command line.
                                              </CardTitle>
                                            <CardText>
                                                <p>
                                                    <Badge color="" className="badge-dot">
                                                        <i className="bg-info" />
                  $ docker ps
                    </Badge>
                                                </p>
                                                <p>List containers in TLS2.0 </p>
                                                <i>tls_core</i> <br />
                                                <i>tls_apiui</i><br />
                                                <i>tls_rabbitmq</i><br />
                                                <i>tls_mongo</i><br />
                                                <i>tls_proxy</i><br />
                                                <i>cvat_proxy</i><br />
                                                <i>cvat_ui</i><br />
                                                <i>cvat</i><br />
                                                <i>cvat_db</i><br />
                                                <i>cvat_redis</i><br />

                                            </CardText>
                                            <br />
                                            <CardText>
                                                <p>
                                                    <Badge color="" className="badge-dot">
                                                        <i className="bg-info" />
                  $ docker logs [CONTAINER]
                    </Badge>
                                                </p>
                                                <p>Fetch the logs of a container for debug purpose</p>
                                                <i>EXAMPLE: docker logs tls_core</i> <br />
                                            </CardText>
                                            <br />
                                            <CardText>
                                                <p>
                                                    <Badge color="" className="badge-dot">
                                                        <i className="bg-info" />
                  $ docker-compose up -d
                    </Badge>
                                                </p>
                                                <p>Builds, (re)creates, starts, and attaches to containers for a service.</p>

                                            </CardText>
                                            <br />
                                            <CardText>
                                                <p>
                                                    <Badge color="" className="badge-dot">
                                                        <i className="bg-info" />
                  $ docker-compose stop
                    </Badge>
                                                </p>
                                                <p>Stops running containers without removing them. They can be started again with docker-compose start.</p>

                                            </CardText>
                                            <br />
                                            <CardText>
                                                <p>
                                                    <Badge color="" className="badge-dot">
                                                        <i className="bg-info" />
                  $ docker-compose down
                    </Badge>
                                                </p>
                                                <p>Stops containers and removes containers, networks, volumes, and images created by up.</p>

                                            </CardText>
                                            <br />
                                            <CardText>
                                                <p>
                                                    <Badge color="" className="badge-dot">
                                                        <i className="bg-info" />
                  $ docker system prune -a
                    </Badge>
                                                </p>
                                                <p>Remove all unused images not just dangling ones</p>

                                            </CardText>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>
                            <TabPane tabId="2">
                                <Row>

                                    <Col sm="12">
                                        <Card body>
                                            <CardText>If your question is not covered by the topics below, please contact the administrative. </CardText>
                                            <CardBody>

                                                <div>
                                                    <Jumbotron fluid>
                                                        <Container fluid>
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        1. How to check if TLS2.0 is setup successfully?
</Media>
Please refer to User Guide Section 3.2 Figure 14 that capture the screen for TLS Setup Completion.
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        2.  What does the message "WorkerLostError: Worker Exited Prematurely: signal 11 (SIGSEGV)" mean?
</Media>
Harware RAM is not enough to support the training process. Please increase the RAM of the hardware by refer to the recommended training batch size for each model on the 32GB and 64GB system table on 2.1 subchapter on User Guide.
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        3.  What does the message "Allocation of 3425697792 exceeds of 10% of system memory" mean?
</Media>
Harware RAM is not enough to support the training process. Please increase the RAM of the hardware by refer to the recommended training batch size for each model on the 32GB and 64GB system table on 2.1 subchapter on User Guide.
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        4.  What does the message "ValueError: zero-size array to reduction operation maximum which has no identity" mean?
</Media>
Dataset is not selected. Please select training dataset before start the training
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        5.  What does the message "TypeError: Signature mismatch. Keys must be dtype dtype: dtype: 'string'." mean?
</Media>
Dataset is not selected. Please select training dataset before start the training
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        6.  What does the message "ValueError: With n_samples=1, test_size=0.1 and train_size=None, the resulting train set will be empty. Adjust any of the aforementioned parameters." mean?
</Media>
The input dataset is not enough split into train dataset, test dataset and validate dataset. Please increase dataset
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        7.  Why the label do not appear after done the annotation?
</Media>
Please click on "Open Menu" and "Save Work" button after annotated the dataset. Please refer to user guide step number 6 on 4.2 subchapter for the guide.
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        8.  Can user customize the neural network?
</Media>
Currently in TLS2.0 only support pretrained model that supported in openvino. For full list of neural network topology, please refer to user guide.
</Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        9.  Please take notes the danger/warning alert being prompt while using the TLS2.0.
</Media>
                                                                </Media>
                                                            </Media>
                                                            <br />

                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        10. How do I cross check if all TLS2.0 Dockers are up and running?
</Media>

                                                                        i. $ docker ps
                                                                    <br />

                                                                        ii. Please refer to the  Use the Docker command line tab to check if any docker names are missing


                                                                </Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        11. Why uploaded image do not have label?
</Media>
                                                                    <p>

                                                                        Please use “Assign Label” button to assign them. The correct sequent to assign labels are as below:
<br />

                                                                        i.  Add label from “Add Label” button
                                                                        <br />
                                                                        ii. Click “Upload Image” button. At pop-up dialog, select labels from drop-down list
                                                                        <br />
                                                                        iii. Select images from folder, then drag-drop them
                                                                        <br />
                                                                        iv. Click “Upload # Files” button to upload images into TLS2.0
</p>

                                                                </Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        12. Training Error?
</Media>
i. $ docker logs -f tls_core
                                                                    <br />
ii. Please refer to FREQUENTLY ASKED QUESTION for the solution
                                                                </Media>
                                                            </Media>
                                                            <br />
                                                            <Media className="mt-1">

                                                                <Media body>
                                                                    <Media heading>
                                                                        13. Why cannot create a new remote agent after creating one on the deploy page?
</Media>
Please refresh the page
</Media>
                                                            </Media>
                                                            <br />

                                                        </Container>
                                                    </Jumbotron>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>
                        </TabContent>

                    </div>
                </container>
            </div>


        </div>
    );
}

export default FAQ;

