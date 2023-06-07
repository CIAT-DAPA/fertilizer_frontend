// Define an empty map for storing remote SSH connection parameters
def remote = [:]

pipeline {

    agent any

    environment {
        user = credentials('fertalizer_user')
        host = credentials('fertalizer_host')
        name = credentials('fertalizer_name')
        ssh_key = credentials('fertalizer_devops')
    }

    stages {
        stage('Ssh to connect Tesla server') {
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
                        cd /var/www/docs/front_back/
                        sudo kill -9 \$(sudo netstat -nepal | grep "0.0.0.0:3000" | awk '{print \$9}' | awk -F '/' '{print \$1}')
                        rm -fr front_backup_\$(date +"%Y%m%d")
                        mv /var/www/docs/agroadvisory/ front_backup_\$(date +"%Y%m%d")
                        rm -fr releaseFront.zip
                        curl -LOk https://github.com/CIAT-DAPA/fertilizer_frontend/releases/latest/download/releaseFront.zip
                        unzip -o releaseFront.zip
                        rm -fr releaseFront.zip
                        mkdir agroadvisory
                        mv src/build/* agroadvisory
                        rm -fr src
                        mv agroadvisory/ /var/www/docs/
                    """
                }
            }
        }
        stage('Init Front End') {
            steps {
                script {
                    sshCommand remote: remote, command: """
                        cd /var/www/docs/agroadvisory/
                        pm2 serve agroadvisory 3000 --name agroadvisory --spa
                    """
                }
            }
        }
    }
    
    post {
        failure {
            script {
                echo 'fail'
            }
        }

        success {
            script {
                echo 'everything went very well!!'
            }
        }
    }
 
}
