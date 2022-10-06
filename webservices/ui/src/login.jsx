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

/*!

=========================================================
* Argon Dashboard React - v1.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from 'react';

// reactstrap components
import {
  Button,
  Card,
  CardBody,
  FormGroup,
  Form,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Row,
  Col,
  Container,
} from 'reactstrap';
import Axios from './ApiToken';

import { connect } from 'react-redux';
import { showAlert } from 'actions/index';
import { login, logout } from 'actions/index';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      submit: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(logout());
  }

  handleChange(e) {
    e => e.preventDefault();
    const name = e.target.name;
    const value = e.target.value;
    if (name == 'username') {
      this.setState({ username: value });
    } else if (name == 'password') {
      this.setState({ password: value });
    }
  }

  submit() {
    const { username, password } = this.state;
    const { dispatch } = this.props;

    Axios.post('api/login', { username: username, password: password }).then(res => {
      this.setState({ submit: true });
      const message = res.data.message;
      if (
        message == 'Username not found' ||
        message == 'Invalid Password' ||
        message == 'Missing credentials'
      ) {
        dispatch(logout());
        dispatch(showAlert(`${message}`, { variant: 'danger' }));
        this.setState({ submit: false });
      } else if (message == 'Login Succesful') {
        localStorage.setItem('jwttoken', res.data.token);
        dispatch(login(Axios, 'success'));
      } else {
        dispatch(showAlert(`${message}`, { variant: 'danger' }));
        this.setState({ submit: false });
      }
    });
  }

  render() {
    const { username, password, submit } = this.state;
    return (
      <>
        <div className="header bg-default">
          <div className="header bg-gradient-info py-7 py-lg-8">
            <Container fluid>
              <div className="separator separator-bottom separator-skew zindex-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  version="1.1"
                  viewBox="0 0 2560 100"
                  x="0"
                  y="0"
                >
                  <polygon className="fill-default" points="2560 0 2560 100 0 100" />
                </svg>
              </div>
              <div className="header-body text-center mb-7">
                <Row className="justify-content-center">
                  <Col lg="5" md="6">
                    <h1 className="text-white">Welcome!</h1>
                    <p className="text-lead text-light">TRAINING AND LEARNING SUITE 2.0</p>
                  </Col>
                </Row>
              </div>
            </Container>

            <Row className="justify-content-center">
              <Col lg="5" md="7">
                <Card className="bg-secondary shadow border-0">
                  <CardBody className="px-lg-5 py-lg-5">
                    <div className="text-center text mb-4">
                      <small>sign in with credentials</small>
                    </div>
                    <Form role="form">
                      <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                          <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                              <i className="ni ni-email-83" />
                            </InputGroupText>
                          </InputGroupAddon>
                          <Input
                            placeholder="User Name"
                            type="email"
                            autoComplete="new-username"
                            name="username"
                            onChange={this.handleChange}
                            value={username}
                          />
                        </InputGroup>
                      </FormGroup>
                      <FormGroup>
                        <InputGroup className="input-group-alternative">
                          <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                              <i className="ni ni-lock-circle-open" />
                            </InputGroupText>
                          </InputGroupAddon>
                          <Input
                            placeholder="Password"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            onChange={this.handleChange}
                            value={password}
                          />
                        </InputGroup>
                      </FormGroup>
                      <div className="text-center">
                        {submit == false ? (
                          <Button
                            className="my-4"
                            color="primary"
                            type="button"
                            onClick={this.submit}
                          >
                            Sign in
                          </Button>
                        ) : null}
                      </div>
                    </Form>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user,
  };
}

export default connect(mapStateToProps)(Login);
