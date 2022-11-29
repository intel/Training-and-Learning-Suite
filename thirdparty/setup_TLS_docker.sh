#!/bin/bash

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

scriptdir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )
tmpdir=$(mktemp -d -t tls-XXXXXXXXXX)
rootdir=$scriptdir/..
distro=$(cat /etc/*-release | sed -e "1q;d" | cut -d"=" -f2)

check_install_dependencies() {
	sudo -E $scriptdir/install_dependencies_docker.sh
}


check_preinstall_dependencies() {
        dependencies="wget curl git"
        if [ $distro == "Ubuntu" ]; then
                deps_check=$(dpkg -l $dependencies 2>&1 | awk '{if (/^D|^\||^\+/) {next} else if(/^dpkg-query:/) { print $6} else if(!/^[hi]i/) {print $2}}')
                echo $deps_check

                if [[ ! -z "$deps_check" ]]; then
                        echo "Missing the following prerequisite dependencies: $dependencies"
                        echo "Please apt install $dependencies"
			exit 1
                fi
        else
                echo "This setup script only works on Ubuntu OS (18.04 LTS)"
                exit 1
        fi
}

network_warning() {
echo "No active network connectivity"
cat << EOF
It is either your system is offline or behind corporate proxy
Please configure the proxy appropriately before proceed with this script
========================================================================
export http_proxy=<url>:<port>
export https_proxy=<url>:<port>
========================================================================
EOF
}

check_networking() {
	wget -q --spider -T 3 www.google.com
	if [ $? -ne 0 ];
	then
		network_warning
		exit 1
	fi
}

gitproxy_warning() {
cat << EOF
Warning:
You might not have configure gitproxy. If you are behind corporate proxy
you are advisable to configure the gitproxy
EOF
}

check_gitproxy () {
	if [[ -f "~/.gitconfig" ]];
	then	
		gitproxy=`env | grep ^GIT_PROXY_COMMAND | cut -d'=' -f2`
		gitconfig=`grep gitproxy ~/.gitconfig | cut -d'=' -f2`
		if [ -z "$gitconfig" -a -z "$gitproxy" ]
		then
			gitproxy_warning
			git config --global url."git@github.com:".insteadOf "https://github.com/"			
			git config --global url."https://github.com/".insteadOf "git://github.com/"
			git config --global http.proxy $http_proxy
		fi
	else
		gitproxy_warning
		git config --global url.https://github.com/.insteadOf git://github.com/
		git config --global http.proxy $http_proxy
	fi
}

check_setup_tls_docker() {
    cd $scriptdir/.. 
    sudo -E docker-compose build
    sudo -E docker-compose up -d
}

check_setup_cvat_docker() {
    echo "Setup OpenCV CVAT Annotation Tool"
    rm -rf $scriptdir/../webservices/components/cvat
    git clone https://github.com/opencv/cvat $scriptdir/../webservices/components/cvat
    cd $scriptdir/../webservices/components/cvat
    git checkout tags/v2.0.0

cat << EOF >> ./cvat-ui/src/styles.scss

.cvat-header.ant-layout-header {
    visibility: hidden;
    height: 0px;
}

.ant-layout-header.cvat-annotation-header {
	visibility: hidden;
	height: 0px;
}
EOF

	sed -i "s/node:lts-slim/node:16.18.1-slim/" Dockerfile.ui
	sed -i "s/openvino\/cvat_server/openvino\/cvat_server:v2.0.0/" docker-compose.yml

    export CVAT_HOST=traefik
    sudo -E docker-compose -f docker-compose.yml -f docker-compose.dev.yml build cvat_ui
    sudo -E docker-compose up -d
    echo "Waiting for CVAT to be ready ..."
	sleep 60
	sudo -E docker exec -it cvat bash -c "python3 ~/manage.py shell -c 'from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser("'"admin"'", "'"admin@mail.com"'",  "'"password"'")'"
}

create_tls_datastore() {
	sudo rm -rf /opt/intel/tls
	sudo mkdir -p /opt/intel/tls/dataset 
	sudo mkdir -p /opt/intel/tls/datatrain 
	sudo mkdir -p /opt/intel/tls/rabbitmq
	sudo mkdir -p /opt/intel/tls/mongodb/data
	sudo mkdir -p /opt/intel/tls/mongodb/tmp
	sudo mkdir -p /opt/intel/tls/redis
	sudo mkdir -p /opt/intel/tls/redis_etc
	sudo mkdir -p /opt/intel/tls/tmp
	sudo mkdir -p /opt/intel/tls/tmp_tf
	sudo mkdir -p /opt/intel/tls/proxy/{etc,cache,log,run,tmp}
}

check_folder_perm() {
	TLSUSER="tls"
	TLSUID="1688"

	if ! id "tls" >/dev/null 2>&1; then
		sudo groupadd $TLSUSER -g $TLSUID
		sudo useradd -r -u $TLSUID -g $TLSUSER $TLSUSER
	fi

	sudo chown -R $TLSUSER:$TLSUSER /opt/intel/tls/{dataset,datatrain,tmp,tmp_tf,proxy}
	sudo chmod -R ug+rwx /opt/intel/tls
	sudo chmod -R ug+rwx /opt/intel/tls/dataset
	sudo chmod -R ug+rwx /opt/intel/tls/datatrain
	sudo chmod -R ug+rwx /opt/intel/tls/tmp
	sudo chmod -R ug+rwx /opt/intel/tls/tmp_tf
	sudo chmod -R ug+rwx /opt/intel/tls/redis
	sudo chmod -R ug+rwx /opt/intel/tls/redis_etc
	sudo chmod -R ug+rwx /opt/intel/tls/proxy
	sudo chmod -R ug+rwx /opt/intel/tls/rabbitmq
 
  	sudo chown -R $TLSUSER:$TLSUSER $scriptdir/security/TLS_apiui_cert.crt
  	sudo chown -R $TLSUSER:$TLSUSER $scriptdir/security/TLS_apiui_key.pem
	sudo chown -R $TLSUSER:$TLSUSER $scriptdir/security/TLS_core_cert.crt
  	sudo chown -R $TLSUSER:$TLSUSER $scriptdir/security/TLS_core_key.pem
	sudo chown -R $TLSUSER:$TLSUSER $scriptdir/security/TLS_server_cert.crt
  	sudo chown -R $TLSUSER:$TLSUSER $scriptdir/security/TLS_server_key.pem
}

copy_userguide(){
    mkdir -p $scriptdir/../webservices/apiserver/documentation
    cp $scriptdir/../doc/*.pdf $scriptdir/../webservices/apiserver/documentation/TLS_2.0_User_Guide.pdf
}

copy_userguide
check_preinstall_dependencies
check_networking
check_gitproxy
check_install_dependencies
check_setup_cvat_docker
create_tls_datastore
check_folder_perm
check_setup_tls_docker

echo "Setup Completed. Please reboot your system before proceed to https://<system_ip> in your browser"
