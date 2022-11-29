# Copyright (c) 2020 Intel Corporation.

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

FROM ubuntu:focal

ARG http_proxy
ARG https_proxy
ARG no_proxy
ARG socks_proxy
ARG user
ARG uid

ENV DEBIAN_FRONTEND=noninteractive \
    TERM=xterm \
    http_proxy=${http_proxy}   \
    https_proxy=${https_proxy} \
    no_proxy=${no_proxy} \
    socks_proxy=${socks_proxy} \
    LANG='C.UTF-8'  \
    LC_ALL='C.UTF-8'

RUN apt-get update -qq && apt-get install -y -qq wget curl git python2
RUN git config --global url."git@github.com:".insteadOf "https://github.com/"			
RUN	git config --global url."https://github.com/".insteadOf "git://github.com/"
RUN git config --global http.postBuffer 524288000

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt update && apt install -y nodejs build-essential
RUN npm install -g serve npm@latest

ENV USER=${user}
ENV HOME /home/${user}
WORKDIR ${HOME}

RUN groupadd ${user} -g ${uid}
RUN adduser --shell /bin/bash --disabled-password --gecos "" ${user} --gid ${uid} --uid ${uid}

RUN wget https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN mv wait-for-it.sh /usr/bin/
RUN chmod +x /usr/bin/wait-for-it.sh

RUN chown -R ${user}:${user} ${HOME}

RUN mkdir -p ${HOME}/webservices/components \
    && cd ${HOME}/webservices/components \
    && git clone https://github.com/Josebaseba/sails-mongo.git

COPY webservices/ui ${HOME}/webservices/ui
RUN rm -rf ${HOME}/webservices/ui/node_modules
COPY webservices/apiserver ${HOME}/webservices/apiserver
RUN rm -rf ${HOME}/webservices/apiserver/node_modules

RUN rm -rf ${HOME}/webservices/apiserver/rsa.private
RUN rm -rf ${HOME}/webservices/apiserver/config/local.js
RUN ssh-keygen -q -t rsa -b 4096 -N '' -f ${HOME}/webservices/apiserver/rsa.private
RUN chown -R ${user}:${user} ${HOME}/webservices

RUN cd ${HOME}/webservices/apiserver \
    && npm install \
    && npm install jsonpath

RUN cd ${HOME}/webservices/ui \
    && npm install

#Removing build dependencies
RUN apt-get remove -y wget && \
    apt-get remove -y git  && \
    apt-get remove curl -y && \
    apt-get autoremove -y

COPY webservices/startUI.sh ${HOME}/webservices/start.sh
RUN chmod +x ${HOME}/webservices/start.sh
RUN chown -R ${user}:${user} ${HOME}/webservices/start.sh

USER ${user}

EXPOSE 3000
EXPOSE 1337

CMD ["./webservices/start.sh"]