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
import SVG from 'react-inlinesvg';
import styled from 'styled-components';
import { utils } from 'styled-minimal';

const IconWrapper = styled(SVG)`
  display: inline-block;
  line-height: 0;

  svg {
    height: auto;
    max-height: 100%;
    width: ${({ width }) => utils.px(width)};
  }
`;

const Icon = ({ name, ...rest }) => (
  <IconWrapper src={`${process.env.PUBLIC_URL}/media/icons/${name}.svg`} {...rest} />
);

Icon.propTypes = {
  name: PropTypes.oneOf([
    'bell-o',
    'bell',
    'bolt',
    'check-circle-o',
    'check-circle',
    'check',
    'dot-circle-o',
    'exclamation-circle',
    'question-circle-o',
    'question-circle',
    'sign-in',
    'sign-out',
    'times-circle-o',
    'times-circle',
    'times',
  ]).isRequired,
  width: PropTypes.number,
};

Icon.defaultProps = {
  width: 20,
};

export default Icon;
