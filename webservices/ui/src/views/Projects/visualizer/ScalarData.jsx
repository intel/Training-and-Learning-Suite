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
import Axios from '../../../ApiToken';
import { Container, CardHeader, Card, CardBody, Row } from 'reactstrap';
import { showAlert } from '../../../actions';
import { Line } from 'react-chartjs-2';
import * as math from 'mathjs';
// import { CustomTooltips } from "@coreui/coreui-plugin-chartjs-custom-tooltips";

class ScalarData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      charts: null,
    };
    this.retrieveSD = this.retrieveSD.bind(this);
  }

  componentDidMount() {
    this.retrieveSD();
  }

  retrieveSD() {
    const { id, dispatch } = this.props;

    Axios.get(`/api/job/${id}/scalardata/`)
      .then(res => {
        const sd = res.data;
        if (sd !== null) {
          const charts = [];
          for (const key in sd) {
            const dataset = sd[key].datas;
            const ordered = {};
            for (const value in dataset) {
              ordered[dataset[value].x] = dataset[value].y;
            }
            var labels = [];
            var datas = [];
            for (var i in ordered) {
              labels.push(i);
              datas.push(ordered[i]);
            }
            const data = {
              labels: labels,
              datasets: [
                {
                  label: key.split('/').pop(),
                  // fill: false,
                  lineTension: 0.1,
                  backgroundColor: 'rgba(106,90,205,0.4)',
                  borderColor: 'rgba(106,90,205,1)',
                  borderCapStyle: 'butt',
                  borderDash: [],
                  borderDashOffset: 0.0,
                  borderJoinStyle: 'miter',
                  pointBorderColor: 'rgba(0,0,255,1)',
                  pointBackgroundColor: '#fff',
                  pointBorderWidth: 1,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: 'rgba(0,0,255,1)',
                  pointHoverBorderColor: 'rgba(0,0,255,1)',
                  pointHoverBorderWidth: 2,
                  pointRadius: 1,
                  pointHitRadius: 10,
                  data: datas,
                },
              ],
            };
            charts.push(data);
          }
          this.setState({ charts: charts });
        }
      })
      .catch(err => {
        dispatch(showAlert(`Failed to retrive sclar data chart: ${err}`, { variant: 'danger' }));
      });
  }

  render() {
    const { charts } = this.state;
    if (charts !== null) {
      const chartEliminate = charts.map((chart) => {
        const dataset = chart.datasets[0]
        if (dataset['label'] == "accuracy") {
          return true
        } else {
          return false
        }
      })
      return (
        <>
          <div>
            <Container fluid>
              <div className="text-center">
                <Card className="bg-secondary shadow border-0">

                  {chartEliminate[0] == true ? (
                    <CardBody>
                      <Row className="justify-content-center">
                        <div className="h5 mt-4">
                          <i className="ni business_briefcase-24 mr-2" />
                          {charts.map((chart => {
                            const dataset = chart.datasets[0]
                            const data = dataset['data'][0].toFixed(2) * 100;
                            return (
                              <>
                                Accuracy: {data} %
                              </>
                            )
                          }))}
                        </div>
                      </Row>
                    </CardBody>
                  ) : (
                      charts.map(data => {
                        return (
                          <div>
                            <Line ref="chart" data={data} />
                            <hr />
                          </div>
                        );
                      })
                    )}
                </Card>
              </div>
            </Container>
          </div>
        </>
      );

      // console.log(chartEliminate[0])
    } else {
      return (
        <>
          <div>
            <Container fluid>
              <div className="text-center">
                <Card className="bg-secondary shadow border-0">
                  <CardBody>
                    <Row className="justify-content-center">
                      <div className="h5 mt-4">
                        <i className="ni business_briefcase-24 mr-2" />
                          NO SCALAR DATA IS AVAILABLE
                        </div>
                    </Row>
                  </CardBody>
                </Card>
              </div>
            </Container>
          </div>
        </>
      );
    }

  }
}

function mapStateToProps(state) {
  return {
    project: state.project,
  };
}

export default connect(mapStateToProps)(ScalarData);
