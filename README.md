## Training & Learning Suite 2.0

### Requirements

- Training & Learning Suite 2.0 software will run on the below mentioned Intel platforms:

```
* 6th generation Intel® CoreTM processor onwards OR
  6th generation Intel® Xeon® processor onwards
* At least 32GB RAM
* An internet connection
* Ubuntu 18.04
```

### Preparation ###

1. `Important` If the system network is running behind a proxy, please configure the proxy setting for system before proceed. Once the proxy has been configured, the installer will use the same proxy for internet connectivity for package installation, including docker proxy setup as well.

2. **[Note]** If previously the system installed with Training & Learning Suite 2.0 containers and wish to clean up all the old containers and images, use the command below to remove `all Training & Learning Suite 2.0 related containers and images` in the system.

      ```
      cd <training_and_learning_suite_2.0_repo>/thirdparty

      sudo ./cleanup_docker.sh
      ```

3. `Optional` If the network of the system is running behind proxy, please configure the proxy for both http and https:

      ```
      export http_proxy=http://<user.pass>@<company>:<server_port> 
      export https_proxy=http://<user.pass>@<company>:<server_port> 
      
      ```

### Training & Learning Suite 2.0 Docker Mode Installation

1. Installing dependencies packages using command below:
      ```
      sudo apt-get install -y wget curl git
      ```

2. Generate security certificates using command below. In this step, user will be required to input 2 sets of username and password
      ```
      cd <training_and_learning_suite_2.0_repo>/thirdparty/security

      # execute without sudo
      ./generateCert.sh
      ```

3. Training & Learning Suite 2.0 Setup in Docker Mode:
      ```
      cd <training_and_learning_suite_2.0_repo>/thirdparty

      # execute without sudo
      ./setup_TLS_docker.sh
      ```

4. Once setup_TLS_docker.sh is successful, user can access Training & Learning Suite 2.0 web UI through Chrome browser using URL below:
 * Access Training & Learning Suite from 2.0 remote system: `https://<System IP>/`
 * Access Training & Learning Suite from 2.0 local system: `https://localhost/`
