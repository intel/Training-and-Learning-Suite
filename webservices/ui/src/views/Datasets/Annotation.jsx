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
import { Alert, Container, Button, Row, Col } from 'reactstrap';
import uuidv1 from 'uuid/v1';
import PlainHeader from 'components/Headers/PlainHeader';
import Axios from '../../ApiToken';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ImageGallery from 'react-image-gallery';
import { datasetRetrieve } from '../../actions';
import CVATEmbedded from './CVATEmbedded';

import 'react-image-gallery/styles/scss/image-gallery.scss';
import '../../assets/scss/custom.scss';

class Annotation extends React.Component {
  constructor(props) {
    super(props);

    const { match } = props;
    const datasetId = match.params.id;
    this.state = {
      key: uuidv1(),
      datasetId
    }

    this.formatGalleryImageOption = this.formatGalleryImageOption.bind(this);
    this.imageClicked = this.imageClicked.bind(this);
  }

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    files: PropTypes.array,
    history: PropTypes.object,
    labels: PropTypes.array,
    match: PropTypes.shape({
      params: PropTypes.shape({
        fileId: PropTypes.string,
        id: PropTypes.string.isRequired,
      }),
    }),
  };

  componentDidMount() {
    const { dispatch, match, files } = this.props;
    const { datasetId } = this.state;
    const { fileId } = match.params;

    let index = 0;
    if (fileId) {
      const filePtr = files.find(file => file.id === fileId);
      index = files.indexOf(filePtr);
    }

    this.setState({
      index,
      datasetId
    });

    dispatch(datasetRetrieve(Axios, datasetId));
  }

  imageClicked(event, cindex) {
    this.setState({ index: cindex });
  }

  formatGalleryImageOption(files, datasetId) {
    const re = /(?:\.([^.]+))?$/;

    return files.map(file => {
      const extension = re.exec(file.name)[1];

      return {
        original: `/api/dataset/${datasetId}/file/${file.id}`,
        thumbnail: `/api/dataset/${datasetId}/file/${file.id}`,
        extension,
        fileId: file.id,
      };
    });
  }

  render() {
    const { history, files, labels } = this.props;
    const { key, index, datasetId } = this.state;

    return (
      <>
        <PlainHeader />

        <Container className="mt--9" fluid>
          <Row>
            <Col md="auto">
              <Button
                color="primary"
                onClick={() => {
                  history.push(`/datasets/${datasetId}`);
                }}
              >
                Back
              </Button>
            </Col>
            <Col xs="12" md="6">
              <Alert color="warning">
                <strong>Warning!</strong> Make sure you save your progress before navigate to
                another picture or to another page! <br />Press <b>CTRL + S</b> to save your work !
              </Alert>
            </Col>
          </Row>

          <Row>
            <Col xs="12">
              <ImageGallery
                showNav={false}
                lazyLoad={true}
                infinite={false}
                thumbnailPosition="top"
                showIndex={true}
                disableKeyDown={true}
                showPlayButton={false}
                startIndex={index}
                items={this.formatGalleryImageOption(files, datasetId)}
                renderItem={e => (
                  <CVATEmbedded
                    datasetId={datasetId}
                    labels={labels}
                    changeSizeKey={key}
                    fileUrl={e.original}
                    extension={e.extension}
                    fileId={e.fileId}
                  />
                )}
              />
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    files: state.dataset.files,
    labels: state.dataset.labels,
    datasetId: state.dataset.id,
  };
}

export default connect(mapStateToProps)(Annotation);
