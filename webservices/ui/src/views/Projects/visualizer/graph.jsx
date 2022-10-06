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

import {
    Button,
    CardSubtitle,
    Card,
    CardHeader,
    CardBody,
    CardFooter,

} from "reactstrap";

import ConfusionMatrix from './ConfusionMatrix'
import ScalarData from './ScalarData'
import Loader from '../../../components/Loader';
import { STATUS } from '../../../constants';


class Visualizer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            retrieveCM: false,
            retriveScalarData: false,
            id: null
        };
        this.retrieveJob = this.retrieveJob.bind(this)
        this.displayButton = this.displayButton.bind(this)


    }

    componentDidMount() {
        this.retrieveJob()
    }
    retrieveJob() {
        const urlPathname = window.location.pathname
        const split = urlPathname.split("/")
        const jobId = split[2]
        this.setState({ id: jobId })
    }

    displayButton(type) {
        if (type == "cm") {
            this.setState({ retrieveCM: true })
            this.setState({ retriveScalarData: false })
        } else {
            this.setState({ retriveScalarData: true })
            this.setState({ retrieveCM: false })
        }
    }

    render() {
        const { retrieveCM, id, retriveScalarData } = this.state;
        return (
            <>
                <div />
                <Card className=" shadow">
                    <CardHeader className=" bg-transparent border-0">
                        <div className="text-center">
                            <div className="h5 font-weight-300">
                                <i className="ni location_pin mr-2" />
                                <h3>
                                    Visualizer
                                    </h3>
                            </div>
                        </div>
                    </CardHeader>
                    <CardSubtitle>
                        <div className="text-center">
                            <Button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                    this.displayButton("cm")
                                }}

                            >
                                Confusion Matrix
                    </Button>

                            <Button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                    this.displayButton("sd")
                                }}

                            >
                                Metrics Visualizer
                    </Button>
                        </div>
                    </CardSubtitle>
                    <CardBody>
                        {retrieveCM == true ? <ConfusionMatrix id={id} /> : null}
                        {retriveScalarData == true ? <ScalarData id={id} /> : null}
                    </CardBody>
                    <CardFooter>
                        <Button outline
                            className="float-right"
                            color="primary"
                            href={`/projects/`}
                            size="sm"
                        >
                            Return
                    </Button>
                    </CardFooter>
                </Card>
            </>
        );
    }
}

function mapStateToProps(state) {
    return {
        project: state.project,
    };
}

export default connect(mapStateToProps)(Visualizer);
