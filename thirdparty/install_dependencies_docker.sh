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
targetfile=(l_openvino_toolkit*)
openvinotoolkit=${targetfile[0]}
rootdir=$scriptdir/..
distro=$(cat /etc/*-release | sed -e "1q;d" | cut -d"=" -f2)
RED=$(tput setaf 1)
GREEN=$(tput setaf 2)

check_for_errors()
{
    return_code=${1}
    error_msg=${2}
    if [ "${return_code}" -ne "0" ];then
        echo "${RED}ERROR : (Err Code: ${return_code}) ${error_msg}${NC}"
        exit 1
    else
        if [ "$#" -ge "3" ];then
            success_msg=${3}
            echo ${success_msg}
        fi
    fi
    return 0
}

check_install_dependencies() {
    echo "Setup Dependencies & Repositories"
    apt update
    apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
    apt update
    apt install -y docker-ce
    usermod -aG docker $USER
    curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
}

dns_server_settings()
{
    UBUNTU_VERSION=$(grep "DISTRIB_RELEASE" /etc/lsb-release | cut -d "=" -f2)
    echo "${GREEN}Updating correct DNS server details in /etc/resolv.conf${NC}"

    # DNS server settings for Ubuntu 18.04 or later
    VERSION_COMPARE=$(echo "${UBUNTU_VERSION} >= 18.04" | bc)
    if [ ${VERSION_COMPARE} -eq "1" ];then
        if [ -f "/run/systemd/resolve/resolv.conf" ];then
            sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf
            #Verify on the host
            echo "${GREEN}Udpated DNS server details on host machine${NC}"
            cat /etc/resolv.conf
        fi
    fi

    return 0
}

proxy_enabled_network()
{
    if [ -z $http_proxy ]; then
        echo "${GREEN}Proceed Docker setup without proxy setting.${NC}"
    else
        echo "${GREEN}Proceed Docker setup with proxy setting: ${http_proxy} ${NC}"

        if [ ! -z "$http_proxy" ]; then
            if [[ $http_proxy =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\:[0-9]{2,5}$ ]]; then
                echo "${GREEN}Continuing with given proxy. Please wait...${NC}"
            elif [[ "$http_proxy" =~ ^[a-zA-Z] && $http_proxy =~ :[0-9]{2,5} ]] && [[ $http_proxy != *['!'@#\$%^\&*()_+]* ]];then
                echo "${GREEN}Continuing with given proxy. Please wait...${NC}"
            else
                echo "${RED}Wrong proxy address. Please check http_proxy setting.${NC}"
                return 1
            fi
        else
            echo "${RED}Proxy is empty${NC}"
            echo "${YELLOW}Please make sure http_proxy and https_proxy are set${NC}"
            return 1
        fi


        mkdir ~/.docker
        cd ~/.docker

# indentation is skipped for below echo command to write the data in json file
echo "{
\"proxies\":
{
\"default\":
{
\"httpProxy\": \"$http_proxy\",
\"httpsProxy\": \"$http_proxy\",
\"noProxy\": \"127.0.0.1,localhost\"
}
}
}" > ~/.docker/config.json

        cd $rootdir

        # 2. HTTP/HTTPS proxy
        if [ -d /etc/systemd/system/docker.service.d ];then
            sudo rm -rf /etc/systemd/system/docker.service.d
            check_for_errors "$?" "Failed to remove existing docker.service.d directory. Please check logs."
        fi
        if [ ! -d /etc/systemd/system/docker.service.d ];then
            sudo mkdir -p /etc/systemd/system/docker.service.d
            sudo touch /etc/systemd/system/docker.service.d/http-proxy.conf
            
        else
            if [ ! -f /etc/systemd/system/docker.service.d/http-proxy.conf ];then
                sudo touch /etc/systemd/system/docker.service.d/http-proxy.conf
                
            fi
        fi

        sudo chmod 666 /etc/systemd/system/docker.service.d/http-proxy.conf
       
        sudo echo "[Service]" > /etc/systemd/system/docker.service.d/http-proxy.conf
        sudo echo "Environment=\"HTTP_PROXY=$http_proxy/\"" >> /etc/systemd/system/docker.service.d/http-proxy.conf
        sudo echo "Environment=\"http_proxy=$http_proxy/\"" >> /etc/systemd/system/docker.service.d/http-proxy.conf
        sudo echo "Environment=\"HTTPS_PROXY=$http_proxy/\"" >> /etc/systemd/system/docker.service.d/http-proxy.conf
        sudo echo "Environment=\"https_proxy=$http_proxy/\"" >> /etc/systemd/system/docker.service.d/http-proxy.conf
        sudo echo "Environment=\"HTTP_PROXY=$http_proxy/\"" >> /etc/systemd/system/docker.service.d/http-proxy.conf
        sudo echo "Environment=\"NO_PROXY=localhost,127.0.0.1,localaddress,.intel.com/\"" >> /etc/systemd/system/docker.service.d/http-proxy.conf
        check_for_errors "$?" "Failed to update http-proxy.conf files. Please check logs."

        # Flush the changes
        sudo systemctl daemon-reload
        check_for_errors "$?" "Failed to flush the changes. Please check logs."

        # Restart docker
        sudo systemctl restart docker
        check_for_errors "$?" "Failed to restart docker service. Please check logs."

        dns_server_settings
    fi

    return 0
}

check_install_dependencies
proxy_enabled_network
