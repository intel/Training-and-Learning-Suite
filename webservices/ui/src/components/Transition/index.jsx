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
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import transitions, { classNames } from './transitions';

const Transition = ({ children, className, style, transition, ...rest }) => {
  const Component = transitions[transition];

  if (!Component) {
    console.error(`Invalid transition: ${transition}`); //eslint-disable-line no-console
    return null;
  }

  return (
    <TransitionGroup className={className} style={style}>
      {React.Children.map(children, child => (
        <CSSTransition classNames={classNames[transition]} {...rest}>
          <Component>{child}</Component>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
};

Transition.propTypes = {
  appear: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  enter: PropTypes.bool,
  exit: PropTypes.bool,
  style: PropTypes.object,
  timeout: PropTypes.number,
  transition: PropTypes.oneOf(Object.keys(transitions)),
};

Transition.defaultProps = {
  appear: false,
  enter: true,
  exit: true,
  style: null,
  timeout: 300,
  transition: 'fade',
};

export default Transition;
