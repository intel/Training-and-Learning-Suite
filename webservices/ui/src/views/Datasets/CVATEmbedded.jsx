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
import ReactDOM from 'react-dom';
import uuidv1 from 'uuid/v1';
import treeChanges from 'tree-changes';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Axios from '../../ApiToken';

import Loader from '../../components/Loader';

class CVATEmbedded extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: 1920,
      height: 1080,
      key: uuidv1(),
      ratio: 1,
      loaded: false,
      jobId: null,
      taskId: null,
    };

    this.containerRef = React.createRef();
    this.iframeRef = React.createRef();

    this.updateSize = this.updateSize.bind(this);
    this.firstLoadUpdateSize = this.firstLoadUpdateSize.bind(this);
    this.onIframeEvent = this.onIframeEvent.bind(this);
  }

  static propTypes = {
    datasetId: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    fileId: PropTypes.string.isRequired,
    labels: PropTypes.array.isRequired,
  };

  componentDidMount() {
    const { fileId } = this.props;
    this.updateSize();
    Axios.get(`/api/file/${fileId}/cvat`).then(res => {
      this.setState({
        jobId: res.data.jobId,
        taskId: res.data.taskId,
      });
    }).catch((err) => {
      console.log(err)
    });
  }

  componentDidUpdate(prevProps) {
    const { changed } = treeChanges(prevProps, this.props);
    const { datasetId, fileId, labels } = this.props;

    if (changed('changeSizeKey')) {
      this.updateSize();
    }

    if (changed('fileUrl') || changed('datasetId')) {
      this.findCVATTask(datasetId, fileId, labels);
    }
  }

  componentWillUnmount() {

  }

  onIframeEvent(event) {
    if (event.key == "s") {
      const { fileId } = this.props;
      Axios.post(`/api/file/${fileId}/cvatsave`).then(() => { }).catch(() => { });
    }
  }

  updateSize() {
    let newState = {};

    if (this.containerRef.current) {
      const containerWidth = this.containerRef.current.clientWidth;

      newState = {
        key: uuidv1(),
      };

      if (this.iframeRef.current && this.iframeRef.current.contentWindow.document.body) {
        const { scrollWidth } = this.iframeRef.current.contentWindow.document.body;

        const ratio = containerWidth / scrollWidth;
        newState.ratio = ratio;
        newState.width = this.iframeRef.current.contentWindow.document.body.scrollWidth;
        newState.height = this.iframeRef.current.contentWindow.document.body.scrollHeight;
      }

      this.setState({ ...newState });
    }
  }

  firstLoadUpdateSize() {
    const { loaded } = this.state;

    this.iframeRef.current.contentWindow.document.body.addEventListener('keydown', this.onIframeEvent);
    this.iframeRef.current.contentWindow.document.body.addEventListener('mouseup', this.onIframeEvent);

    if (!loaded) {
      this.setState(
        {
          loaded: true,
        },
        () => {
          this.updateSize();
        },
      );
    }
  }

  render() {
    const { width, key, height, ratio, jobId, taskId } = this.state;

    if (!jobId) {
      return <Loader block />;
    }
    return (
      <div ref={this.containerRef} style={{ height }}>
        <iframe
          id="cvatframe"
          key={key}
          ref={this.iframeRef}
          title="cvat"
          src={`/tasks/${taskId}/jobs/${jobId}`}
          height={`${height}px`}
          width={`${width}px`}
          style={{
            zIndex: 9999,
            MsZoom: ratio,
            MozTransform: `scale(${ratio})`,
            MozTransformOrigin: '0 0',
            OTransform: `scale(${ratio})`,
            OTransformOrigin: '0 0',
            WebkitTransform: `scale(${ratio})`,
            WebkitTransformOrigin: ' 0 0',
          }}
          onLoad={this.firstLoadUpdateSize}
          loading="lazy"
        />
      </div>
    );
  }
}

function mapStateToProps() {
  return {};
}

export default connect(mapStateToProps)(CVATEmbedded);
