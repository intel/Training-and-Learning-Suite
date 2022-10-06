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
import { connect } from 'react-redux';
import styled from 'styled-components';
import { utils } from 'styled-minimal';

import { hideAlert } from 'actions';

import Transition from 'components/Transition';
import Alert from 'components/Alert';

const Base = styled.div`
  position: fixed;
  z-index: 1000;

  > div {
    > * + * {
      margin-top: ${utils.spacer(3)};
    }
  }
`;

const TopLeft = styled(Base)`
  left: ${utils.spacer(3)};
  top: ${utils.spacer(3)};
  width: 26rem;

  ${/* sc-custom '@media-query' */ utils.responsive({
    md: `
      width: 32rem;
    `,
  })};
`;

const TopRight = styled(Base)`
  right: ${utils.spacer(3)};
  top: ${utils.spacer(3)};
  width: 26rem;

  ${/* sc-custom '@media-query' */ utils.responsive({
    md: `
      width: 32rem;
    `,
  })};
`;

const BottomLeft = styled(Base)`
  bottom: ${utils.spacer(3)};
  left: ${utils.spacer(3)};
  width: 26rem;

  ${/* sc-custom '@media-query' */ utils.responsive({
    md: `
      width: 32rem;
    `,
  })};
`;

const BottomRight = styled(Base)`
  bottom: ${utils.spacer(3)};
  right: ${utils.spacer(3)};
  width: 26rem;

  ${/* sc-custom '@media-query' */ utils.responsive({
    md: `
      width: 32rem;
    `,
  })};
`;

const SystemAlertsWrapper = styled.div`
  pointer-events: none;
  position: fixed;
  z-index: 1000;
`;

export class SystemAlerts extends React.PureComponent {
  constructor(props) {
    super(props);

    this.timeouts = {};
  }

  static propTypes = {
    app: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  componentDidUpdate() {
    const {
      app: { alerts },
      dispatch,
    } = this.props;

    /* istanbul ignore else */
    if (alerts.length) {
      alerts.forEach(d => {
        if (d.timeout && !this.timeouts[d.id]) {
          this.timeouts[d.id] = setTimeout(() => {
            dispatch(hideAlert(d.id));
          }, d.timeout * 1000);
        }
      });
    }
  }

  componentWillUnmount() {
    Object.keys(this.timeouts).forEach(d => {
      clearTimeout(this.timeouts[d]);
    });
  }

  handleClick = e => {
    e.preventDefault();
    const { dataset } = e.currentTarget;
    const { dispatch } = this.props;

    dispatch(hideAlert(dataset.id));
  };

  renderAlerts(position) {
    const { app } = this.props;
    const items = app.alerts.filter(d => d.position === position);

    if (!items.length) {
      return null;
    }

    return items.map((d, index) => (
      <Alert
        key={index}
        id={d.id}
        icon={d.icon}
        handleClickClose={this.handleClick}
        variant={d.variant}
      >
        {d.message}
      </Alert>
    ));
  }

  render() {
    return (
      <SystemAlertsWrapper key="SystemAlerts">
        <TopLeft>
          <Transition transition="slideDown">{this.renderAlerts('top-left')}</Transition>
        </TopLeft>
        <TopRight>
          <Transition transition="slideDown">{this.renderAlerts('top-right')}</Transition>
        </TopRight>
        <BottomLeft>
          <Transition transition="slideUp">{this.renderAlerts('bottom-left')}</Transition>
        </BottomLeft>
        <BottomRight>
          <Transition transition="slideUp">{this.renderAlerts('bottom-right')}</Transition>
        </BottomRight>
      </SystemAlertsWrapper>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state) {
  return { app: state.app };
}

export default connect(mapStateToProps)(SystemAlerts);
