// Define an empty map for storing remote SSH connection parameters
def remote = [:]

pipeline {

    agent any

    environment {
        user = credentials('agroadvisory_user')
        host = credentials('agroadvisory_host')
        name = credentials('agroadvisory_name')
        ssh_key = credentials('agroadvisory_key')
    }

    stages {
        stage('Ssh to connect 192.168.199.121 server') {
            steps {
                script {
                    // Set up remote SSH connection parameters
                    remote.allowAnyHosts = true
                    remote.identityFile = ssh_key
                    remote.user = user
                    remote.name = name
                    remote.host = host
                    
                }
            }
        }
        stage('Download latest release') {
            steps {
                script {
                    sshCommand remote: remote, command: """
                        cd /opt/nagroadvisory/front_back/
                        rm -fr front_backup_\$(date +"%Y%m%d")
                        mkdir front_backup_\$(date +"%Y%m%d")
                        cp -r /opt/nagroadvisory/front/* front_backup_\$(date +"%Y%m%d")
                        rm -fr releaseFront.zip
                        curl -LOk https://github.com/CIAT-DAPA/fertilizer_frontend/releases/latest/download/releaseFront.zip
                        unzip -o releaseFront.zip
                        rm -fr releaseFront.zip
                        cp -r src/build/* /opt/nagroadvisory/front/
                        rm -fr src
                    """
                }
            }
        }
    }
    
    post {
        failure {
            script {
                echo 'fail :c'
            }
        }

        success {
            script {
                echo 'everything went very well!!'
            }
        }
    }
 
}