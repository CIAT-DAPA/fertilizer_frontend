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
                        rm -fr front_backup_\$(date +"%Y%m%d")
                        mkdir front_backup_\$(date +"%Y%m%d")
                        cp -r /var/www/docs/agroadvisory/* front_backup_\$(date +"%Y%m%d")
                        rm -fr releaseFront.zip
                        curl -LOk https://github.com/CIAT-DAPA/fertilizer_frontend/releases/latest/download/releaseFront.zip
                        unzip -o releaseFront.zip
                        rm -fr releaseFront.zip
                        cp -r src/build/* /var/www/docs/agroadvisory/
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