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
import { Badge, Button, Container, Row, Col, Card, CardHeader, CardBody, Label } from 'reactstrap';
import treeChanges from 'tree-changes';

import Select, { components } from 'react-select';
import Gallery from 'react-grid-gallery';

import PlainHeader from 'components/Headers/PlainHeader';
import axios from '../../ApiToken';
import { connect } from 'react-redux';
import { STATUS } from 'constants/index';
import LabelModal from './LabelModal';
import UploaderModal from './UploaderModal';

import ManageLabelModal from './ManageLabelModal';
import AssignModal from './AssignModal';
import { datasetRetrieve, showAlert } from '../../actions';

class Dataset extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uploaderModal: false,
      labelModal: false,
      filteredFiles: [],
      eitherOneLabelType: "empty",
      selectedLabels: [],
      manageLabelModal: false,
      assignModal: false,
    };

    this.toggleUploaderModal = this.toggleUploaderModal.bind(this);
    this.toggleLabelModal = this.toggleLabelModal.bind(this);
    this.submitLabel = this.submitLabel.bind(this);
    this.formatGalleryImages = this.formatGalleryImages.bind(this);
    this.toggleManageLabelModal = this.toggleManageLabelModal.bind(this);
    this.filterFile = this.filterFile.bind(this);
    this.onLabelChange = this.onLabelChange.bind(this);
    this.onSelectImage = this.onSelectImage.bind(this);
    this.onSelectClearClick = this.onSelectClearClick.bind(this);
    this.toggleAssignModal = this.toggleAssignModal.bind(this);
    this.onSelectDelete = this.onSelectDelete.bind(this);
    this.syncLabels = this.syncLabels.bind(this);
  }

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    files: PropTypes.array,
    history: PropTypes.object,
    labels: PropTypes.array,
    match: PropTypes.shape({
      params: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
    }),
  };

  componentDidMount() {
    let self = this;
    
    const { dispatch, match, labels } = this.props;
    const datasetId = match.params.id;

    dispatch(showAlert(`Updating Images ... Wait about 5 secs`, { variant: 'warning', timeout: 5 }));
    axios.get(`/api/labelsync/${datasetId}/`).then(() => {

    }).catch(()=>{}).finally(() => {
      setTimeout(function () {
        dispatch(datasetRetrieve(axios, datasetId));
      }, 2500);
    });    
  }

  componentDidUpdate(prevProps) {
    const { changed, changedTo } = treeChanges(prevProps, this.props);

    if (changed('files') || changed('labels') || changedTo('datasetStatus', STATUS.SUCCESS)) {
      this.filterFile();

      let { eitherOneLabelType } = this.state;
      const { match, labels } = this.props;
      const datasetId = match.params.id;
      
      axios.get(`/api/labelupdate/${datasetId}/`).then(() => {}).catch(()=>{}).finally(() => {
        if(labels.length > 0) {
          if(labels[0].type === "wholeImg")
            eitherOneLabelType = "wholeImg";
          else
            eitherOneLabelType = "boxImg";
        } else {
          eitherOneLabelType = "all";
        }

        this.setState({eitherOneLabelType});
      });
    }
  }

  syncLabels() {
    const { dispatch, match } = this.props;
    const datasetId = match.params.id;

    dispatch(showAlert(`Syncing labels. Please wait.`, { variant: 'warning', timeout: 60 }));
    axios.get(`/api/filesync/` + datasetId + `/save`).then(res => {
      dispatch(
        showAlert(`Synced labels successfully`, { variant: 'success', timeout: 15 }),
      );
      dispatch(datasetRetrieve(axios, datasetId));
    });
  }

  submitLabel(form) {
    const { match, dispatch } = this.props;
    const datasetId = match.params.id;

    axios
      .post('/api/label', {
        name: form.name,
        type: form.type,
        dataset: datasetId,
      })
      .then(() => {
        axios.get(`/api/labelupdate/${datasetId}/`).then(() => {}).catch(()=>{}).finally(() => {
          dispatch(datasetRetrieve(axios, datasetId));
        });
        this.toggleLabelModal();
      })
      .catch(err => {
        if (err.response.data.code === 'E_UNIQUE') {
          dispatch(showAlert('The label name already exists', { variant: 'warning' }));
          return;
        }
        dispatch(showAlert('Failed to create label', { variant: 'danger' }));
      });
  }

  toggleUploaderModal() {
    const { uploaderModal } = this.state;

    this.setState({
      uploaderModal: !uploaderModal,
    });
  }

  toggleManageLabelModal() {
    const { manageLabelModal } = this.state;

    this.setState({
      manageLabelModal: !manageLabelModal,
    });
  }

  toggleLabelModal() {
    let { labelModal } = this.state;
    this.setState({
      labelModal: !labelModal
    });
  }

  _formatOptionDisplay(props) {
    const colorForType = {
      wholeImg: 'primary',
      box: 'success',
      segmentation: 'danger',
    };

    return (
      <Row>
        <Col md="6">
          <components.Option {...props} />
        </Col>
        <Col md="auto">
          <Badge color={colorForType[props.data.type]}>{props.data.type}</Badge>
        </Col>
      </Row>
    );
  }

  _formatGroupOptions = labels => {
    const wholePictureLabelOptions = [];
    let groupedOptions = [
      {
        label: 'Whole Picture',
        options: wholePictureLabelOptions,
      },
    ];

    if (labels.length > 0) {
      const otherLabelOptions = [];

      labels.map(label => {
        const labelName = label.name.replace(`${label.dataset}_`, '');

        if (label.type === 'wholeImg') {
          wholePictureLabelOptions.push({
            value: label.id,
            label: labelName,
            type: label.type,
          });
        } else {
          otherLabelOptions.push({
            value: label.id,
            label: labelName,
            type: label.type,
          });
        }
        return null;
      });

      groupedOptions = [
        {
          label: 'Whole Picture',
          options: wholePictureLabelOptions,
        },
        {
          label: 'Others',
          options: otherLabelOptions,
        },
      ];
    }

    return groupedOptions;
  };

  formatGalleryImages = (files, datasetId) => {
    const { labels } = this.props;
    return files
      .map(file => {
        const fileLabels = file.labels
          .map(label => {
            const labelDetail = labels.find(labelPtr => labelPtr.id === label.label);

            if (labelDetail) {
              return {
                // value: labelDetail.id,
                value: labelDetail.name.replace(`${labelDetail.dataset}_`, ''),
                title: labelDetail.name.replace(`${labelDetail.dataset}_`, ''),
              };
            }
            return null;
          })
          .filter(label => label !== null);
        return {
          src: `/api/dataset/${datasetId}/file/${file.id}`,
          thumbnail: `/api/dataset/${datasetId}/file/${file.id}`,
          thumbnailWidth: file.width,
          thumbnailHeight: file.height,
          tags: fileLabels,
          isSelected: file.isSelected,
        };
      })
      .filter(e => e != null);
  };

  filterFile() {
    const { files } = this.props;
    const { selectedLabels } = this.state;
    let filteredFiles = [...files];
    // filter selected label only
    if (selectedLabels && selectedLabels.length > 0) {
      filteredFiles = files.filter(file => {
        const matchLabel = file.labels.find(labelPtr => {
          const foundLabel = selectedLabels.find(
            selectedLabelPtr => labelPtr.label === selectedLabelPtr.value,
          );

          return typeof foundLabel !== 'undefined';
        });

        if (typeof matchLabel === 'undefined') {
          return false;
        }
        return true;
      });
    }

    this.setState({
      filteredFiles,
    });
  }

  onLabelChange(selectedLabels) {
    this.setState(
      {
        selectedLabels,
      },
      () => {
        this.filterFile();
      },
    );
  }

  onSelectImage(index) {
    const { filteredFiles } = this.state;

    const filteredFile = { ...filteredFiles[index] };

    filteredFile.isSelected = !filteredFiles[index].isSelected;

    filteredFiles[index] = filteredFile;

    this.setState({
      filteredFiles,
    });
  }

  onSelectClearClick() {
    let { filteredFiles } = this.state;

    filteredFiles = filteredFiles.map(file => {
      file.isSelected = false;
      return file;
    });

    this.setState({
      filteredFiles,
    });
  }

  toggleAssignModal() {
    const { assignModal } = this.state;
    this.setState({
      assignModal: !assignModal,
    });
  }

  async onSelectDelete() {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure to delete the selected file(s)?')) {
      return;
    }

    const { filteredFiles } = this.state;
    const { dispatch, match } = this.props;

    const datasetId = match.params.id;

    const selectedFiles = filteredFiles.filter(file => file.isSelected);

    try {
      await Promise.all(
        selectedFiles.map(
          selectedFile =>
            new Promise((res, rej) => {
              axios
                .delete(`/api/uploadedfile/${selectedFile.id}`)
                .then(() => {
                  res();
                })
                .catch(() => {
                  rej();
                });
            }),
        ),
      );

      dispatch(
        showAlert(`Deleted ${selectedFiles.length} file(s) successfully.`, { variant: 'warning' }),
      );

      dispatch(datasetRetrieve(axios, datasetId));
    } catch (e) {
      dispatch(showAlert('Failed to delete the file(s)', { variant: 'danger' }));
    }
  }

  render() {
    const { match, history, labels, dispatch, files } = this.props;
    const {
      uploaderModal,
      labelModal,
      filteredFiles,
      eitherOneLabelType,
      selectedLabels,
      manageLabelModal,
      assignModal,
    } = this.state;
    const datasetId = match.params.id;
    const groupedOptions = this._formatGroupOptions(labels);
    const images = this.formatGalleryImages(filteredFiles, datasetId);

    const selectedFiles = filteredFiles.filter(file => file.isSelected);

    return (
      <>
        <PlainHeader />
        <Container className="mt--9" fluid>
          <Card className=" shadow">
            <CardHeader className=" bg-transparent">
              <Row>
                <Col xs="6">
                  <h3 className=" mb-0">Dataset Id: {datasetId}</h3>
                </Col>

                <Col xs="6" className="clearfix">
                  <Button
                    className="mr-2 float-right"
                    color="primary"
                    onClick={() => {
                      this.toggleUploaderModal();
                    }}
                  >
                    Upload Images
                  </Button>
                </Col>
              </Row>
              <hr />
              <Row>
                <Col lg="6" md="6">
                  <Row>
                    <Col md="2">
                      <Label>Filter:</Label>
                    </Col>
                    <Col>
                      <Select
                        options={groupedOptions}
                        values={selectedLabels}
                        isMulti={true}
                        onChange={this.onLabelChange}
                        components={{ Option: this._formatOptionDisplay }}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col>
                  <Button
                    color="primary"
                    onClick={() => {
                      this.toggleLabelModal();
                    }}
                  >
                    Add Label
                  </Button>
                </Col>
                <Col>
                  <Button
                    color="primary"
                    onClick={() => {
                      this.toggleManageLabelModal();
                    }}
                  >
                    Manage Label
                  </Button>
                </Col>
              </Row>
              {selectedFiles.length > 0 && (
                <>
                  <hr />
                  <Row>
                    <Col md="auto">Selected: {selectedFiles.length}</Col>

                    <Col md="2">
                      <Button color="primary" onClick={this.toggleAssignModal}>
                        Assign Label
                      </Button>
                    </Col>

                    <Col md="2">
                      <Button color="danger" onClick={this.onSelectDelete}>
                        Delete
                      </Button>
                    </Col>

                    <Col md="2" className="float-right">
                      <Button color="warning" onClick={this.onSelectClearClick}>
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </>
              )}
            </CardHeader>
            <CardBody>
              {images.length > 0 ? (
                <Gallery
                  images={images}
                  onSelectImage={this.onSelectImage}
                  onClickThumbnail={index => {
                    const filePtr = files[index];
                    if(eitherOneLabelType === "boxImg")
                      history.push(`/datasets/${datasetId}/annotation/${filePtr.id}`);
                  }}
                />
              ) : (
                <div className="text-uppercase h3 font-weight-300">
                  <i className="ni location_pin mr-2" /> Please Wait ..
                </div>
              )
              }

            </CardBody>
          </Card>
        </Container>

        <LabelModal
          toggle={this.toggleLabelModal}
          modal={labelModal}
          submit={this.submitLabel}
          eitherOneLabelType={eitherOneLabelType}
        />

        <UploaderModal
          modal={uploaderModal}
          toggle={this.toggleUploaderModal}
          datasetId={datasetId}
          onComplete={() => {
            dispatch(datasetRetrieve(axios, datasetId));
          }}
          options={groupedOptions}
          toggleLabelModal={this.toggleLabelModal}
        />

        <ManageLabelModal
          modal={manageLabelModal}
          labels={labels}
          onComplete={() => {
            axios.get(`/api/labelupdate/${datasetId}/`).then(() => {}).catch(()=>{}).finally(() => {
              dispatch(datasetRetrieve(axios, datasetId));
            });
          }}
          toggle={this.toggleManageLabelModal}
          axios={axios}
        />

        <AssignModal
          modal={assignModal}
          toggle={this.toggleAssignModal}
          options={groupedOptions}
          selectedFiles={selectedFiles}
          axios={axios}
          onComplete={() => {
            dispatch(datasetRetrieve(axios, datasetId));
          }}
        />
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    files: state.dataset.files,
    labels: state.dataset.labels,
    datasetId: state.dataset.id,
    datasetStatus: state.dataset.status,
  };
}

export default connect(mapStateToProps)(Dataset);
