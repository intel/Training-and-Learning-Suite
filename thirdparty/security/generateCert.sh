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

check_install_dependencies() {
    echo "Setup Dependencies & Repositories"
    sudo -E apt update
    sudo -E apt install -y nodejs npm
    sudo -E npm install --save pbkdf2-sha256
}

generate_ca_cert() {
rm -rf ca cakey.pem cacert.pem
mkdir ca
openssl req -config openssl.cnf -x509 -days 3650 -newkey rsa:4096 -keyout ca/ca_key.pem -out ca/ca_certificate.pem -outform PEM -subj "/CN=TLSCertSelfSignedRootCA/L=\$\$\$\$/" -nodes
openssl x509 -in ca/ca_certificate.pem -out ca/ca_certificate.der -outform DER
}

generate_keypair() {
# remove old key cert csr
rm -rf *.csr *.pem *.crt *.ext

# generate Server Key & Cert

localip=$(hostname -I | awk '{print $1}')
>SAN.ext cat <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
IP.1 = ${localip}
EOF

openssl genrsa  -out TLS_server_key.pem 6144 
openssl req -new -key  TLS_server_key.pem -out TLS_server_cert.csr -subj "/L=\$\$\$/O=Client/CN=TLS_server"
openssl x509 -req -days 365 -sha256 -CA ca/ca_certificate.pem -CAkey ca/ca_key.pem -CAcreateserial -in TLS_server_cert.csr -out TLS_server_cert.crt -extfile SAN.ext
rm -rf TLS_server_cert.csr

# generate TLS Core Key & Cert [stored in docker secret]
openssl genrsa -out TLS_core_key.pem 3072 
openssl req -new -key  TLS_core_key.pem -out  TLS_core_cert.csr -subj "/L=\$\$\$/O=Client/CN=TLS_core"
openssl x509 -req -days 365 -sha256 -CA ca/ca_certificate.pem -CAkey ca/ca_key.pem -CAcreateserial -in TLS_core_cert.csr -out TLS_core_cert.crt
rm -rf TLS_core_cert.csr

# generate TLS Api Ui Key & Cert [stored in docker secret]
openssl genrsa -out TLS_apiui_key.pem 2048 
openssl req -new -key  TLS_apiui_key.pem -out  TLS_apiui_cert.csr -subj "/L=\$\$\$/O=Client/CN=TLS_apiui"
openssl x509 -req -days 365 -sha256 -CA ca/ca_certificate.pem -CAkey ca/ca_key.pem -CAcreateserial -in TLS_apiui_cert.csr -out TLS_apiui_cert.crt 
rm -rf TLS_apiui_cert.csr

# generate MongoDB Key & Cert
openssl genrsa -out TLS_mongodb_key.pem 3072 
openssl req -new -key  TLS_mongodb_key.pem -out  TLS_mongodb_cert.csr -subj "/L=\$\$\$/O=Client/CN=TLS_mongodb"
openssl x509 -req -days 365 -sha256 -CA ca/ca_certificate.pem -CAkey ca/ca_key.pem -CAcreateserial -in TLS_mongodb_cert.csr -out TLS_mongodb_cert.crt 
cat TLS_mongodb_key.pem TLS_mongodb_cert.crt > TLS_mongodb.pem
rm -rf TLS_mongodb_cert.csr TLS_mongodb_key.pem TLS_mongodb_cert.crt

# generate Redis Key & Cert
openssl genrsa  -out TLS_redis_key.pem 3072 
openssl req -new -key  TLS_redis_key.pem -out TLS_redis_cert.csr -subj "/L=\$\$\$/O=Client/CN=TLS_rabbitmq"
openssl x509 -req -days 365 -sha256 -CA ca/ca_certificate.pem -CAkey ca/ca_key.pem -CAcreateserial -in TLS_redis_cert.csr -out TLS_redis_cert.crt 
rm -rf TLS_redis_cert.csr

# generate RabbitMQ Key & Cert
openssl genrsa  -out TLS_rabbitmq_key.pem 3072 
openssl req -new -key  TLS_rabbitmq_key.pem -out TLS_rabbitmq_cert.csr -subj "/L=\$\$\$/O=Client/CN=TLS_rabbitmq"
openssl x509 -req -days 365 -sha256 -CA ca/ca_certificate.pem -CAkey ca/ca_key.pem -CAcreateserial -in TLS_rabbitmq_cert.csr -out TLS_rabbitmq_cert.crt -extfile SAN.ext
rm -rf TLS_rabbitmq_cert.csr
}

check_install_dependencies
generate_ca_cert

echo '== TLS Account Setup =='
read -p 'Username: ' username
read -p 'Password (min 6 characters):' password
hashpass=$(node -e "const pbkdf2 = require('pbkdf2-sha256');console.log(pbkdf2('$password','$password',10000,32).toString('base64'))")
cat <<EOF > TLS_apiui_username.txt
${username}
EOF
cat <<EOF > TLS_apiui_pass.txt
${hashpass}
EOF

echo '== RabbitMQ Account Setup =='
read -p 'Username: ' rbusername
read -p 'Password (min 6 characters):' rbpassword

cat <<EOF > TLS_mqtt_username.txt
${rbusername}
EOF
cat <<EOF > TLS_mqtt_pass.txt
${rbpassword}
EOF


sleep 2

echo '== Generating Random MongoDB Username & Password =='
mongouser=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
mongopass=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
echo 'MongoDB Username: ' $mongouser
echo 'MongoDB Password: ' $mongopass
cat <<EOF > TLS_mongodb_username.txt
${mongouser}
EOF
cat <<EOF > TLS_mongodb_pass.txt
${mongopass}
EOF

sleep 2

echo '== Generating Random Redis Password =='
redispass=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w ${1:-32} | head -n 1)
echo 'Redis Password: ' $redispass
cat <<EOF > TLS_redis_username.txt
${redisuser}
EOF
cat <<EOF > TLS_redis_pass.txt
${redispass}
EOF


generate_keypair


