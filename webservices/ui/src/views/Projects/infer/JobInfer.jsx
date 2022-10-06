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
import { Button, Table, Progress, Badge } from 'reactstrap';
import Loader from '../../../components/Loader';
import { STATUS } from '../../../constants';
import DropZone from './dropZone';
import Axios from '../../../ApiToken';

class RenderJob extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inferReady: {},
      renderInfer: false,
      jobId: null,
      jobs: null,
    };

    this.retrieveProject = this.retrieveProject.bind(this);
    this.displayStatus = this.displayStatus.bind(this);
  }

  componentDidMount() {
    this.retrieveProject();
    const upInterval = setInterval(() => {
      this.retrieveProject();
    }, 1000);
    this.setState({ upInterval });
  }

  componentWillUnmount() {
    const { upInterval } = this.state;
    clearInterval(upInterval);
  }

  retrieveProject() {
    const { project } = this.props;
    if (project.status !== STATUS.SUCCESS) {
      return <Loader />;
    }

    Axios.get(`/api/project/${project.id}`).then(res => {
      const jobs = res.data.jobs;
      let inferReady = {};
      for (var index in jobs) {
        if (jobs[index].status == 'COMPLETE') {
          inferReady[jobs[index].id] = true;
        }
      }
      this.setState({ jobs: jobs, inferReady: inferReady });
    });
  }

  displayStatus(item) {
    const status = item.status;
    if (status == 'SUCCESS' || status == 'COMPLETE') {
      return (
        <Badge color="" className="badge-dot mr-4">
          <i className="bg-success" />
          {status}
        </Badge>
      );
    } else if (status == 'FAILURE') {
      <Badge color="" className="badge-dot mr-4">
        <i className="bg-danger" />
        {status}
      </Badge>;
    } else if (status == 'PENDING' || status == 'PROCESS') {
      <Badge color="" className="badge-dot mr-4">
        <i className="bg-info" />
        {status}
      </Badge>;
    } else if (status == 'STOP' || status == 'REVOKED' || status == 'UNDEFINED') {
      <Badge color="" className="badge-dot mr-4">
        <i className="bg-warning" />
        {status}
      </Badge>;
    } else {
      <Badge color="" className="badge-dot mr-4">
        <i className="bg-default" />
        NO STATUS
      </Badge>;
    }
  }

  render() {
    const { renderInfer, inferReady, jobId, jobs } = this.state;
    if (jobs !== null) {
      return (
        <>
          {renderInfer == true ? (
            <DropZone id={jobId} />
          ) : (
            <Table className="align-items-center table-flush" responsive>
              <thead className="thead-light">
                <tr>
                  <th scope="col">Selection</th>
                  <th scope="col">Jobs</th>
                  <th scope="col">Model</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map(job => {
                  return (
                    <tr key={job.id}>
                      <th scope="row">
                        <Button
                          outline
                          color="primary"
                          disabled={!inferReady[job.id]}
                          onClick={() => {
                            this.setState({ renderInfer: true });
                            this.setState({ jobId: job.id });
                          }}
                        >
                          Infer
                        </Button>
                      </th>
                      <td>{job.jobName}</td>
                      <td>{job.jobModel}</td>
                      <td>{this.displayStatus(job.jobStatus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </>
      );
    } else {
      return <Loader />;
    }
  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(RenderJob);
