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
import styled from 'styled-components';

import { Container, Flex } from 'styled-minimal';

const FooterWrapper = styled.footer`
  border-top: 0.1rem solid #ddd;
`;

const Footer = () => (
  <FooterWrapper>
    <Container py={3}>
      <Flex justifyContent="space-between">
        <iframe
          title="GitHub Stars"
          src="https://ghbtns.com/github-btn.html?user=gilbarbara&repo=react-redux-saga-boilerplate&type=star&count=true"
          frameBorder="0"
          scrolling="0"
          width="110px"
          height="20px"
        />
        <iframe
          title="GitHub Follow"
          src="https://ghbtns.com/github-btn.html?user=gilbarbara&type=follow&count=true"
          frameBorder="0"
          scrolling="0"
          width="130px"
          height="20px"
        />
      </Flex>
    </Container>
  </FooterWrapper>
);

export default Footer;
